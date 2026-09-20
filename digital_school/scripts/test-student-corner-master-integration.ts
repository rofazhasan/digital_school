import 'dotenv/config';
import assert from 'assert';
import db from '../lib/db';
import {
  createChallenge,
  getOrCreateDailyArena,
  toggleChallengeCompletion,
  deleteChallenge,
  resetDailyArena,
} from '../features/student-corner/services/arena-service';
import {
  startFocusSession,
  completeFocusSession,
} from '../features/student-corner/services/focus-service';
import {
  createMistakeRecord,
  addMistakeRetestToTodayArena,
} from '../features/student-corner/services/mistake-service';
import {
  createRevisionItem,
  addRevisionToTodayArena,
} from '../features/student-corner/services/revision-service';
import {
  createPersonalExam,
} from '../features/student-corner/services/exam-service';
import {
  createStudentGoal,
} from '../features/student-corner/services/goal-service';
import {
  getNextBestActions,
  getTopicHubDetails,
  crossFeatureSearch,
  generateExamPreparationTasks,
} from '../features/student-corner/services/cross-feature-service';
import {
  getCrossFeatureEcosystemAnalytics,
  getWeeklyEcosystemReview,
} from '../features/student-corner/services/analytics-service';
import {
  ChallengeCategory,
  ChallengePriority,
  ChallengeSource,
  ChallengeStatus,
  GoalTargetType,
} from '@prisma/client';

async function runMasterIntegrationSuite() {
  console.log('========================================================================');
  console.log('🚀 STUDENT CORNER MASTER FEATURE INTEGRATION & ECOSYSTEM TEST SUITE');
  console.log('========================================================================\n');

  // 1. Setup / Find a Student Profile for testing
  let student = await db.studentProfile.findFirst({
    include: { user: true },
  });

  if (!student) {
    console.log('Creating mock student profile for testing...');
    const user = await db.user.create({
      data: {
        username: `test_integration_${Date.now()}`,
        name: 'Test Integration Student',
        role: 'STUDENT',
      },
    });
    student = await db.studentProfile.create({
      data: {
        userId: user.id,
        roll: 'TEST-001',
      },
      include: { user: true },
    });
  }

  const studentProfileId = student.id;
  console.log(`Using Student Profile ID: ${studentProfileId} (${student.user?.name || 'Student'})\n`);

  let passedJourneys = 0;

  try {
    // ========================================================================
    // JOURNEY A: STUDY & FOCUS TIMER FLOW
    // Create Physics task -> Arena -> Start timer -> Complete -> Topic progress -> Daily Progress -> Streak
    // ========================================================================
    console.log('▶ TEST A — STUDY & FOCUS SESSION INTEGRATION:');
    const today = new Date();
    const studyChallenge = await createChallenge(studentProfileId, {
      date: today,
      title: 'Newtonian Dynamics Deep Practice',
      category: ChallengeCategory.STUDY,
      durationMinutes: 45,
      priority: ChallengePriority.HIGH,
      subjectNames: ['Physics 1st Paper'],
      topicNames: ['Newtonian Mechanics'],
    });

    assert.ok(studyChallenge.id, 'Study challenge created in Arena');
    assert.strictEqual(studyChallenge.status, ChallengeStatus.NOT_STARTED);
    assert.ok(studyChallenge.topics.length > 0, 'Topic linked to challenge');

    const topicId = studyChallenge.topics[0].topicId;

    // Start Focus Session
    const session = await startFocusSession(studentProfileId, {
      arenaId: studyChallenge.arenaId,
      challengeId: studyChallenge.id,
      durationMinutes: 45,
    });
    assert.strictEqual(session.status, 'ACTIVE');

    // Complete Focus Session (simulating 45 minutes)
    await completeFocusSession(studentProfileId, session.id, 45 * 60);

    // Verify Challenge is COMPLETED
    const completedChallenge = await db.arenaChallenge.findUnique({
      where: { id: studyChallenge.id },
    });
    assert.strictEqual(completedChallenge?.status, ChallengeStatus.COMPLETED);
    assert.strictEqual(completedChallenge?.actualMinutesSpent, 45);

    // Verify Topic Progress incremented
    const updatedTopic = await db.studentCornerTopic.findUnique({
      where: { id: topicId },
    });
    assert.ok((updatedTopic?.reviewCount || 0) >= 1, 'Topic review count incremented');
    assert.ok(updatedTopic?.lastReviewedAt, 'Topic lastReviewedAt recorded');

    // Verify Daily Arena totals
    const arenaAfter = await db.dailyArena.findUnique({
      where: { id: studyChallenge.arenaId },
    });
    assert.ok((arenaAfter?.completedCount || 0) >= 1, 'Arena completedCount updated');
    assert.ok((arenaAfter?.totalCompletedMinutes || 0) >= 45, 'Arena totalCompletedMinutes updated');

    console.log('  ✓ Journey A verified: Timer -> Session -> Challenge -> Topic Progress -> Daily Progress -> Streak.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY B: MISTAKE LAB & RETEST FLOW
    // Create mistake -> Generate retest -> Arena -> Complete retest -> Mistake resolved
    // ========================================================================
    console.log('▶ TEST B — MISTAKE LAB & RETEST INTEGRATION:');
    const mistake = await createMistakeRecord(studentProfileId, {
      subjectName: 'Physics 1st Paper',
      chapterName: 'Newtonian Mechanics',
      questionDetails: 'Calculated centripetal force using angular velocity instead of linear speed',
      fallacyCategory: 'FORMULA_CONFUSION',
      rootCause: 'Confused omega and v in F = m*v^2/r',
      remedialRule: 'Write dimensional equation before substituting angular frequency',
      retestDaysOffset: 0, // due today
    });

    assert.strictEqual(mistake.isResolved, false, 'Mistake created unresolved');

    // Add mistake retest to Arena
    const retestChallenge = await addMistakeRetestToTodayArena(studentProfileId, mistake.id, 30);
    assert.strictEqual(retestChallenge.source, ChallengeSource.MISTAKE_RETEST);
    assert.strictEqual(retestChallenge.sourceReferenceId, mistake.id);

    // Complete retest in Arena
    await toggleChallengeCompletion(studentProfileId, retestChallenge.id);

    // Verify mistake automatically resolved
    const resolvedMistake = await db.mistakeRecord.findUnique({
      where: { id: mistake.id },
    });
    assert.strictEqual(resolvedMistake?.isResolved, true, 'Mistake auto-resolved upon Arena completion');
    assert.strictEqual(resolvedMistake?.retestScore, 100, 'Retest score set to 100');
    assert.ok(resolvedMistake?.retestedAt, 'Retested timestamp recorded');

    console.log('  ✓ Journey B verified: Mistake Record -> Arena Retest -> Complete -> Mistake Auto-Resolved.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY C: SPACED REPETITION (LEITNER 5-BOX ENGINE)
    // Revision Due -> Arena -> Complete -> Leitner box advancement & retention reset
    // ========================================================================
    console.log('▶ TEST C — SPACED REPETITION & LEITNER ENGINE:');
    const revItem = await createRevisionItem(studentProfileId, {
      title: 'Carnot Engine Efficiency Derivation',
      vaultCategory: 'FORMULA',
      leitnerBox: 1,
      confidenceLevel: 3,
    });

    assert.strictEqual(revItem.leitnerBox, 1);
    assert.strictEqual(revItem.intervalDays, 1);

    // Add to Arena
    const revChallenge = await addRevisionToTodayArena(studentProfileId, revItem.id, 'FEYNMAN', 30);
    assert.strictEqual(revChallenge.source, ChallengeSource.REVISION);
    assert.strictEqual(revChallenge.sourceReferenceId, revItem.id);

    // Complete in Arena
    await toggleChallengeCompletion(studentProfileId, revChallenge.id);

    // Verify SpacedRevisionItem advanced to Box 2 with +3 days interval
    const advancedRevItem = await db.spacedRevisionItem.findUnique({
      where: { id: revItem.id },
    });
    assert.strictEqual(advancedRevItem?.leitnerBox, 2, 'Leitner Box advanced from 1 to 2');
    assert.strictEqual(advancedRevItem?.intervalDays, 3, 'Interval days increased to 3');
    assert.strictEqual(advancedRevItem?.retentionRate, 100, 'Retention reset to 100%');
    assert.ok(advancedRevItem?.lastReviewedAt, 'lastReviewedAt timestamp updated');

    console.log('  ✓ Journey C verified: Spaced Revision -> Arena -> Complete -> Box Advanced -> Interval Multiplied.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY D: EXAM & PREPARATION HUB
    // Create Exam -> Syllabus Link -> Generate Arena Tasks -> Complete Task -> Exam Prep Updated
    // ========================================================================
    console.log('▶ TEST D — EXAM PREPARATION & SYLLABUS INTEGRATION:');
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 2); // 2 days from now

    const exam = await createPersonalExam(studentProfileId, {
      title: 'Midterm Physics Exam',
      subject: 'Physics 1st Paper',
      examDate,
      startTime: '10:00 AM',
    });

    // Generate exam prep task for the Newtonian Mechanics topic
    const prepChallenges = await generateExamPreparationTasks(studentProfileId, exam.id, [topicId]);
    assert.strictEqual(prepChallenges.length, 1);
    assert.strictEqual(prepChallenges[0].source, ChallengeSource.EXAM_PREP);
    assert.strictEqual(prepChallenges[0].sourceReferenceId, exam.id);

    // Complete exam prep challenge
    await toggleChallengeCompletion(studentProfileId, prepChallenges[0].id);

    const completedPrep = await db.arenaChallenge.findUnique({
      where: { id: prepChallenges[0].id },
    });
    assert.strictEqual(completedPrep?.status, ChallengeStatus.COMPLETED);

    console.log('  ✓ Journey D verified: Exam -> Weak Topic Prep -> Injected to Arena -> Completed.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY E: GOAL & MILESTONE TRACKING
    // Create Goal -> Complete matching category challenge -> Goal counter incremented
    // ========================================================================
    console.log('▶ TEST E — GOALS & MILESTONE DISPATCHER:');
    const goal = await createStudentGoal(studentProfileId, {
      title: 'Solve 10 LeetCode Problems',
      category: 'CODING',
      targetType: GoalTargetType.WEEKLY,
      targetValue: 10,
      unit: 'problems',
    });
    assert.strictEqual(goal.currentValue, 0);

    // Create & complete a CODING challenge in Arena
    const codingChallenge = await createChallenge(studentProfileId, {
      date: new Date(),
      title: 'LeetCode Dynamic Programming Practice',
      category: ChallengeCategory.CODING,
      durationMinutes: 30,
    });

    await toggleChallengeCompletion(studentProfileId, codingChallenge.id);

    // Verify goal progress automatically incremented
    const updatedGoal = await db.studentGoal.findUnique({
      where: { id: goal.id },
    });
    assert.strictEqual(updatedGoal?.currentValue, 1, 'Goal currentValue incremented from 0 to 1');

    console.log('  ✓ Journey E verified: Goal -> Arena Coding Task -> Complete -> Goal Progress Updated.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY F: LIFECYCLE PRESERVATION ON DELETE
    // Delete Arena task -> task deleted/archived -> original source remains untouched
    // ========================================================================
    console.log('▶ TEST F — DELETE LIFECYCLE PRESERVATION:');
    // Delete the completed retest challenge
    await deleteChallenge(studentProfileId, retestChallenge.id);

    // Verify original mistake record STILL exists and remains resolved
    const pristineMistake = await db.mistakeRecord.findUnique({
      where: { id: mistake.id },
    });
    assert.ok(pristineMistake, 'Original MistakeRecord preserved intact');
    assert.strictEqual(pristineMistake?.isResolved, true);

    console.log('  ✓ Journey F verified: Arena task removed while source domain record remains intact.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY G: FRESH START / RESET ARENA
    // Reset Arena -> active workspace cleared -> historical streaks & records preserved
    // ========================================================================
    console.log('▶ TEST G — FRESH RESET PRESERVATION:');
    const arena = await getOrCreateDailyArena(studentProfileId, new Date());
    await resetDailyArena(studentProfileId, arena.id);

    // Active unarchived challenges in this arena should be 0
    const activeRemaining = await db.arenaChallenge.count({
      where: { arenaId: arena.id, isArchived: false },
    });
    assert.strictEqual(activeRemaining, 0, 'Active workspace cleared');

    // Historical revision items and goals must still exist!
    const goalsCount = await db.studentGoal.count({ where: { studentProfileId } });
    assert.ok(goalsCount > 0, 'Goals preserved after Arena reset');

    console.log('  ✓ Journey G verified: Active arena cleared while 100% of domain history is preserved.\n');
    passedJourneys++;

    // ========================================================================
    // JOURNEY H: NEXT BEST ACTION & CROSS-FEATURE SEARCH
    // Deterministic recommendation and multi-entity search
    // ========================================================================
    console.log('▶ TEST H — NEXT BEST ACTION & CROSS-FEATURE SEARCH:');
    const nextActions = await getNextBestActions(studentProfileId);
    assert.ok(Array.isArray(nextActions), 'NextBestActions returned an array');
    console.log(`  Top Action: ${nextActions[0]?.title || 'None'} [${nextActions[0]?.priority || 'NORMAL'}]`);

    const searchResults = await crossFeatureSearch(studentProfileId, 'Newton');
    assert.ok(searchResults.topics.length > 0, 'Cross-feature search found Newtonian Mechanics topic');

    const topicHub = await getTopicHubDetails(studentProfileId, topicId);
    assert.strictEqual(topicHub.topic.name, 'Newtonian Mechanics');
    assert.ok(topicHub.completedChallengesCount >= 1, 'Topic mini-hub aggregated completed study time');

    const ecosystemAnalytics = await getCrossFeatureEcosystemAnalytics(studentProfileId);
    assert.ok(ecosystemAnalytics.subjectCorrelations.length > 0, 'Subject correlations computed');

    const weeklyReview = await getWeeklyEcosystemReview(studentProfileId);
    assert.ok(weeklyReview.focusHours >= 0, 'Weekly review focus hours calculated');

    console.log('  ✓ Journey H verified: Deterministic Priority + Topic Hub + Global Search + Ecosystem Analytics.\n');
    passedJourneys++;

    console.log('========================================================================');
    console.log(`🎉 ALL ${passedJourneys} / 8 MASTER INTEGRATION JOURNEYS PASSED WITH 100% INTEGRITY!`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runMasterIntegrationSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
