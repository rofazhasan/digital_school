# Exam Builder Updates - Question Selection Logic

## 🎯 Overview

The exam builder has been updated to properly handle question selection logic for CQ and SQ questions, with flexible MCQ handling.

## ✅ Key Features Implemented

### 1. **Question Selection Validation**
- **CQ Questions**: Must select exactly the required number (e.g., 3 out of 5)
- **SQ Questions**: Must select exactly the required number (e.g., 3 out of 5)
- **MCQ Questions**: Flexible - can select more than required if available

### 2. **Marks Distribution**
- **CQ**: 5 marks per question (configurable)
- **SQ**: 2 marks per question (configurable)
- **MCQ**: Remaining marks after CQ and SQ allocation

### 3. **Real-time Validation**
- Prevents adding too many CQ/SQ questions
- Shows current selection status
- Displays detailed marks breakdown
- Provides helpful error messages

## 📊 Example: 80-Mark Exam

### Configuration
- **Total Marks**: 80
- **CQ**: 8 total questions, 5 required (25 marks)
- **SQ**: 10 total questions, 5 required (10 marks)
- **MCQ**: Remaining 45 marks

### Selection Rules
1. **Must select exactly 5 CQ questions** (25 marks)
2. **Must select exactly 5 SQ questions** (10 marks)
3. **Can select MCQ questions to fill remaining 45 marks**

## 🔧 Technical Implementation

### Updated Components

#### 1. **Exam Interface**
```typescript
interface Exam {
  // ... existing fields
  cqTotalQuestions?: number;
  cqRequiredQuestions?: number;
  sqTotalQuestions?: number;
  sqRequiredQuestions?: number;
  mcqNegativeMarking?: number;
}
```

#### 2. **Question Selection Logic**
```typescript
const questionSelectionInfo = useMemo(() => {
  // Calculate required marks for each question type
  const cqRequiredMarks = (exam.cqRequiredQuestions || 0) * 5;
  const sqRequiredMarks = (exam.sqRequiredQuestions || 0) * 2;
  const mcqRequiredMarks = exam.totalMarks - cqRequiredMarks - sqRequiredMarks;
  
  // Track selected questions and marks by type
  // Return comprehensive selection info
}, [selectedQuestions, exam]);
```

#### 3. **Validation Functions**
- **CQ/SQ**: Exact count validation
- **MCQ**: Flexible validation (allows 20% more than required)
- **Real-time feedback**: Toast messages for validation errors

### 4. **UI Updates**

#### Header Information
```jsx
{exam.cqTotalQuestions && (
  <div className="mt-2 text-xs text-muted-foreground">
    <span className="mr-4">CQ: {exam.cqRequiredQuestions}/{exam.cqTotalQuestions} questions</span>
    <span className="mr-4">SQ: {exam.sqRequiredQuestions}/{exam.sqTotalQuestions} questions</span>
    {exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0 && (
      <span>MCQ: {exam.mcqNegativeMarking}% negative marking</span>
    )}
  </div>
)}
```

#### Marks Breakdown Display
```jsx
{questionSelectionInfo && (
  <div className="mt-2 space-y-1 text-xs">
    <div className="flex justify-between">
      <span>MCQ:</span>
      <span>{marksByType.MCQ || 0} / {mcqRequiredMarks}+ marks</span>
    </div>
    <div className="flex justify-between">
      <span>CQ:</span>
      <span>{selectedByType.CQ || 0}/{cqRequired} questions ({marksByType.CQ || 0} / {cqRequiredMarks} marks)</span>
    </div>
    <div className="flex justify-between">
      <span>SQ:</span>
      <span>{selectedByType.SQ || 0}/{sqRequired} questions ({marksByType.SQ || 0} / {sqRequiredMarks} marks)</span>
    </div>
  </div>
)}
```

## 🎯 Usage Examples

### Example 1: 80-Mark Exam
```
Total Marks: 80
CQ: 5/8 questions (25 marks)
SQ: 5/10 questions (10 marks)
MCQ: 45+ marks (flexible)
```

### Example 2: 50-Mark Exam
```
Total Marks: 50
CQ: 3/5 questions (15 marks)
SQ: 3/5 questions (6 marks)
MCQ: 29+ marks (flexible)
```

## ✅ Validation Rules

### CQ Questions
- ✅ Must select exactly `cqRequiredQuestions`
- ✅ Cannot exceed the required count
- ✅ Must match required marks (5 marks each)

### SQ Questions
- ✅ Must select exactly `sqRequiredQuestions`
- ✅ Cannot exceed the required count
- ✅ Must match required marks (2 marks each)

### MCQ Questions
- ✅ Must select at least `mcqRequiredMarks`
- ✅ Can select up to 20% more than required
- ✅ Flexible to accommodate available questions

## 🚨 Error Messages

### Too Many CQ Questions
```
"Maximum 5 CQ questions allowed"
```

### Too Many SQ Questions
```
"Maximum 3 SQ questions allowed"
```

### Insufficient Marks
```
"Question selection requirements not met: Need 5 more MCQ marks, Need 2 more CQ marks"
```

## 📋 Test Scenarios

### Scenario 1: Perfect Selection
- ✅ 5 CQ questions (25 marks)
- ✅ 5 SQ questions (10 marks)
- ✅ 45+ MCQ marks
- ✅ Total: 80+ marks

### Scenario 2: Incomplete Selection
- ❌ 3 CQ questions (15 marks) - Need 2 more
- ❌ 3 SQ questions (6 marks) - Need 2 more
- ❌ 20 MCQ marks - Need 25 more
- ❌ Total: 41 marks (Need 39 more)

### Scenario 3: Over Selection
- ❌ 6 CQ questions (30 marks) - Too many
- ✅ 5 SQ questions (10 marks)
- ✅ 40 MCQ marks
- ❌ Invalid due to too many CQ

## 🔧 Configuration

### Exam Creation
When creating an exam, set:
- `cqTotalQuestions`: Total CQ questions available
- `cqRequiredQuestions`: CQ questions students must answer
- `sqTotalQuestions`: Total SQ questions available
- `sqRequiredQuestions`: SQ questions students must answer
- `mcqNegativeMarking`: Percentage for negative marking

### Example Configuration
```javascript
{
  name: "Midterm Exam",
  totalMarks: 80,
  cqTotalQuestions: 8,
  cqRequiredQuestions: 5,
  sqTotalQuestions: 10,
  sqRequiredQuestions: 5,
  mcqNegativeMarking: 25
}
```

## 🎉 Benefits

1. **Precise Control**: Exact question selection for CQ and SQ
2. **Flexible MCQ**: Adapts to available question marks
3. **Real-time Feedback**: Immediate validation and error messages
4. **Clear Display**: Shows current selection status
5. **User-friendly**: Intuitive interface with helpful tooltips

## 🚀 Future Enhancements

1. **Dynamic Mark Calculation**: Adjust based on actual question marks
2. **Question Pool Management**: Better handling of available questions
3. **Advanced Validation**: More sophisticated selection rules
4. **Bulk Operations**: Select/deselect multiple questions at once
5. **Preview Mode**: See how the exam will look to students

The exam builder now properly handles the question selection logic, ensuring that CQ and SQ questions are selected exactly as required while allowing flexibility for MCQ questions based on available marks. 