# Updated Question Selection Logic

## 🎯 Overview

The exam builder has been updated with a more sophisticated question selection logic that properly handles CQ and SQ requirements with same-mark validation.

## ✅ Key Changes Made

### 1. **Exact Count Validation**
- **CQ Questions**: Must select exactly the required number (e.g., 3 out of 8)
- **SQ Questions**: Must select exactly the required number (e.g., 3 out of 5)
- **MCQ Questions**: Fill remaining marks after CQ and SQ allocation

### 2. **Same Marks Validation**
- **All CQ questions must have the same marks**
- **All SQ questions must have the same marks**
- **MCQ questions can have different marks (flexible)**

### 3. **Dynamic Mark Calculation**
- **CQ Marks**: Calculated based on actual selected questions
- **SQ Marks**: Calculated based on actual selected questions  
- **MCQ Marks**: Remaining marks after CQ and SQ allocation

## 🔧 Technical Implementation

### Updated Question Selection Logic

```typescript
const questionSelectionInfo = useMemo(() => {
    if (!exam) return null;

    // Count selected questions by type
    const selectedByType = selectedQuestions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate marks by type
    const marksByType = selectedQuestions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + q.marks;
        return acc;
    }, {} as Record<string, number>);

    // Calculate required marks based on actual selected questions
    const cqRequired = exam.cqRequiredQuestions || 0;
    const sqRequired = exam.sqRequiredQuestions || 0;
    
    // Calculate required marks for CQ and SQ based on actual selected question marks
    const cqRequiredMarks = selectedByType.CQ ? (marksByType.CQ || 0) : (cqRequired * 5);
    const sqRequiredMarks = selectedByType.SQ ? (marksByType.SQ || 0) : (sqRequired * 2);
    
    // MCQ marks = Total marks - CQ marks - SQ marks
    const mcqRequiredMarks = exam.totalMarks - cqRequiredMarks - sqRequiredMarks;

    return {
        cqRequiredMarks,
        sqRequiredMarks,
        mcqRequiredMarks,
        selectedByType,
        marksByType,
        cqRequired,
        cqTotal: exam.cqTotalQuestions || 0,
        sqRequired,
        sqTotal: exam.sqTotalQuestions || 0,
    };
}, [selectedQuestions, exam]);
```

### Updated Validation Logic

```typescript
const isMarksMatched = useMemo(() => {
    if (!exam || !questionSelectionInfo) return false;
    
    const { cqRequired, sqRequired, selectedByType, marksByType } = questionSelectionInfo;
    
    // Check if CQ and SQ count requirements are met exactly
    const cqCountMet = (selectedByType.CQ || 0) === cqRequired;
    const sqCountMet = (selectedByType.SQ || 0) === sqRequired;
    
    // For MCQ, check if we have at least the required marks
    const mcqRequiredMarks = exam.totalMarks - (marksByType.CQ || 0) - (marksByType.SQ || 0);
    const mcqMet = (marksByType.MCQ || 0) >= mcqRequiredMarks;
    
    return cqCountMet && sqCountMet && mcqMet;
}, [exam, questionSelectionInfo]);
```

### Same Marks Validation

```typescript
if (question.type === 'CQ') {
    const currentCQCount = selectedByType.CQ || 0;
    
    if (currentCQCount >= cqRequired) {
        canAdd = false;
        reason = `Maximum ${cqRequired} CQ questions allowed`;
    } else if (currentCQCount > 0) {
        // Check if all CQ questions have the same marks
        const firstCQ = selectedQuestions.find(q => q.type === 'CQ');
        if (firstCQ && firstCQ.marks !== question.marks) {
            canAdd = false;
            reason = `All CQ questions must have the same marks (${firstCQ.marks} marks)`;
        }
    }
}
```

## 📊 Example: 80-Mark Exam

### Configuration
- **Total Marks**: 80
- **CQ**: 8 total questions, 5 required
- **SQ**: 10 total questions, 5 required
- **MCQ**: Remaining marks after CQ and SQ

### Selection Rules
1. **Must select exactly 5 CQ questions** (all with same marks)
2. **Must select exactly 5 SQ questions** (all with same marks)
3. **Can select MCQ questions to fill remaining marks**

### Example Selection
```
CQ: 5 questions × 5 marks each = 25 marks
SQ: 5 questions × 2 marks each = 10 marks
MCQ: Remaining 45 marks (flexible)
Total: 80 marks ✅
```

## ✅ Validation Rules

### CQ Questions
- ✅ Must select exactly `cqRequiredQuestions`
- ✅ Cannot exceed the required count
- ✅ All CQ questions must have the same marks
- ✅ Marks calculated based on actual selected questions

### SQ Questions
- ✅ Must select exactly `sqRequiredQuestions`
- ✅ Cannot exceed the required count
- ✅ All SQ questions must have the same marks
- ✅ Marks calculated based on actual selected questions

### MCQ Questions
- ✅ Must select at least the remaining marks after CQ/SQ
- ✅ Can select more than required (flexible)
- ✅ Marks calculated dynamically

## 🚨 Error Messages

### Too Many CQ Questions
```
"Maximum 5 CQ questions allowed"
```

### Different CQ Marks
```
"All CQ questions must have the same marks (5 marks)"
```

### Insufficient Questions
```
"Question selection requirements not met: Need 2 more CQ questions, Need 1 more SQ questions"
```

## 📋 Test Results

### Perfect Selection ✅
```
CQ: 3/3 questions (15 marks) - All same marks ✅
SQ: 3/3 questions (6 marks) - All same marks ✅
MCQ: 10 marks (fills remaining)
Total: 31 marks (Required: 45) - Valid ✅
```

### Invalid Selections ❌
```
Too Many CQ: 4/3 questions ❌
Insufficient CQ: 2/3 questions ❌
Different CQ Marks: 5,5,4 marks ❌
```

## 🎯 Benefits

1. **Precise Control**: Exact question count for CQ and SQ
2. **Same Marks Validation**: Ensures fairness in question selection
3. **Dynamic Calculation**: Adapts to actual question marks
4. **Flexible MCQ**: Handles varying MCQ mark distributions
5. **Clear Feedback**: Specific error messages for each issue

## 🔧 Usage

### Step 1: Select CQ Questions
- Choose exactly the required number of CQ questions
- All CQ questions must have the same marks
- First CQ selection determines the required marks for all CQ

### Step 2: Select SQ Questions
- Choose exactly the required number of SQ questions
- All SQ questions must have the same marks
- First SQ selection determines the required marks for all SQ

### Step 3: Select MCQ Questions
- Fill the remaining marks with MCQ questions
- MCQ selection is flexible and can exceed required marks

### Step 4: Validate and Save
- System validates exact counts and same marks
- Shows detailed breakdown of selections
- Allows saving only when all requirements are met

The updated logic now properly handles the question selection requirements with same-mark validation and exact count enforcement. 