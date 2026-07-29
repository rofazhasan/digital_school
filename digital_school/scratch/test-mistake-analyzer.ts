import { localSLMService, StudentMistakeContext } from '../lib/ai/local-slm-service';

async function testMistakeAnalyzer() {
  console.log('🧪 Testing Student Error Diagnostic Bot (SLM Service)...');

  const sampleContext: StudentMistakeContext = {
    studentName: 'Rafiu',
    examTitle: 'Physics Midterm 2026',
    scoreObtained: 18,
    totalScore: 30,
    accuracyPercentage: 60,
    topMistakeTopics: [
      { topic: 'Gauss Law & Electric Flux', errorCount: 3 },
      { topic: 'Capacitance in Circuits', errorCount: 2 },
    ],
    questionErrors: [
      {
        questionText: 'What is the electric flux through a closed surface containing charge Q?',
        studentAnswer: 'Q / 2e0',
        correctAnswer: 'Q / e0',
        explanation: 'Total flux equals enclosed charge divided by e0.',
        topic: 'Gauss Law & Electric Flux',
      },
      {
        questionText: 'What happens to capacitance when a dielectric slab of constant K is inserted?',
        studentAnswer: 'Decreases by K',
        correctAnswer: 'Increases by K times',
        explanation: 'Capacitance increases to C = K * C0.',
        topic: 'Capacitance in Circuits',
      },
    ],
  };

  console.log('📩 Sending student mistake context to SLM engine...');
  const diagnosis = await localSLMService.generateMistakeDiagnosis(sampleContext);

  console.log('\n✅ AI Diagnostic Result Received:');
  console.log('----------------------------------------------------');
  console.log('📌 Summary:', diagnosis.summary);
  console.log('⚠️ Top Weak Topics:', diagnosis.topWeakTopics);
  console.log('🔍 Error Breakdown:', diagnosis.errorBreakdown);
  console.log('🎯 Recommended Action Plan:', diagnosis.recommendedActionPlan);
  console.log('----------------------------------------------------');
  console.log('🎉 Student Error Diagnostic Bot Test Succeeded!');
}

testMistakeAnalyzer().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
