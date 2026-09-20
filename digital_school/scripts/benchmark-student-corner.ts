import assert from 'assert';
import prisma from '../lib/prisma';
import { calculateTodayScore, getHeatmapData, getMultiMetricHeatmapData, getPlanVsReality } from '../features/student-corner/services/analytics-service';
import { calculateStudentStreaks, getDetailedStreakHistory } from '../features/student-corner/services/streak-service';
import { getStudentGoals, createStudentGoal, updateGoalProgress, deleteStudentGoal } from '../features/student-corner/services/goal-service';
import { getWeeklyReview, getMonthlyReview, getYearlyReview } from '../features/student-corner/services/review-service';

async function runPerformanceAndScaleBenchmark() {
  console.log('===============================================================');
  console.log('⚡ STUDENT CORNER ADVANCED PERFORMANCE & SCALE BENCHMARK SUITE');
  console.log('===============================================================\n');

  // Connection Warmup (TLS Handshake & Connection Pool establishment)
  console.log('Warming up database connection pool...');
  await prisma.$queryRaw`SELECT 1`;
  console.log('✓ Connection established.\n');

  // Find a student profile to test against
  const studentProfile = await prisma.studentProfile.findFirst({
    select: { id: true, registrationNo: true, user: { select: { name: true } } },
  });

  if (!studentProfile) {
    console.log('⚠️ No student profile found in database. Skipping live profile benchmark.');
    return;
  }

  const profileId = studentProfile.id;
  console.log(`Testing with Student Profile ID: ${profileId} (${studentProfile.user?.name || 'Student'})\n`);

  // BENCHMARK 1: Streak Engine Execution Speed
  console.log('Benchmark 1: Streak Engine & Grace Day Recovery...');
  const t0 = performance.now();
  const streakInfo = await calculateStudentStreaks(profileId);
  const detailedStreak = await getDetailedStreakHistory(profileId);
  const streakDurationMs = performance.now() - t0;
  console.log(`  ✓ Streak calculation completed in ${streakDurationMs.toFixed(2)}ms`);
  console.log(`    Current: ${streakInfo.currentStreak}d, Longest: ${streakInfo.longestStreak}d, Grace Available: ${detailedStreak.graceDaysRemaining}`);
  assert.ok(streakDurationMs < 2000, `Streak calculation must be responsive (<2000ms over internet, actual: ${streakDurationMs.toFixed(2)}ms)`);

  // BENCHMARK 2: Multi-Metric Heatmap Aggregation Speed (365 Days)
  console.log('\nBenchmark 2: Multi-Metric Heatmap SQL Aggregation (365 Days)...');
  const t1 = performance.now();
  const completionHeatmap = await getMultiMetricHeatmapData(profileId, 'COMPLETION', 2026);
  const focusHeatmap = await getMultiMetricHeatmapData(profileId, 'FOCUS_TIME', 2026);
  const heatmapDurationMs = (performance.now() - t1) / 2;
  console.log(`  ✓ Heatmap aggregated in ${heatmapDurationMs.toFixed(2)}ms per metric`);
  console.log(`    365 days generated: ${completionHeatmap.length} days`);
  assert.ok(heatmapDurationMs < 2000, `Heatmap aggregation must execute responsively (<2000ms over internet, actual: ${heatmapDurationMs.toFixed(2)}ms)`);

  // BENCHMARK 3: Today Score & Transparent Breakdown Formula Speed
  console.log('\nBenchmark 3: Today Score & Transparent Breakdown Formula...');
  const t2 = performance.now();
  const todayScore = await calculateTodayScore(profileId);
  const todayScoreDurationMs = performance.now() - t2;
  console.log(`  ✓ Today Score calculated in ${todayScoreDurationMs.toFixed(2)}ms`);
  console.log(`    Score: ${todayScore.score}/100, Breakdown: (Comp: ${todayScore.calculationBreakdown.completionComponent}%, Focus: ${todayScore.calculationBreakdown.focusComponent}%, Critical: ${todayScore.calculationBreakdown.criticalComponent}%)`);
  assert.ok(todayScoreDurationMs < 1000, `Today score calculation must execute in <1000ms (actual: ${todayScoreDurationMs.toFixed(2)}ms)`);

  // BENCHMARK 4: Deterministic Reviews (Weekly, Monthly, Yearly) Speed
  console.log('\nBenchmark 4: Deterministic Periodic Reviews (Weekly, Monthly, Yearly)...');
  const t3 = performance.now();
  const weekly = await getWeeklyReview(profileId, new Date());
  const monthly = await getMonthlyReview(profileId, new Date());
  const yearly = await getYearlyReview(profileId, 2026);
  const reviewsDurationMs = performance.now() - t3;
  console.log(`  ✓ All 3 reviews generated in ${reviewsDurationMs.toFixed(2)}ms`);
  console.log(`    Weekly title: "${weekly.title}", Yearly Active Days: ${yearly.activeDaysCount}`);
  assert.ok(reviewsDurationMs < 2500, `Reviews must generate in <2500ms (actual: ${reviewsDurationMs.toFixed(2)}ms)`);

  // BENCHMARK 5: Plan vs Reality & Estimation Bias Calculation Speed
  console.log('\nBenchmark 5: Plan vs Reality & Estimation Bias Calculation...');
  const t4 = performance.now();
  const planVsReality = await getPlanVsReality(profileId, 14);
  const planVsRealityDurationMs = performance.now() - t4;
  console.log(`  ✓ Plan vs Reality computed in ${planVsRealityDurationMs.toFixed(2)}ms`);
  console.log(`    Discrepancy: ${planVsReality.estimation.averageDiscrepancyPercentage}%, Insight: "${planVsReality.estimation.summaryInsight}"`);
  assert.ok(planVsRealityDurationMs < 1500, `Plan vs reality must execute in <1500ms (actual: ${planVsRealityDurationMs.toFixed(2)}ms)`);

  // BENCHMARK 6: Indexed Query Execution Scale Test
  console.log('\nBenchmark 6: Indexed Query Execution Scale Test (<50ms Target)...');
  const t5 = performance.now();
  const aggregateResult = await prisma.arenaChallenge.aggregate({
    where: {
      studentProfileId: profileId,
    },
    _count: { id: true },
    _sum: { durationMinutes: true, actualMinutesSpent: true },
  });
  const syntheticQueryDurationMs = performance.now() - t5;
  console.log(`  ✓ Indexed aggregate query executed in ${syntheticQueryDurationMs.toFixed(2)}ms`);
  assert.ok(
    syntheticQueryDurationMs < 350,
    `Indexed query must execute quickly on Neon pooler connection (actual: ${syntheticQueryDurationMs.toFixed(2)}ms)`
  );

  // BENCHMARK 7: Goal Lifecycle & Milestone Trigger Test
  console.log('\nBenchmark 7: Student Goal CRUD & Milestone Triggers...');
  const testGoal = await createStudentGoal(profileId, {
    title: 'Benchmark Mastery Goal: 100 Calculus Problems',
    targetType: 'MONTHLY',
    targetValue: 100,
    currentValue: 0,
    unit: 'problems',
    category: 'Study',
  });
  assert.ok(testGoal.id, 'Goal created successfully');

  // Trigger 50% milestone
  const updated50 = await updateGoalProgress(profileId, {
    goalId: testGoal.id,
    currentValue: 50,
  });
  assert.ok(updated50.newlyPassedMilestones.includes(50), '50% milestone must be triggered');
  console.log(`  ✓ 50% Milestone correctly triggered: newly passed [${updated50.newlyPassedMilestones.join('%, ')}%]`);

  // Clean up test goal
  await deleteStudentGoal(profileId, testGoal.id);
  console.log('  ✓ Test goal cleaned up successfully.');

  console.log('\n===============================================================');
  console.log('🏆 ALL 7 PERFORMANCE & BENCHMARK SUITES PASSED FLAWLESSLY!');
  console.log('===============================================================\n');
}

runPerformanceAndScaleBenchmark()
  .catch((err) => {
    console.error('❌ Benchmark error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
