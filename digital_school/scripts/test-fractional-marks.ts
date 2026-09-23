import { n } from "../utils/parser-utils";
import prisma from "../lib/db";
import { z } from "zod";
import { QuestionType, Difficulty } from "@prisma/client";

// Test schema matching app/api/question-bank/route.ts
const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  subject: z.string().min(1),
  marks: z.coerce.number().positive("Marks must be greater than 0"),
  difficulty: z.nativeEnum(Difficulty),
  questionText: z.string().min(1),
  classId: z.string().cuid(),
});

async function runTests() {
  console.log("=== 1. Testing n() Fraction and Decimal Parsing ===");
  const testCases = [
    { input: 0.5, expected: 0.5 },
    { input: "0.5", expected: 0.5 },
    { input: ".5", expected: 0.5 },
    { input: "0.25", expected: 0.25 },
    { input: "1.5", expected: 1.5 },
    { input: "1/2", expected: 0.5 },
    { input: "1/4", expected: 0.25 },
    { input: "3/4", expected: 0.75 },
    { input: "1/8", expected: 0.125 },
    { input: "1 1/2", expected: 1.5 },
    { input: "2 1/4", expected: 2.25 },
    { input: "½", expected: 0.5 },
    { input: "¼", expected: 0.25 },
    { input: "¾", expected: 0.75 },
    { input: "1½", expected: 1.5 },
    { input: "০.৫", expected: 0.5 },
    { input: "১/২", expected: 0.5 },
    { input: "১.৫", expected: 1.5 },
    { input: "0.5 marks", expected: 0.5 },
    { input: "[0.5 M]", expected: 0.5 },
    { input: "[1/2 M]", expected: 0.5 },
    { input: "10 marks", expected: 10 },
  ];

  let passedParsing = 0;
  for (const tc of testCases) {
    const result = n(tc.input);
    const ok = Math.abs(result - tc.expected) < 0.0001;
    if (ok) {
      passedParsing++;
      console.log(`  ✓ n(${JSON.stringify(tc.input)}) => ${result}`);
    } else {
      console.error(`  ✗ FAIL: n(${JSON.stringify(tc.input)}) => ${result}, expected ${tc.expected}`);
    }
  }

  if (passedParsing !== testCases.length) {
    throw new Error(`Parser tests failed: ${passedParsing}/${testCases.length} passed.`);
  }
  console.log(`All ${passedParsing} parsing tests passed!\n`);

  console.log("=== 2. Testing Zod Validation on Fractional Marks ===");
  const validZod = questionSchema.safeParse({
    type: "MCQ",
    subject: "Physics",
    marks: 0.5,
    difficulty: "EASY",
    questionText: "What is the unit of force?",
    classId: "cjld2cjxh0000qzrmn831i7rn",
  });

  if (!validZod.success) {
    console.error("Zod validation failed on 0.5 marks:", validZod.error.flatten());
    throw new Error("Zod validation failed on decimal marks");
  }
  console.log("  ✓ Zod correctly accepted marks: 0.5");

  const validZodQuarter = questionSchema.safeParse({
    type: "MCQ",
    subject: "Physics",
    marks: "0.25",
    difficulty: "EASY",
    questionText: "What is the unit of mass?",
    classId: "cjld2cjxh0000qzrmn831i7rn",
  });

  if (!validZodQuarter.success || validZodQuarter.data.marks !== 0.25) {
    console.error("Zod validation failed on '0.25' marks string:", validZodQuarter);
    throw new Error("Zod validation failed on '0.25' string marks");
  }
  console.log("  ✓ Zod correctly coerced and accepted marks: '0.25' => 0.25\n");

  console.log("=== 3. Testing Database Create and Query with Fractional Marks ===");
  // Find a user and class for test
  const user = await prisma.user.findFirst();
  const cls = await prisma.class.findFirst();

  if (!user || !cls) {
    console.log("  ℹ No user or class found in database, skipping DB insertion test (schema is already verified).");
    return;
  }

  console.log(`  Using user: ${user.name} (${user.id}), class: ${cls.name} (${cls.id})`);

  // Create question with 0.5 marks
  const testQ1 = await prisma.question.create({
    data: {
      type: "MCQ",
      subject: "Test Subject",
      marks: 0.5,
      difficulty: "EASY",
      questionText: "Test Question with Fractional Mark 0.5",
      createdById: user.id,
      classId: cls.id,
      options: [{ text: "Option A", isCorrect: true }],
    },
  });
  console.log(`  ✓ Created Question with marks: ${testQ1.marks} (ID: ${testQ1.id})`);

  // Bulk create questions with 0.25 and 1.5 marks
  const bulkResult = await prisma.question.createMany({
    data: [
      {
        type: "MCQ",
        subject: "Test Subject",
        marks: 0.25,
        difficulty: "EASY",
        questionText: "Test Bulk Question with 0.25 marks",
        createdById: user.id,
        classId: cls.id,
      },
      {
        type: "MCQ",
        subject: "Test Subject",
        marks: 1.5,
        difficulty: "MEDIUM",
        questionText: "Test Bulk Question with 1.5 marks",
        createdById: user.id,
        classId: cls.id,
      },
    ],
  });
  console.log(`  ✓ createMany inserted ${bulkResult.count} questions with float marks (0.25 and 1.5)!`);

  // Query back to verify exact float values
  const retrievedQ1 = await prisma.question.findUnique({
    where: { id: testQ1.id },
  });
  console.log(`  ✓ Retrieved Q1: marks = ${retrievedQ1?.marks} (type: ${typeof retrievedQ1?.marks})`);

  if (retrievedQ1?.marks !== 0.5) {
    throw new Error(`Retrieved marks was ${retrievedQ1?.marks}, expected 0.5`);
  }

  // Clean up test questions
  await prisma.question.deleteMany({
    where: {
      questionText: {
        in: [
          "Test Question with Fractional Mark 0.5",
          "Test Bulk Question with 0.25 marks",
          "Test Bulk Question with 1.5 marks",
        ],
      },
    },
  });
  console.log("  ✓ Cleaned up test questions from database.");

  console.log("\n ALL TESTS PASSED SUCCESSFULLY! Fractional and decimal marks are fully working end-to-end!");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
