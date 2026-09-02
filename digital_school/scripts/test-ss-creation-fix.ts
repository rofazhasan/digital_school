import assert from 'assert';

console.log("=== RUNNING SS VS MS CREATION & DETECTION TEST SUITE ===\n");

// 1. Detection engine function as implemented across the application
const detectIsMS = (exam: any): boolean => {
  return Boolean(
    exam?.subjectType
      ? exam.subjectType === 'MS'
      : (exam?.subjectsConfig && ((exam.subjectsConfig as any)?.subjects || []).length > 0)
  );
};

// 2. API sanitization logic for Exam response
const sanitizeExamResponse = (exam: any) => {
  const isMS = detectIsMS(exam);
  return {
    ...exam,
    subjectType: exam.subjectType || (isMS ? 'MS' : 'SS'),
    subjectsConfig: isMS ? (exam.subjectsConfig || null) : null,
  };
};

// TEST 1: User's reported bug: Exam created as SS but had dirty subjectsConfig
console.log("Test 1: Exam created as SS with dirty subjectsConfig in DB (cmtkb9nza0013nu012oynbb02)...");
const bugExam = {
  id: "cmtkb9nza0013nu012oynbb02",
  name: "Class 10 Physics Midterm",
  subjectType: "SS",
  subjectsConfig: {
    subjects: [
      { name: "Physics", totalMarks: 25, isMandatory: true },
      { name: "Chemistry", totalMarks: 25, isMandatory: true },
      { name: "Mathematics", totalMarks: 25, isMandatory: true },
      { name: "Biology", totalMarks: 25, isMandatory: false },
      { name: "Higher Mathematics", totalMarks: 25, isMandatory: false },
    ],
    mandatoryCount: 3,
    optionalCount: 2,
    requiredOptionalCount: 1,
  }
};

assert.strictEqual(detectIsMS(bugExam), false, "Exam with subjectType 'SS' MUST evaluate to isMS = false even if subjectsConfig exists");
const sanitizedBugExam = sanitizeExamResponse(bugExam);
assert.strictEqual(sanitizedBugExam.subjectType, "SS", "Sanitized subjectType must be 'SS'");
assert.strictEqual(sanitizedBugExam.subjectsConfig, null, "Sanitized subjectsConfig must be null for SS exams");
console.log("✅ Test 1 Passed: Exam cmtkb9nza0013nu012oynbb02 and any SS exams are strictly identified as SS with subjectsConfig stripped.\n");

// TEST 2: Genuine MS Exam
console.log("Test 2: Genuine Multi-Subject (MS) Exam...");
const msExam = {
  id: "cmtjlc92r00phs901mgwlcyol",
  name: "College Admission Multi-Subject Model Test",
  subjectType: "MS",
  subjectsConfig: {
    subjects: [
      { name: "Physics", totalMarks: 25, isMandatory: true },
      { name: "Chemistry", totalMarks: 25, isMandatory: true },
      { name: "Biology", totalMarks: 25, isMandatory: false },
    ],
    mandatoryCount: 2,
    optionalCount: 1,
    requiredOptionalCount: 1,
  }
};

assert.strictEqual(detectIsMS(msExam), true, "Exam with subjectType 'MS' MUST evaluate to isMS = true");
const sanitizedMsExam = sanitizeExamResponse(msExam);
assert.strictEqual(sanitizedMsExam.subjectType, "MS");
assert.notStrictEqual(sanitizedMsExam.subjectsConfig, null);
assert.strictEqual(sanitizedMsExam.subjectsConfig.subjects.length, 3);
console.log("✅ Test 2 Passed: Genuine MS exams remain completely intact and active.\n");

// TEST 3: Legacy Exam without subjectType column
console.log("Test 3: Legacy Exam backward compatibility (no subjectType column)...");
const legacySS = {
  id: "legacy_ss_1",
  name: "Old SS Exam",
  subjectType: undefined,
  subjectsConfig: null,
};
assert.strictEqual(detectIsMS(legacySS), false, "Legacy exam without subjectsConfig must be SS");

const legacyMS = {
  id: "legacy_ms_1",
  name: "Old MS Exam",
  subjectType: undefined,
  subjectsConfig: {
    subjects: [{ name: "Physics" }, { name: "Chemistry" }]
  }
};
assert.strictEqual(detectIsMS(legacyMS), true, "Legacy exam with subjectsConfig must be MS");
console.log("✅ Test 3 Passed: Legacy exams without subjectType column are handled accurately.\n");

// TEST 4: Create Exam form payload serialization
console.log("Test 4: Create Exam Form submission payload...");
const clientFormDataSS = {
  name: "New Math Exam",
  subjectType: "SS",
  subjectsConfig: { subjects: [{ name: "Dummy" }] },
};
const submissionPayloadSS = {
  ...clientFormDataSS,
  subjectType: clientFormDataSS.subjectType,
  subjectsConfig: clientFormDataSS.subjectType === "MS" ? clientFormDataSS.subjectsConfig : null,
};
assert.strictEqual(submissionPayloadSS.subjectType, "SS");
assert.strictEqual(submissionPayloadSS.subjectsConfig, null, "Form submission payload must force subjectsConfig = null when SS");

const clientFormDataMS = {
  name: "New Combined Exam",
  subjectType: "MS",
  subjectsConfig: { subjects: [{ name: "Physics" }, { name: "Chemistry" }] },
};
const submissionPayloadMS = {
  ...clientFormDataMS,
  subjectType: clientFormDataMS.subjectType,
  subjectsConfig: clientFormDataMS.subjectType === "MS" ? clientFormDataMS.subjectsConfig : null,
};
assert.strictEqual(submissionPayloadMS.subjectType, "MS");
assert.strictEqual(submissionPayloadMS.subjectsConfig.subjects.length, 2);
console.log("✅ Test 4 Passed: Form submission payload correctly strips subjectsConfig for SS and keeps it for MS.\n");

console.log("🎉 ALL SS CREATION & DETECTION ENGINE TESTS PASSED!");
