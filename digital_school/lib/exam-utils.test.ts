import { calculateMCQMarks, validateQuestionSelection, getQuestionSelectionSummary } from './exam-utils';

describe('Exam Utils', () => {
  describe('calculateMCQMarks', () => {
    it('should return full marks for correct answers', () => {
      expect(calculateMCQMarks(true, 1, 25)).toBe(1);
      expect(calculateMCQMarks(true, 2, 50)).toBe(2);
      expect(calculateMCQMarks(true, 1, 0)).toBe(1);
    });

    it('should return negative marks for wrong answers based on percentage', () => {
      // 25% negative marking on 1 mark question = -0.25 marks
      expect(calculateMCQMarks(false, 1, 25)).toBe(-0.25);
      
      // 50% negative marking on 2 mark question = -1 mark
      expect(calculateMCQMarks(false, 2, 50)).toBe(-1);
      
      // 100% negative marking on 1 mark question = -1 mark
      expect(calculateMCQMarks(false, 1, 100)).toBe(-1);
    });

    it('should return 0 for wrong answers with 0% negative marking', () => {
      expect(calculateMCQMarks(false, 1, 0)).toBe(0);
      expect(calculateMCQMarks(false, 2, 0)).toBe(0);
    });

    it('should handle decimal percentages correctly', () => {
      // 12.5% negative marking on 1 mark question = -0.125 marks
      expect(calculateMCQMarks(false, 1, 12.5)).toBe(-0.125);
      
      // 33.33% negative marking on 3 mark question = -1 mark
      expect(calculateMCQMarks(false, 3, 33.33)).toBeCloseTo(-1, 2);
    });
  });

  describe('validateQuestionSelection', () => {
    it('should return true for valid question selection', () => {
      expect(validateQuestionSelection(8, 5)).toBe(true);
      expect(validateQuestionSelection(15, 5)).toBe(true);
      expect(validateQuestionSelection(10, 10)).toBe(true);
    });

    it('should return false when required questions exceed total', () => {
      expect(validateQuestionSelection(5, 8)).toBe(false);
      expect(validateQuestionSelection(10, 15)).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(validateQuestionSelection(0, 5)).toBe(false);
      expect(validateQuestionSelection(8, 0)).toBe(false);
      expect(validateQuestionSelection(-1, 5)).toBe(false);
      expect(validateQuestionSelection(8, -1)).toBe(false);
    });
  });

  describe('getQuestionSelectionSummary', () => {
    it('should return formatted summary string', () => {
      expect(getQuestionSelectionSummary(8, 5, 15, 5)).toBe('CQ: 5/8, SQ: 5/15');
      expect(getQuestionSelectionSummary(10, 7, 20, 10)).toBe('CQ: 7/10, SQ: 10/20');
    });
  });
}); 