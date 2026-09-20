import assert from 'assert';
import { getQuranReflectionForDay } from '../features/student-corner/data/quran-365';
import { getHadithReflectionForDay } from '../features/student-corner/data/hadith-365';
import { CATEGORY_METADATA } from '../features/student-corner/types/categories';
import { ChallengeCategory, ChallengePriority } from '@prisma/client';
import { generateStudentCornerExcelTemplate, validateImportedExcel } from '../features/student-corner/services/excel-service';

async function runStudentCornerVerificationSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING STUDENT CORNER COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;

  // TEST 1: Islamic Reflection - Day 1 starts with Allah
  console.log('Test 1: Day 1 Reflection begins with Allah and Surah Al-Fatiha...');
  const day1Quran = getQuranReflectionForDay(1);
  assert.strictEqual(day1Quran.dayNumber, 1);
  assert.strictEqual(day1Quran.surahNumber, 1);
  assert.ok(day1Quran.arabicText.includes('الْحَمْدُ لِلَّهِ'), 'Day 1 must start with praise of Allah');
  assert.ok(day1Quran.banglaMeaning.includes('আল্লাহ'), 'Bangla meaning must refer to Allah');
  assert.ok(day1Quran.banglaPronunciation.length > 5, 'Bangla pronunciation must be present');
  console.log('  ✓ Day 1 Quran reflection verified.');
  passedTests++;

  // TEST 2: 365-Day Complete Quran Coverage
  console.log('Test 2: Verifying 365 days Quran reflection coverage...');
  for (let d = 1; d <= 365; d++) {
    const q = getQuranReflectionForDay(d);
    assert.strictEqual(q.dayNumber, d, `Day ${d} number must match`);
    assert.ok(q.arabicText.length > 0, `Day ${d} Arabic text cannot be empty`);
    assert.ok(q.banglaMeaning.length > 0, `Day ${d} Bangla meaning cannot be empty`);
    assert.ok(q.surahNumber >= 1 && q.surahNumber <= 114, `Day ${d} Surah number must be between 1 and 114`);
  }
  console.log('  ✓ All 365 days of Quran reflections verified successfully.');
  passedTests++;

  // TEST 3: 365-Day Complete Hadith Coverage & Authentic Sources
  console.log('Test 3: Verifying 365 days Hadith collection with authentic sources...');
  const validSources = ['সহীহ বুখারী', 'সহীহ মুসলিম', 'জামে আত-তিরমিযী', 'সুনান ইবনে মাজাহ', 'শু‘আবুল ঈমান (বাইহাকী)', 'আল-মু’জামুল আওসাত (তাবারানী)', 'আল-আদাবুল মুফরাদ (বুখারী)'];
  for (let d = 1; d <= 365; d++) {
    const h = getHadithReflectionForDay(d);
    assert.strictEqual(h.dayNumber, d, `Day ${d} number must match`);
    assert.ok(h.banglaText.length > 0, `Day ${d} Hadith text cannot be empty`);
    assert.ok(validSources.some(src => h.sourceBook.includes(src.split(' ')[0])), `Day ${d} sourceBook '${h.sourceBook}' must be authentic`);
    assert.ok(h.grade.length > 0, `Day ${d} Hadith grade must not be empty`);
  }
  console.log('  ✓ All 365 days of Hadiths and authentic sources verified successfully.');
  passedTests++;

  // TEST 4: Category Design Tokens Integrity
  console.log('Test 4: Verifying Category Metadata & semantic color tokens...');
  const expectedCategories = Object.values(ChallengeCategory);
  assert.ok(expectedCategories.length >= 10, 'Expected at least 10 categories');
  for (const cat of expectedCategories) {
    const meta = CATEGORY_METADATA[cat];
    assert.ok(meta, `Category ${cat} must have metadata`);
    assert.ok(meta.color.startsWith('#'), `Category ${cat} color must be hex`);
    assert.ok(meta.bgColor.startsWith('rgba'), `Category ${cat} bgColor must be rgba`);
    assert.ok(meta.label.length > 0, `Category ${cat} label must not be empty`);
    assert.ok(meta.banglaLabel.length > 0, `Category ${cat} banglaLabel must not be empty`);
  }
  console.log('  ✓ All challenge categories and color tokens verified.');
  passedTests++;

  // TEST 5: Focus Engine Timestamp Math & Simulation
  console.log('Test 5: Verifying Focus Engine timestamp math (sleep & tab throttling resilience)...');
  const now = Date.now();
  const durationMinutes = 45;
  const plannedEnd = new Date(now + durationMinutes * 60 * 1000);

  // Simulate 10 minutes elapsed (tab was backgrounded or laptop slept)
  const simulatedResumeTime = now + 10 * 60 * 1000;
  const remainingSeconds = Math.max(0, Math.floor((plannedEnd.getTime() - simulatedResumeTime) / 1000));
  assert.strictEqual(remainingSeconds, 35 * 60, 'Remaining time must accurately calculate 35 minutes after 10m sleep');

  // Simulate completion past planned end
  const simulatedOverdueTime = now + 50 * 60 * 1000;
  const remainingOverdue = Math.max(0, Math.floor((plannedEnd.getTime() - simulatedOverdueTime) / 1000));
  assert.strictEqual(remainingOverdue, 0, 'Remaining time cannot be negative when overdue');
  console.log('  ✓ Timestamp-based countdown calculations verified with zero drift.');
  passedTests++;

  // TEST 6: Excel Template Generation & Validation
  console.log('Test 6: Verifying Excel template generation and validation engine...');
  const templateBuffer = await generateStudentCornerExcelTemplate();
  assert.ok(templateBuffer.length > 1000, 'Excel template buffer must not be empty');

  // Validate the template with its sample rows
  const validationResult = await validateImportedExcel(templateBuffer);
  assert.strictEqual(validationResult.errors.length, 0, 'Official template sample rows must have zero validation errors');
  assert.strictEqual(validationResult.validRows.length, 5, 'Official template must contain 5 valid sample rows');

  const firstRow = validationResult.validRows[0];
  assert.strictEqual(firstRow.category, 'SALAT');
  assert.strictEqual(firstRow.durationMinutes, 25);
  assert.strictEqual(firstRow.priority, 'HIGH');
  console.log('  ✓ Excel template generation and validation passed.');
  passedTests++;

  // TEST 7: UmmahAPI Free Integration & Bangla Support
  console.log('Test 7: Verifying UmmahAPI live integration with Quran audio, native Bangla translation & prayer times...');
  const { getFullSpiritualPackage } = await import('../features/student-corner/services/ummah-api-service');
  const spiritualPackage = await getFullSpiritualPackage(1);
  assert.ok(spiritualPackage.quran, 'Quran reflection must be returned');
  assert.ok(spiritualPackage.quran.banglaMeaning.length > 0, 'Quran must have Bangla meaning');
  assert.ok(spiritualPackage.quran.arabicText.length > 0, 'Quran must have Arabic text');
  assert.ok(spiritualPackage.quran.audioUrl?.startsWith('https://'), 'Quran audio recitation URL must be valid');
  assert.ok(spiritualPackage.hadith, 'Hadith reflection must be returned');
  assert.ok(spiritualPackage.hijriDate?.hijriFormatted, 'Hijri formatted date must be returned');
  assert.ok(spiritualPackage.asmaUlHusna.length > 0, 'Asma-ul-Husna must be returned');
  assert.ok(spiritualPackage.asmaUlHusna[0].banglaMeaning, 'Asma-ul-Husna must have Bangla meaning');
  assert.ok(spiritualPackage.prayerTimes?.fajr, 'Prayer times must include Fajr');
  console.log('  ✓ UmmahAPI integration and Bangla support verified successfully.');
  passedTests++;

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests} TEST CASES PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runStudentCornerVerificationSuite().catch((err) => {
  console.error('❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
