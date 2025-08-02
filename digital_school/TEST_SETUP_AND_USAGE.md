# Test Setup and Usage Guide

## 🎯 Overview

This guide explains how to test the negative marking and question selection features in the digital school exam system.

## 📊 Test Data Created

### Users
- **Super User**: `admin@eliteschool.edu.bd` / `password123`
- **5 Students**:
  - `student1@test.com` / `password123` (Ahmed Rahman)
  - `student2@test.com` / `password123` (Fatima Khan)
  - `student3@test.com` / `password123` (Mohammed Ali)
  - `student4@test.com` / `password123` (Aisha Begum)
  - `student5@test.com` / `password123` (Omar Hassan)

### Questions
- **10 MCQ Questions** (1 mark each)
- **5 CQ Questions** (5 marks each)
- **5 SQ Questions** (2 marks each)
- **Total**: 20 questions

### Test Exam
- **Name**: "Test Exam - Negative Marking & Question Selection"
- **Date**: December 15, 2024
- **Duration**: 3 hours
- **Total Marks**: 50
- **Pass Marks**: 25
- **MCQ Negative Marking**: 25%
- **CQ Selection**: 3 out of 5 questions
- **SQ Selection**: 3 out of 5 questions

## 🚀 How to Test

### 1. Login as Super User

1. Go to the login page
2. Use credentials: `admin@eliteschool.edu.bd` / `password123`
3. You should see the super user dashboard

### 2. View the Test Exam

1. Navigate to `/exams`
2. You should see the test exam listed with:
   - Negative marking badge showing "25% MCQ"
   - Question selection display showing "CQ: 3/5, SQ: 3/5"

### 3. Create a New Exam

1. Go to `/exams/create`
2. Fill out the form with:
   - **Name**: "My Test Exam"
   - **Class**: Select "Class 10 A"
   - **MCQ Negative Marking**: 25 (or any percentage 0-100)
   - **CQ Total Questions**: 8
   - **CQ Required Questions**: 5
   - **SQ Total Questions**: 15
   - **SQ Required Questions**: 5
3. Submit the form
4. Verify the exam appears in the exams list with correct settings

### 4. Test Negative Marking Calculation

Use the utility function to test calculations:

```javascript
import { calculateMCQMarks } from '@/lib/exam-utils';

// Test cases:
console.log(calculateMCQMarks(true, 1, 25));  // Should return 1 (correct answer)
console.log(calculateMCQMarks(false, 1, 25)); // Should return -0.25 (wrong answer)
console.log(calculateMCQMarks(false, 2, 50)); // Should return -1 (wrong answer)
console.log(calculateMCQMarks(false, 1, 0));  // Should return 0 (no negative marking)
```

### 5. Test Question Selection Validation

```javascript
import { validateQuestionSelection } from '@/lib/exam-utils';

// Test cases:
console.log(validateQuestionSelection(8, 5));  // Should return true
console.log(validateQuestionSelection(5, 8));  // Should return false
console.log(validateQuestionSelection(10, 10)); // Should return true
```

## 📋 MCQ Questions Available

1. **What is the capital of Bangladesh?**
   - Options: Dhaka, Chittagong, Sylhet, Rangpur
   - Correct: Dhaka

2. **Which is the largest river in Bangladesh?**
   - Options: Padma, Meghna, Jamuna, Brahmaputra
   - Correct: Padma

3. **What is 2 + 2?**
   - Options: 3, 4, 5, 6
   - Correct: 4

4. **Which planet is closest to the Sun?**
   - Options: Venus, Mercury, Earth, Mars
   - Correct: Mercury

5. **What is the chemical symbol for gold?**
   - Options: Ag, Au, Fe, Cu
   - Correct: Au

6. **Who wrote 'Romeo and Juliet'?**
   - Options: Charles Dickens, William Shakespeare, Jane Austen, Mark Twain
   - Correct: William Shakespeare

7. **What is the square root of 16?**
   - Options: 2, 4, 8, 16
   - Correct: 4

8. **Which year did Bangladesh gain independence?**
   - Options: 1969, 1970, 1971, 1972
   - Correct: 1971

9. **What is the largest ocean on Earth?**
   - Options: Atlantic Ocean, Indian Ocean, Pacific Ocean, Arctic Ocean
   - Correct: Pacific Ocean

10. **What is the chemical formula for water?**
    - Options: CO2, H2O, O2, N2
    - Correct: H2O

## 📝 CQ Questions Available

1. **Explain the process of photosynthesis in detail. Include the role of chlorophyll and the chemical equation.**
   - Marks: 5

2. **Discuss the causes and effects of climate change. Provide examples and potential solutions.**
   - Marks: 5

3. **Analyze the impact of social media on modern society. Consider both positive and negative aspects.**
   - Marks: 5

4. **Describe the water cycle and explain how it maintains Earth's water balance.**
   - Marks: 5

5. **Compare and contrast democracy and dictatorship as forms of government.**
   - Marks: 5

## 📝 SQ Questions Available

1. **What is the main function of the heart?**
   - Marks: 2

2. **Name three renewable energy sources.**
   - Marks: 2

3. **What is the difference between weather and climate?**
   - Marks: 2

4. **Explain the concept of gravity.**
   - Marks: 2

5. **What are the three branches of government in a democracy?**
   - Marks: 2

## 🧮 Expected Calculations

### MCQ Negative Marking Examples

For a 1-mark question with 25% negative marking:
- **Correct answer**: +1 mark
- **Wrong answer**: -0.25 marks

For a 2-mark question with 50% negative marking:
- **Correct answer**: +2 marks
- **Wrong answer**: -1 mark

### Total Possible Marks

**MCQ Section**: 10 questions × 1 mark = 10 marks
**CQ Section**: 3 questions × 5 marks = 15 marks (student chooses 3 out of 5)
**SQ Section**: 3 questions × 2 marks = 6 marks (student chooses 3 out of 5)
**Total**: 31 marks

## 🔧 API Testing

### Create Exam with Negative Marking

```bash
curl -X POST http://localhost:3000/api/exams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exam",
    "mcqNegativeMarking": 25,
    "cqTotalQuestions": 8,
    "cqRequiredQuestions": 5,
    "sqTotalQuestions": 15,
    "sqRequiredQuestions": 5,
    "classId": "class_id_here",
    "date": "2024-12-15",
    "startTime": "2024-12-15T09:00:00",
    "endTime": "2024-12-15T12:00:00",
    "duration": 180,
    "type": "OFFLINE",
    "totalMarks": 50,
    "passMarks": 25
  }'
```

### Get Exam Details

```bash
curl http://localhost:3000/api/exams?id=exam_id_here
```

## 🎯 Test Scenarios

### Scenario 1: Perfect Score
- **MCQ**: All 10 correct = +10 marks
- **CQ**: Best 3 answers = +15 marks
- **SQ**: Best 3 answers = +6 marks
- **Total**: 31/31 marks

### Scenario 2: Mixed Performance
- **MCQ**: 7 correct, 3 wrong = +7 - 0.75 = +6.25 marks
- **CQ**: 2 good answers = +10 marks
- **SQ**: 2 good answers = +4 marks
- **Total**: 20.25/31 marks

### Scenario 3: Poor Performance
- **MCQ**: 3 correct, 7 wrong = +3 - 1.75 = +1.25 marks
- **CQ**: 1 good answer = +5 marks
- **SQ**: 1 good answer = +2 marks
- **Total**: 8.25/31 marks

## 🚨 Troubleshooting

### If seed script fails:
1. Reset database: `npx prisma migrate reset --force`
2. Run seed: `npm run db:seed`

### If exam creation fails:
1. Check if class exists: `npx prisma studio`
2. Verify super user exists
3. Check database connection

### If negative marking doesn't work:
1. Verify the exam has `mcqNegativeMarking` field set
2. Check the calculation function in `lib/exam-utils.ts`
3. Test with the utility functions

## 📈 Performance Testing

### Load Testing
- Create multiple exams with different settings
- Test with all 5 students simultaneously
- Verify calculations remain accurate

### Edge Cases
- 0% negative marking
- 100% negative marking
- Equal required and total questions
- Maximum question counts

## ✅ Success Criteria

The implementation is successful if:

1. ✅ Super user can create exams with negative marking
2. ✅ Exam form validates question selection settings
3. ✅ Negative marking calculations are accurate
4. ✅ Exam display shows correct badges and information
5. ✅ API returns all new fields correctly
6. ✅ Database stores all new fields properly
7. ✅ Question selection validation works
8. ✅ Utility functions calculate correctly

## 🎉 Conclusion

The test setup provides a complete environment to verify:
- **Negative marking for MCQs** (25% in test exam)
- **Question selection for CQ** (3 out of 5)
- **Question selection for SQ** (3 out of 5)
- **All calculations and validations**

Use the provided test accounts and questions to thoroughly test the system functionality. 