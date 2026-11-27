import type { Template, EvaluationConfig } from './types';

export interface PresetData {
  id: string;
  aliases?: string[];
  name: string;
  description: string;
  template: Template;
  evaluationConfig: EvaluationConfig;
}

export const PRESET_TEMPLATES: PresetData[] = [
  {
    id: 'medical_admission_100q',
    aliases: ['medical_100'],
    name: '🩺 Medical Admission Model Test (100 Qs - MT-01 to MT-13)',
    description:
      'Standard 100-Question Bangladesh Medical & Dental Admission format with 7-digit Roll Number, 6-digit Serial Number, and 100 MCQs (A, B, C, D).',
    template: {
      pageDimensions: [1060, 2034],
      bubbleDimensions: [20, 20],
      preProcessors: [{ name: 'CropLeftOMRSpread' }, { name: 'DirectPass' }],
      customLabels: {
        Roll: ['roll1..7'],
        Serial: ['serial1..6'],
      },
      fieldBlocks: {
        Roll: {
          origin: [64, 400],
          bubblesGap: 42.44,
          labelsGap: 28.38,
          fieldType: 'QTYPE_INT',
          direction: 'vertical',
          fieldLabels: ['roll1..7'],
          section: 'Roll Number',
        },
        Serial: {
          origin: [315, 400],
          bubblesGap: 42.44,
          labelsGap: 28.38,
          fieldType: 'QTYPE_INT',
          direction: 'vertical',
          fieldLabels: ['serial1..6'],
          section: 'Serial Number',
        },
        QPart1_Col1: { origin: [111, 1147], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..10'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 1 (Q01-10)' },
        QPart1_Col2: { origin: [311, 1147], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q11..20'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 1 (Q11-20)' },
        QPart1_Col3: { origin: [511, 1147], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q21..30'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 1 (Q21-30)' },
        QPart1_Col4: { origin: [711, 1147], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q31..40'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 1 (Q31-40)' },
        QPart1_Col5: { origin: [911, 1147], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q41..50'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 1 (Q41-50)' },
        QPart2_Col1: { origin: [111, 1583], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q51..60'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 2 (Q51-60)' },
        QPart2_Col2: { origin: [311, 1583], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q61..70'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 2 (Q61-70)' },
        QPart2_Col3: { origin: [511, 1583], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q71..80'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 2 (Q71-80)' },
        QPart2_Col4: { origin: [711, 1583], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q81..90'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 2 (Q81-90)' },
        QPart2_Col5: { origin: [911, 1583], bubblesGap: 28.65, labelsGap: 26.92, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q91..100'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Part 2 (Q91-100)' },
      },
    },
    evaluationConfig: {
      examName: 'Medical Admission Model Test (100 MCQs)',
      examCode: 'ROFAZ-MED-100',
      rollNumberField: 'Roll',
      serialNumberField: 'Serial',
      markingSchemes: { default: { correct: 1.0, incorrect: -0.25, unmarked: 0, bonus: 1.0 } },
      answerKey: {},
    },
  },
  {
    id: 'bangladesh_board_hsc',
    aliases: ['hsc_ssc_50'],
    name: '🇧🇩 Bangladesh HSC / SSC Board (50 Qs)',
    description:
      'Official Bangladesh Education Board standard format with 6-digit Roll, 10-digit Registration, 3-digit Subject Code, Set Code (ক, খ, গ, ঘ) and 50 MCQs.',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [24, 24],
      fiducialInset: [30, 30],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Registration: ['reg1..10'],
        SubjectCode: ['sub1..3'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [736, 444], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Roll Number' },
        SetCode: { origin: [932, 444], bubblesGap: 32, labelsGap: 0, bubbleValues: ['ক', 'খ', 'গ', 'ঘ'], direction: 'vertical', fieldLabels: ['Set'], section: 'Set Code' },
        Registration: { origin: [736, 804], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['reg1..10'], section: 'Registration Number' },
        SubjectCode: { origin: [1038, 804], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['sub1..3'], section: 'Subject Code' },
        Questions_Col1: { origin: [212, 392], bubblesGap: 54, labelsGap: 52, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..25'], bubbleValues: ['ক', 'খ', 'গ', 'ঘ'], section: 'Column 1 (Q1-25)' },
        Questions_Col2: { origin: [506, 392], bubblesGap: 54, labelsGap: 52, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q26..50'], bubbleValues: ['ক', 'খ', 'গ', 'ঘ'], section: 'Column 2 (Q26-50)' },
      },
    },
    evaluationConfig: {
      examName: 'উচ্চ মাধ্যমিক সার্টিফিকেট পরীক্ষা (HSC Exam)',
      examCode: 'HSC-2026',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'bangladesh_5opt_50q',
    aliases: ['hsc_ssc_50_5opt', 'buet_iba_5opt_50'],
    name: '⭐ 5-Option Board / BUET / IBA (50 Qs - A–E / ক–ঙ)',
    description:
      '5-Option MCQ format (A, B, C, D, E or ক, খ, গ, ঘ, ঙ) with 6-digit Roll, 10-digit Registration, 3-digit Subject Code, Vertical Set Code, and 50 MCQs.',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [22, 22],
      fiducialInset: [30, 30],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Registration: ['reg1..10'],
        SubjectCode: ['sub1..3'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [748, 444], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Roll Number' },
        SetCode: { origin: [940, 444], bubblesGap: 32, labelsGap: 0, bubbleValues: ['A', 'B', 'C', 'D'], direction: 'vertical', fieldLabels: ['Set'], section: 'Set Code' },
        Registration: { origin: [748, 804], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['reg1..10'], section: 'Registration Number' },
        SubjectCode: { origin: [1046, 804], bubblesGap: 29, labelsGap: 27, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['sub1..3'], section: 'Subject Code' },
        Questions_Col1: { origin: [198, 392], bubblesGap: 44, labelsGap: 52, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q1..25'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 1 (Q1-25)' },
        Questions_Col2: { origin: [484, 392], bubblesGap: 44, labelsGap: 52, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q26..50'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 2 (Q26-50)' },
      },
    },
    evaluationConfig: {
      examName: 'BUET / IBA / 5-Option MCQ Exam (50 Qs)',
      examCode: 'OMR-5OPT-50',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'admission_5opt_100q',
    aliases: ['medical_100_5opt', 'bcs_5opt_100', 'gst_cluster_5opt'],
    name: '🎓 5-Option Admission / BCS / Engineering (100 Qs - A–E)',
    description:
      'High-density 100-Question 5-Option (A–E) stacked OMR sheet across 4 columns with 7-digit Roll and Vertical Set Code.',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [20, 20],
      fiducialInset: [30, 30],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..7'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [80, 280], bubblesGap: 26, labelsGap: 26, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..7'], section: 'Roll Number' },
        SetCode: { origin: [296, 280], bubblesGap: 28, labelsGap: 0, bubbleValues: ['A', 'B', 'C', 'D'], direction: 'vertical', fieldLabels: ['Set'], section: 'Set Code' },
        Questions_Col1: { origin: [88, 620], bubblesGap: 40, labelsGap: 42, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q1..25'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 1 (Q1-25)' },
        Questions_Col2: { origin: [368, 620], bubblesGap: 40, labelsGap: 42, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q26..50'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 2 (Q26-50)' },
        Questions_Col3: { origin: [648, 620], bubblesGap: 40, labelsGap: 42, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q51..75'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 3 (Q51-75)' },
        Questions_Col4: { origin: [928, 620], bubblesGap: 40, labelsGap: 42, fieldType: 'QTYPE_MCQ5', direction: 'horizontal', fieldLabels: ['q76..100'], bubbleValues: ['A', 'B', 'C', 'D', 'E'], section: 'Column 4 (Q76-100)' },
      },
    },
    evaluationConfig: {
      examName: '5-Option Admission / BCS Test (100 Qs)',
      examCode: 'OMR-5OPT-100',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'hsc_ssc_25q',
    aliases: ['hsc_ssc_25'],
    name: '⚡ Bangladesh Board / Speed Quiz (25 Qs)',
    description:
      'Compact 25-Question single-column Board / Classroom Speed Quiz format with 6-digit Roll, 10-digit Registration, 3-digit Subject Code, and Set (ক, খ, গ, ঘ).',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [22, 22],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Registration: ['reg1..10'],
        SubjectCode: ['sub1..3'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [680, 240], bubblesGap: 26, labelsGap: 30, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Roll Number' },
        SetCode: { origin: [880, 240], bubblesGap: 26, labelsGap: 0, bubbleValues: ['ক', 'খ', 'গ', 'ঘ'], direction: 'horizontal', fieldLabels: ['Set'], section: 'Set Code' },
        Registration: { origin: [680, 560], bubblesGap: 26, labelsGap: 30, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['reg1..10'], section: 'Registration Number' },
        SubjectCode: { origin: [1000, 560], bubblesGap: 26, labelsGap: 30, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['sub1..3'], section: 'Subject Code' },
        Questions_Col1: { origin: [64, 220], bubblesGap: 28, labelsGap: 26, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..25'], bubbleValues: ['ক', 'খ', 'গ', 'ঘ'], section: 'Questions (1-25)' },
      },
    },
    evaluationConfig: {
      examName: 'Model Test & Speed Quiz (25 Qs)',
      examCode: 'QUIZ-25',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'du_admission_60q',
    aliases: ['du_admission'],
    name: '🏛️ Dhaka University (DU) Admission (60 Qs - 3 Columns)',
    description:
      'Calibrated Dhaka University A/B/C Unit 60-Question 3-column stacked OMR sheet with 7-digit Roll and Set (A, B, C, D).',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [22, 22],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..7'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [60, 220], bubblesGap: 24, labelsGap: 26, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..7'], section: 'Roll Number' },
        SetCode: { origin: [260, 220], bubblesGap: 24, labelsGap: 0, bubbleValues: ['A', 'B', 'C', 'D'], direction: 'horizontal', fieldLabels: ['Set'], section: 'Set Code' },
        Questions_Col1: { origin: [60, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..20'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 1 (Q1-20)' },
        Questions_Col2: { origin: [433, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q21..40'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 2 (Q21-40)' },
        Questions_Col3: { origin: [806, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q41..60'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 3 (Q41-60)' },
      },
    },
    evaluationConfig: {
      examName: 'Dhaka University Admission Test (60 Qs)',
      examCode: 'DU-60',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'gst_cluster_100q',
    aliases: ['gst_cluster'],
    name: '🌐 GST Integrated University Cluster (100 Qs - 4 Columns)',
    description:
      'Calibrated 24-University GST Cluster 100-Question 4-column stacked OMR sheet with 6-digit Roll and Set (A, B, C, D).',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [22, 22],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [60, 220], bubblesGap: 24, labelsGap: 26, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Roll Number' },
        SetCode: { origin: [260, 220], bubblesGap: 24, labelsGap: 0, bubbleValues: ['A', 'B', 'C', 'D'], direction: 'horizontal', fieldLabels: ['Set'], section: 'Set Code' },
        Questions_Col1: { origin: [60, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..25'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Section 1 (Q1-25)' },
        Questions_Col2: { origin: [340, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q26..50'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Section 2 (Q26-50)' },
        Questions_Col3: { origin: [620, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q51..75'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Section 3 (Q51-75)' },
        Questions_Col4: { origin: [900, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q76..100'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Section 4 (Q76-100)' },
      },
    },
    evaluationConfig: {
      examName: 'GST Cluster Admission Test (100 Qs)',
      examCode: 'GST-100',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'agri_cluster_100q',
    aliases: ['agri_cluster'],
    name: '🌾 Agriculture Cluster Admission (100 Qs - 5 Columns)',
    description:
      'Calibrated Agricultural Universities Cluster 100-Question 5-column stacked OMR sheet with 6-digit Roll and Set (A, B, C, D).',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [22, 22],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Set: ['Set'],
      },
      fieldBlocks: {
        Roll: { origin: [60, 220], bubblesGap: 24, labelsGap: 26, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Roll Number' },
        SetCode: { origin: [260, 220], bubblesGap: 24, labelsGap: 0, bubbleValues: ['A', 'B', 'C', 'D'], direction: 'horizontal', fieldLabels: ['Set'], section: 'Set Code' },
        Questions_Col1: { origin: [60, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..20'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 1 (Q1-20)' },
        Questions_Col2: { origin: [284, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q21..40'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 2 (Q21-40)' },
        Questions_Col3: { origin: [508, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q41..60'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 3 (Q41-60)' },
        Questions_Col4: { origin: [732, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q61..80'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 4 (Q61-80)' },
        Questions_Col5: { origin: [956, 580], bubblesGap: 28, labelsGap: 24, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q81..100'], bubbleValues: ['A', 'B', 'C', 'D'], section: 'Column 5 (Q81-100)' },
      },
    },
    evaluationConfig: {
      examName: 'Agriculture Cluster Admission Test (100 Qs)',
      examCode: 'AGRI-100',
      rollNumberField: 'Roll',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
  {
    id: 'bangladesh_board_cq_top_sheet',
    aliases: ['board_cq_3part'],
    name: '📝 Bangladesh Board CQ (সৃজনশীল) 3-Part OMR Cover Sheet',
    description:
      'Official Bangladesh Education Board 3-part perforated CQ / Written script top sheet. Decodes Roll (6 digits), Registration (10 digits), Subject Code (3 digits), Extra Scripts, and Teacher Marks (প্রাপ্ত নম্বর - 3 digits).',
    template: {
      pageDimensions: [1240, 1754],
      bubbleDimensions: [20, 20],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: {
        Roll: ['roll1..6'],
        Registration: ['reg1..10'],
        SubjectCode: ['sub1..3'],
        ExtraScripts: ['extra1..2'],
        ObtainedMarks: ['marks1..3'],
        ScriptSerial: ['serial1..4'],
      },
      fieldBlocks: {
        Roll: { origin: [280, 210], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..6'], section: 'Part 1: Roll Number' },
        Registration: { origin: [470, 210], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['reg1..10'], section: 'Part 1: Registration' },
        SubjectCode: { origin: [770, 210], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['sub1..3'], section: 'Part 1: Subject Code' },
        ExtraScripts: { origin: [880, 210], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['extra1..2'], section: 'Part 1: Extra Scripts' },
        SubjectCodePart2: { origin: [110, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['subP2_1..3'], section: 'Part 2: Subject Code' },
        ExaminerCode: { origin: [230, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['exCode1..4'], section: 'Part 2: Examiner Code' },
        ScriptSerial: { origin: [380, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['serial1..4'], section: 'Part 2: Script Serial' },
        ExtraScriptsPart2: { origin: [530, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['extraP2_1..2'], section: 'Part 2: Extra Scripts' },
        ObtainedMarks: { origin: [640, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['marks1..3'], section: 'Part 2: Obtained Marks' },
        HeadExaminerMarks: { origin: [780, 720], bubblesGap: 25, labelsGap: 28, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['headMarks1..3'], section: 'Part 2: Head Examiner Marks' },
      },
    },
    evaluationConfig: {
      examName: 'সৃজনশীল (CQ) রচনামূলক উত্তরপত্র - বাংলাদেশ শিক্ষা বোর্ড',
      examCode: 'BOARD-CQ-2026',
      rollNumberField: 'Roll',
      markingSchemes: { default: { correct: 1, incorrect: 0, unmarked: 0, bonus: 0 } },
      answerKey: {},
    },
  },
  {
    id: 'sample1_standard',
    name: 'Standard Academic Exam (45 Qs)',
    description: 'Medium selector, 9-digit roll number, and 45 MCQs with sectional layout.',
    template: {
      pageDimensions: [1846, 1500],
      bubbleDimensions: [40, 40],
      preProcessors: [{ name: 'CropOnMarkers' }],
      customLabels: { Roll: ['Medium', 'roll1..9'] },
      fieldBlocks: {
        Roll: { origin: [286, 282], bubblesGap: 46, labelsGap: 58, fieldType: 'QTYPE_INT', direction: 'vertical', fieldLabels: ['roll1..9'] },
        SectionA: { origin: [168, 804], bubblesGap: 51, labelsGap: 43, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q1..15'], section: 'Section A - Physics' },
        SectionB: { origin: [608, 804], bubblesGap: 51, labelsGap: 43, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q16..30'], section: 'Section B - Chemistry' },
        SectionC: { origin: [1048, 804], bubblesGap: 51, labelsGap: 43, fieldType: 'QTYPE_MCQ4', direction: 'horizontal', fieldLabels: ['q31..45'], section: 'Section C - Mathematics' },
      },
    },
    evaluationConfig: {
      examName: 'All-India Mock Assessment Test',
      examCode: 'AIMAT-2026',
      rollNumberField: 'Roll',
      markingSchemes: { default: { correct: 1, incorrect: -0.25, unmarked: 0, bonus: 1 } },
      answerKey: {},
    },
  },
];

const remoteTemplateMemoryCache = new Map<string, Template>();
const LOCAL_CALIBRATED_KEY = 'omr_calibrated_templates_v1';

/**
 * Persists a DOM-calibrated or visually-calibrated template in localStorage & memory cache
 * so the scanner ALWAYS uses the exact printed coordinates before falling back to defaults.
 */
export function saveCalibratedTemplateLocal(templateId: string, template: Template): void {
  const clean = templateId.trim();
  if (!clean) return;
  remoteTemplateMemoryCache.set(clean, template);
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = window.localStorage.getItem(LOCAL_CALIBRATED_KEY);
    const existing: Record<string, Template> = existingRaw ? JSON.parse(existingRaw) : {};
    existing[clean] = template;
    window.localStorage.setItem(LOCAL_CALIBRATED_KEY, JSON.stringify(existing));
  } catch {
    // quota or private browsing
  }
}

/**
 * Resolves a QR code template identifier (`qr.metadata.template`) with STRICT CALIBRATION PRIORITY:
 * 1. DOM-calibrated / Studio-calibrated template in localStorage or memory cache
 * 2. Cloud PostgreSQL (`OMRTemplateDefinition`) via `/api/omr-templates?templateId=...`
 * 3. Built-in `PRESET_TEMPLATES` fallback (by `id` or `aliases`)
 */
export async function resolveTemplateByIdOrQR(
  templateTag?: string | null
): Promise<{ presetId: string; template: Template } | null> {
  if (!templateTag) return null;
  const clean = templateTag.trim();
  if (!clean) return null;

  // 1. Memory cache (populated by Generator Sync / Print or previous DB fetch)
  if (remoteTemplateMemoryCache.has(clean)) {
    return { presetId: clean, template: remoteTemplateMemoryCache.get(clean)! };
  }

  // 2. Local calibrated store (instant 0ms lookup from Generator or Calibration Studio)
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(LOCAL_CALIBRATED_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, Template>;
        if (map[clean]?.fieldBlocks) {
          remoteTemplateMemoryCache.set(clean, map[clean]);
          return { presetId: clean, template: map[clean] };
        }
      }
    } catch {
      // ignore malformed storage
    }
  }

  // 3. Cloud PostgreSQL calibrated definition (overrides built-in defaults so printed sheets match 100%)
  try {
    const res = await fetch(`/api/omr-templates?templateId=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.template?.geometry?.fieldBlocks) {
        const tpl = json.template.geometry as Template;
        remoteTemplateMemoryCache.set(clean, tpl);
        return { presetId: clean, template: tpl };
      }
    }
  } catch {
    // Offline or not found; fall through to built-in presets
  }

  // 4. Built-in preset fallback
  const localMatch = PRESET_TEMPLATES.find(
    (p) => p.id === clean || (p.aliases && p.aliases.includes(clean))
  );
  if (localMatch) {
    return { presetId: localMatch.id, template: localMatch.template };
  }

  return null;
}
