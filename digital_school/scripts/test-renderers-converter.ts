import {
  detectAnswerFormat,
  toggleNumerals,
  toBengaliNumerals,
  toEnglishNumerals,
  convertEnglishToBanglaPhonetic,
  convertBanglaToEnglishPhonetic,
  smartConvert,
  FORMAT_HINT_CONFIGS
} from '../utils/banglaConverter';

console.log("==========================================================================");
console.log("   VERIFYING CMA & MPC FORMAT DETECTION WITH REAL EXAM PAYLOADS");
console.log("==========================================================================");

// Sample CMA question
const sampleCMA = {
  id: 'cma_science',
  parts: [
    { id: 'p1', expectedAnswer: '20', type: 'numeric' },
    { id: 'p2', expectedAnswer: 'Mitochondria', type: 'text' },
    { id: 'p3', expectedAnswer: 'নেফ্রন', type: 'text' },
    { id: 'p4', expectedAnswer: '20 N', type: 'text' },
    { id: 'p5', expectedAnswer: '10^5', type: 'expression' }
  ]
};

sampleCMA.parts.forEach((p, idx) => {
  const format = detectAnswerFormat(p.expectedAnswer, p.type);
  const cfg = FORMAT_HINT_CONFIGS[format];
  console.log(`CMA Part ${idx + 1} (${p.expectedAnswer}): Detected Format = "${format}" -> Badge: [${cfg.labelBn} / ${cfg.labelEn}]`);
});

// Sample MPC question
const sampleMPC = {
  id: 'mpc_physics',
  stages: [
    { id: 's1', stageTitle: 'Calculate acceleration', expectedAnswer: '5', stageType: 'numeric' },
    { id: 's2', stageTitle: 'Calculate velocity', expectedAnswer: '20 m/s', stageType: 'expression' },
    { id: 's3', stageTitle: 'Mention law in Bangla', expectedAnswer: 'নিউটনের দ্বিতীয় সূত্র', stageType: 'text' }
  ]
};

sampleMPC.stages.forEach((s, idx) => {
  const format = detectAnswerFormat(s.expectedAnswer, s.stageType);
  const cfg = FORMAT_HINT_CONFIGS[format];
  console.log(`MPC Stage ${idx + 1} (${s.expectedAnswer}): Detected Format = "${format}" -> Badge: [${cfg.labelBn} / ${cfg.labelEn}]`);
});

console.log("\nTesting quick converter on sample student inputs:");
const inputs = ['123', '১২৩৪৫', 'nephron', 'নেফ্রন', 'glucose', '20 N'];
inputs.forEach(inp => {
  console.log(`Input: "${inp}" -> Toggled: "${smartConvert(inp)}"`);
});

console.log("\n✅ Real payload verification complete!");
