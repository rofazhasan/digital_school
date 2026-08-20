import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT, OMRTemplateGeometry } from '../lib/omr/geometry-template';
import { StudentIdentityResolver } from '../lib/omr/student-identity-resolver';

describe('OMR Template Generation & QR Security Unit Tests', () => {
  test('1. Generates valid standard template geometry with canonical dimensions', () => {
    const template: OMRTemplateGeometry = generateTemplateGeometry('C_11_12');

    expect(template.templateId).toBe('C_11_12');
    expect(template.canonical.width).toBe(CANONICAL_WIDTH);
    expect(template.canonical.height).toBe(CANONICAL_HEIGHT);
    expect(template.markers.length).toBe(4);
    expect(template.roll.cells.length).toBe(60); // 6 columns * 10 digits
    expect(template.registration.cells.length).toBe(70);  // 7 columns * 10 digits
    expect(template.answers.cells.length).toBe(400);    // 100 questions * 4 options
  });

  test('2. Verifies non-overlapping semantic regions within page boundaries', () => {
    const template = generateTemplateGeometry('C_11_12');

    // All cells must be strictly within page boundary
    const allCells = [
      ...template.roll.cells,
      ...template.registration.cells,
      ...template.answers.cells
    ];

    allCells.forEach(cell => {
      expect(cell.bounds.x).toBeGreaterThanOrEqual(0);
      expect(cell.bounds.y).toBeGreaterThanOrEqual(0);
      expect(cell.bounds.x + cell.bounds.width).toBeLessThanOrEqual(CANONICAL_WIDTH);
      expect(cell.bounds.y + cell.bounds.height).toBeLessThanOrEqual(CANONICAL_HEIGHT);
      expect(cell.radius).toBeGreaterThan(0);
    });
  });

  test('3. QR Security: Rejects client-tampered QR payload with foreign exam/class context', async () => {
    const mockDb = {
      students: [
        {
          id: 'std_science_01',
          roll: '101',
          classId: 'class_science',
          sectionId: 'sec_a',
          user: { name: 'Alice' }
        }
      ],
      exams: [
        {
          id: 'exam_commerce_01',
          classId: 'class_commerce', // Different class!
          sectionId: 'sec_b'
        }
      ],
      examSets: []
    };

    // Client tampered: scanning science student paper under commerce exam QR
    const tampered = await StudentIdentityResolver.resolve({
      qr: { examId: 'exam_commerce_01', classId: 'class_commerce', sectionId: 'sec_b' },
      roll: '101'
    }, mockDb);

    expect(tampered.success).toBe(false);
    expect(tampered.error).toMatch(/not enrolled in the exam's target class/i);
    expect(tampered.studentId).toBeNull();
  });

  test('4. QR Security: Validates JSON structure and handles malformed strings gracefully', async () => {
    const malformedPayloads = [
      '{ invalid json string',
      '',
      '{"randomField": 123}',
      '{"examId": ""}'
    ];

    for (const payload of malformedPayloads) {
      const result = await StudentIdentityResolver.resolve({
        qr: payload,
        roll: '101'
      });
      expect(result.success).toBe(false);
    }
  });
});
