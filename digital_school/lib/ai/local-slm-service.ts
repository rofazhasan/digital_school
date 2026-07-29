/**
 * Local Small Model (SLM) Inference Service
 * Communicates with locally hosted models (Ollama, vLLM, LocalAI) running
 * models like Qwen 2.5 (3B/7B), Llama 3.2 (3B), Gemma 2 (2B), or Phi-3.
 */

export interface StudentMistakeContext {
  studentName?: string;
  examTitle: string;
  scoreObtained: number;
  totalScore: number;
  accuracyPercentage: number;
  topMistakeTopics: { topic: string; errorCount: number }[];
  questionErrors: {
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation?: string;
    topic?: string;
  }[];
}

export interface SLMDiagnosticResponse {
  summary: string;
  topWeakTopics: string[];
  errorBreakdown: string[];
  recommendedActionPlan: string[];
  rawText: string;
}

export class LocalSLMService {
  private endpoint: string;
  private defaultModel: string;

  constructor() {
    this.endpoint = process.env.LOCAL_SLM_ENDPOINT || 'http://localhost:11434/v1';
    this.defaultModel = process.env.LOCAL_SLM_MODEL || 'qwen2.5:3b';
  }

  async generateMistakeDiagnosis(context: StudentMistakeContext): Promise<SLMDiagnosticResponse> {
    const systemPrompt = `You are an encouraging, expert AI Academic Advisor for students.
Your goal is to analyze the student's exam mistakes and provide clear, empathetic, and actionable feedback.

Format your response clearly into 4 sections:
1. OVERVIEW: Brief performance summary.
2. WEAK TOPICS: Bullet list of topics needing attention.
3. ERROR ANALYSIS: Concise explanation of why key mistakes occurred and what concept was missed.
4. STUDY PLAN: 3 specific, practical steps to improve for the next test.`;

    const userPrompt = `Student Exam Performance Data:
- Exam: ${context.examTitle}
- Score: ${context.scoreObtained} / ${context.totalScore} (${context.accuracyPercentage}%)
- Most Mistaken Topics: ${context.topMistakeTopics.map((t) => `${t.topic} (${t.errorCount} mistakes)`).join(', ')}

Sample Wrong Answers:
${context.questionErrors
  .slice(0, 5)
  .map(
    (q, i) =>
      `[Question ${i + 1}] Topic: ${q.topic || 'General'}\n  Question: ${q.questionText}\n  Student Answer: ${q.studentAnswer}\n  Correct Answer: ${q.correctAnswer}\n  Explanation: ${q.explanation || 'N/A'}`
  )
  .join('\n\n')}

Please analyze these mistakes and provide the diagnostic feedback.`;

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.defaultModel,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`SLM API HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return this.parseSLMOutput(content, context);
    } catch (error) {
      console.warn('⚠️ Local SLM endpoint unavailable, generating deterministic diagnostic fallback:', error);
      return this.generateFallbackDiagnosis(context);
    }
  }

  private parseSLMOutput(content: string, context: StudentMistakeContext): SLMDiagnosticResponse {
    const weakTopics = context.topMistakeTopics.map((t) => t.topic);
    const recommendedActionPlan = [
      `Review key formulas and concepts for ${weakTopics[0] || 'the lowest-scoring topic'}.`,
      `Practice 5-10 targeted practice questions before taking another mock test.`,
      `Go through the explanations for missed questions in ${context.examTitle}.`,
    ];

    return {
      summary: `You completed ${context.examTitle} with a score of ${context.scoreObtained}/${context.totalScore} (${context.accuracyPercentage}%).`,
      topWeakTopics: weakTopics.length > 0 ? weakTopics : ['General Concepts'],
      errorBreakdown: context.questionErrors.map(
        (q) => `In topic "${q.topic || 'General'}", you chose "${q.studentAnswer}" instead of "${q.correctAnswer}".`
      ),
      recommendedActionPlan,
      rawText: content,
    };
  }

  private generateFallbackDiagnosis(context: StudentMistakeContext): SLMDiagnosticResponse {
    const weakTopics = context.topMistakeTopics.map((t) => t.topic);

    return {
      summary: `Performance Summary: ${context.scoreObtained}/${context.totalScore} (${context.accuracyPercentage}%) achieved in ${context.examTitle}.`,
      topWeakTopics: weakTopics.length > 0 ? weakTopics : ['Core Fundamentals'],
      errorBreakdown: context.questionErrors.slice(0, 3).map(
        (q) => `[${q.topic || 'Question'}] Your answer: "${q.studentAnswer}" | Correct: "${q.correctAnswer}"`
      ),
      recommendedActionPlan: [
        `Focus your revision on: ${weakTopics.slice(0, 2).join(', ') || 'all incorrect topics'}.`,
        'Re-read chapter solutions for questions where marks were lost.',
        'Retake a practice test once you complete revision.',
      ],
      rawText: `Diagnostic generated via local rule engine. Score: ${context.scoreObtained}/${context.totalScore}. Needs practice in: ${weakTopics.join(', ')}.`,
    };
  }
}

export const localSLMService = new LocalSLMService();
