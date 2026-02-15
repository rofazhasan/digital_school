# Range-Based Question Selection Implementation

## 🎯 Overview

The exam builder now supports **range-based question selection** where users can select questions within a range, but only the required number of marks count.

## ✅ Key Features

### **Range-Based Selection**
- **CQ**: Can select 5-8 questions, but only 5 marks count (25 marks)
- **SQ**: Can select 5-15 questions, but only 5 marks count (10 marks)
- **MCQ**: Fill remaining marks after required CQ/SQ marks (45 marks)

### **Mark Calculation Logic**
```javascript
// Only required marks count, not selected marks
const cqMarks = Math.min(selectedCQ, requiredCQ) * 5;
const sqMarks = Math.min(selectedSQ, requiredSQ) * 2;
const mcqRequired = totalMarks - cqMarks - sqMarks;
```

## 📊 Example Scenarios

### Scenario 1: Minimum Selection (5 CQ, 5 SQ)
```
CQ: 5 questions selected (25 marks count)
SQ: 5 questions selected (10 marks count)
MCQ: 45 marks required
Total: 80 marks ✅
```

### Scenario 2: Maximum Selection (8 CQ, 15 SQ)
```
CQ: 8 questions selected (25 marks count - only 5 count)
SQ: 15 questions selected (10 marks count - only 5 count)
MCQ: 45 marks required
Total: 80 marks ✅
```

### Scenario 3: Mixed Selection (7 CQ, 10 SQ)
```
CQ: 7 questions selected (25 marks count - only 5 count)
SQ: 10 questions selected (10 marks count - only 5 count)
MCQ: 45 marks required
Total: 80 marks ✅
```

## 🔧 Technical Implementation

### Updated Validation Logic
```typescript
const isMarksMatched = useMemo(() => {
    // Check if minimum requirements are met
    const cqCountMet = (selectedByType.CQ || 0) >= cqRequired;
    const sqCountMet = (selectedByType.SQ || 0) >= sqRequired;
    
    // Calculate marks based on required questions (not selected)
    const cqMarks = Math.min(selectedByType.CQ || 0, cqRequired) * 5;
    const sqMarks = Math.min(selectedByType.SQ || 0, sqRequired) * 2;
    
    // MCQ fills remaining marks
    const mcqRequiredMarks = exam.totalMarks - cqMarks - sqMarks;
    const mcqMet = (marksByType.MCQ || 0) >= mcqRequiredMarks;
    
    return cqCountMet && sqCountMet && mcqMet;
}, [exam, questionSelectionInfo]);
```

### Updated Selection Logic
```typescript
// Allow selection up to total questions (range-based)
if (q.type === 'CQ') {
    isSelectable = currentCQCount < exam.cqTotalQuestions;
} else if (q.type === 'SQ') {
    isSelectable = currentSQCount < exam.sqTotalQuestions;
}
```

### Updated Mark Display
```typescript
// Show range and calculated marks
<span>CQ: {selectedCQ}/{totalCQ} questions (min {requiredCQ}, marks: {calculatedMarks})</span>
<span>SQ: {selectedSQ}/{totalSQ} questions (min {requiredSQ}, marks: {calculatedMarks})</span>
```

## 📋 Current Configuration

### Exam Settings
- **Total Marks**: 80
- **CQ**: 5/8 questions (select 5-8, only 5 marks count)
- **SQ**: 5/15 questions (select 5-15, only 5 marks count)
- **MCQ**: 45 marks (flexible)
- **MCQ Negative Marking**: 25%

### Selection Rules
1. **CQ**: Must select at least 5, can select up to 8
2. **SQ**: Must select at least 5, can select up to 15
3. **MCQ**: Fill remaining marks after required CQ/SQ marks
4. **Same Marks**: All CQ/SQ questions must have same marks

## 🎯 Expected Behavior

### Manual Set Builder Display
```
Selected Marks: 45 / 80
MCQ: 10 / 45+ marks
CQ: 7/8 questions (min 5, marks: 25)
SQ: 10/15 questions (min 5, marks: 10)
```

### Question Selection Process
1. **Select CQ**: Choose 5-8 CQ questions (all same marks)
2. **Select SQ**: Choose 5-15 SQ questions (all same marks)
3. **Select MCQ**: Fill remaining 45 marks with MCQ questions
4. **Validate**: System checks minimum counts and same marks

## 🚨 Error Messages

### Too Many CQ Questions
```
"Maximum 8 CQ questions allowed"
```

### Insufficient CQ Questions
```
"Question selection requirements not met: Need at least 2 more CQ questions"
```

### Different CQ Marks
```
"All CQ questions must have the same marks (5 marks)"
```

## ✅ Validation Rules

### CQ Questions
- ✅ Must select at least `cqRequiredQuestions` (5)
- ✅ Can select up to `cqTotalQuestions` (8)
- ✅ All CQ questions must have same marks
- ✅ Only required marks count (5 × 5 = 25 marks)

### SQ Questions
- ✅ Must select at least `sqRequiredQuestions` (5)
- ✅ Can select up to `sqTotalQuestions` (15)
- ✅ All SQ questions must have same marks
- ✅ Only required marks count (5 × 2 = 10 marks)

### MCQ Questions
- ✅ Must select at least the remaining marks after CQ/SQ
- ✅ Can select more than required (flexible)
- ✅ Marks calculated dynamically

## 🎉 Benefits

1. **Flexible Selection**: Users can choose from a range of questions
2. **Fair Marking**: Only required marks count, preventing over-selection advantage
3. **Clear Feedback**: Shows range limits and calculated marks
4. **Same Marks Validation**: Ensures fairness in question selection
5. **Dynamic Calculation**: Adapts to actual question marks

## 🔧 Usage Example

### Step 1: Select CQ Questions
- Choose 5-8 CQ questions
- All must have same marks (5 marks each)
- Only 5 marks count (25 total)

### Step 2: Select SQ Questions
- Choose 5-15 SQ questions
- All must have same marks (2 marks each)
- Only 5 marks count (10 total)

### Step 3: Select MCQ Questions
- Fill remaining 45 marks
- Can select more than required if needed

### Step 4: Validate and Save
- System validates minimum counts and same marks
- Shows calculated marks breakdown
- Allows saving when all requirements met

The range-based selection now properly handles the logic where users can select more questions than required, but only the required marks count towards the total. 