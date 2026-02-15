# Negative Marking and Question Selection Features

## Overview

This document describes the implementation of negative marking for MCQs and question selection logic for CQ and SQ questions in the digital school exam system.

## Features Implemented

### 1. Negative Marking for MCQs

- **Percentage-based negative marking**: Configurable percentage of marks to deduct for wrong MCQ answers
- **Example**: If a question has 1 mark and negative marking is set to 25%, wrong answers get -0.25 marks
- **Default**: 0% (no negative marking)
- **Range**: 0-100%

### 2. Question Selection Settings

#### Creative Questions (CQ)
- **Default**: 8 total questions, students must answer 5
- **Configurable**: Both total and required questions can be customized
- **Validation**: Required questions cannot exceed total questions

#### Short Questions (SQ)
- **Default**: 15 total questions, students must answer 5
- **Configurable**: Both total and required questions can be customized
- **Validation**: Required questions cannot exceed total questions

## Database Changes

### New Fields in Exam Table

```sql
-- Negative marking for MCQs (percentage)
mcqNegativeMarking    Float?    @default(0)

-- Question selection settings
cqTotalQuestions      Int?      @default(8)
cqRequiredQuestions   Int?      @default(5)
sqTotalQuestions      Int?      @default(15)
sqRequiredQuestions   Int?      @default(5)
```

## API Changes

### Exam Creation/Update
- New fields are included in exam creation and update requests
- Validation ensures required questions don't exceed total questions
- Default values are applied if not specified

### Exam Retrieval
- New fields are included in exam responses
- Backward compatibility maintained for existing exams

## UI Changes

### Exam Creation Form
- **Negative Marking Section**: Input field for MCQ negative marking percentage
- **Question Selection Section**: Separate inputs for CQ and SQ total/required questions
- **Validation**: Real-time validation with helpful error messages
- **Help Text**: Explanatory text for each field

### Exam Display
- **Negative Marking Badge**: Shows when negative marking is enabled
- **Question Selection Display**: Shows CQ and SQ selection ratios
- **Visual Indicators**: Color-coded badges for different question types

## Utility Functions

### `calculateMCQMarks(isCorrect, questionMarks, negativeMarkingPercentage)`
- Calculates marks for MCQ answers
- Returns positive marks for correct answers
- Returns negative marks for wrong answers based on percentage

### `validateQuestionSelection(totalQuestions, requiredQuestions)`
- Validates question selection settings
- Ensures required questions don't exceed total questions

### `getQuestionSelectionSummary(cqTotal, cqRequired, sqTotal, sqRequired)`
- Returns formatted summary string for display
- Example: "CQ: 5/8, SQ: 5/15"

## Usage Examples

### Creating an Exam with Negative Marking
```javascript
const examData = {
  name: "Midterm Exam",
  mcqNegativeMarking: 25, // 25% negative marking
  cqTotalQuestions: 8,
  cqRequiredQuestions: 5,
  sqTotalQuestions: 15,
  sqRequiredQuestions: 5,
  // ... other fields
};
```

### Calculating MCQ Marks
```javascript
import { calculateMCQMarks } from '@/lib/exam-utils';

// Correct answer: +1 mark
const correctMarks = calculateMCQMarks(true, 1, 25); // Returns 1

// Wrong answer: -0.25 marks
const wrongMarks = calculateMCQMarks(false, 1, 25); // Returns -0.25
```

## Migration

The database migration `20250801184423_add_negative_marking_and_question_selection` adds the new fields to the exam table with appropriate default values.

## Testing

Utility functions include comprehensive tests for:
- Negative marking calculations with various percentages
- Question selection validation
- Summary string generation

## Future Enhancements

1. **Advanced Negative Marking**: Support for different negative marking schemes
2. **Question Weighting**: Individual question mark weights
3. **Dynamic Question Selection**: Random selection from question pools
4. **Analytics**: Detailed analysis of negative marking impact on scores 