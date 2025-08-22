# CQ Subsection Functionality for Math Exams

## Overview
This feature allows teachers to create math exams with structured CQ (Creative Questions) sections that can be organized into subsections like Algebra, Geometry, Trigonometry, etc.

## Key Features

### 1. Single Subsection Mode
- **When to use**: When all CQ questions are from the same topic or when question shuffling is desired
- **Behavior**: 
  - Questions can be shuffled during exam generation
  - No subsection names required
  - Simple question selection (e.g., "Answer any 5 out of 8 questions")

### 2. Multiple Subsections Mode
- **When to use**: When questions are organized by specific topics and order matters
- **Behavior**:
  - Questions cannot be shuffled (maintains topic order)
  - Each subsection has a name and specific question range
  - Students must answer questions from each subsection as specified

## Database Schema

### Exam Table
```sql
-- Added field for CQ subsections
cqSubsections Json? -- Array of subsection objects
```

### Subsection Structure
```json
[
  {
    "name": "Algebra",
    "startIndex": 1,
    "endIndex": 3,
    "requiredQuestions": 2
  },
  {
    "name": "Geometry", 
    "startIndex": 4,
    "endIndex": 6,
    "requiredQuestions": 2
  },
  {
    "name": "Trigonometry",
    "startIndex": 7,
    "endIndex": 8,
    "requiredQuestions": 1
  }
]
```

## Exam Creation Form

### New Fields Added
1. **CQ Subsection Settings** section
2. **Add Subsection** button for multiple subsections
3. **Subsection configuration**:
   - Name (optional for single subsection)
   - Start Question Number
   - End Question Number  
   - Required Questions to Answer

### Validation Rules
- Start index must be ≤ end index
- No overlapping ranges between subsections
- Total questions must match CQ total questions
- Required questions cannot exceed available questions in subsection

## Print Display

### Question Paper
- **Single subsection**: Normal CQ display with question numbers 1, 2, 3...
- **Multiple subsections**: 
  - Blue subsection headers with names
  - Questions grouped under each subsection
  - Question numbers maintain original sequence (1, 2, 3... not restarted)

### Answer Sheet
- Same subsection structure as question paper
- Maintains question numbering consistency
- Clear visual separation between subsections

## Question Generation Logic

### Single Subsection
```typescript
// Questions can be shuffled
const shuffledQuestions = shuffleArray(allCQQuestions);
const selectedQuestions = shuffledQuestions.slice(0, requiredCount);
```

### Multiple Subsections
```typescript
// Questions cannot be shuffled - maintain order
const selectedQuestions = [];
examInfo.cqSubsections.forEach(subsection => {
  const subsectionQuestions = allCQQuestions.slice(
    subsection.startIndex - 1, 
    subsection.endIndex
  );
  // Select required questions from this subsection
  const selected = subsectionQuestions.slice(0, subsection.requiredQuestions);
  selectedQuestions.push(...selected);
});
```

## Example Usage

### Math Exam with Topics
```
Exam: Higher Mathematics
Total CQ Questions: 8
Required CQ Questions: 5

Subsections:
1. Algebra (Questions 1-3): Answer any 2
2. Geometry (Questions 4-6): Answer any 2  
3. Trigonometry (Questions 7-8): Answer any 1
```

### Simple Math Exam
```
Exam: Basic Mathematics
Total CQ Questions: 6
Required CQ Questions: 4
Subsections: None (single section)
Result: Answer any 4 out of 6 questions (can be shuffled)
```

## Benefits

1. **Structured Learning**: Students must demonstrate knowledge across different math topics
2. **Fair Assessment**: Prevents students from focusing only on their strongest topic
3. **Curriculum Alignment**: Matches typical math curriculum organization
4. **Flexibility**: Supports both simple and complex exam structures
5. **Clear Instructions**: Students know exactly how many questions to answer from each section

## Technical Implementation

### Components Updated
- `app/exams/create/page.tsx` - Exam creation form
- `app/components/QuestionPaper.tsx` - Question paper display
- `app/components/Answer_QuestionPaper.tsx` - Answer sheet display
- `app/api/exams/route.ts` - API endpoints
- `prisma/schema.prisma` - Database schema

### Key Functions
- `addSubsection()` - Add new subsection
- `removeSubsection()` - Remove subsection
- `updateSubsectionRanges()` - Update question ranges
- Subsection validation in Zod schema
- Conditional rendering in print components

## Future Enhancements

1. **Question Bank Integration**: Auto-suggest subsections based on question tags
2. **Template System**: Save and reuse subsection configurations
3. **Advanced Validation**: Check question difficulty distribution across subsections
4. **Analytics**: Track student performance by subsection
5. **Bulk Operations**: Import/export subsection configurations 