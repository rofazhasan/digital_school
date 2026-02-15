import puppeteer from 'puppeteer';
import { Question } from '@prisma/client';

export interface PDFOptions {
  title?: string;
  includeAnswers?: boolean;
  includeMetadata?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
  lineSpacing?: number;
  margin?: number;
}

// Use Omit to avoid conflict with base Question type
export interface ExtendedQuestion extends Omit<Question, 'tags' | 'options' | 'subQuestions'> {
  stem?: string;
  correctOption?: number;
  chapter?: string;
  tags?: string | string[]; // Allow string (JSON) or string[]
  options?: any;
  subQuestions?: any;
  // Re-declare tags to match Omit (optional here)
}

export interface QuestionBankPDFData {
  title: string;
  description?: string;
  questions: ExtendedQuestion[];
  filters?: {
    subject?: string;
    class?: string;
    topic?: string;
    difficulty?: string;
    type?: string;
  };
  generatedBy: string;
  generatedAt: Date;
}

class PDFGenerator {
  private async generateHTML(questions: ExtendedQuestion[], options: PDFOptions = {}): Promise<string> {
    const {
      title = 'Question Bank',
      includeAnswers = false,
      includeMetadata = true,
      fontSize = 12,
      lineSpacing = 1.5,
      margin = 20
    } = options;

    const formatQuestion = (question: ExtendedQuestion, index: number): string => {
      let html = `
        <div class="question" style="margin-bottom: 20px; page-break-inside: avoid;">
          <div class="question-header" style="margin-bottom: 10px;">
            <span class="question-number" style="font-weight: bold; color: #2563eb;">Q${index + 1}.</span>
            <span class="question-type" style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 10px;">${question.type}</span>
            <span class="question-marks" style="float: right; font-weight: bold; color: #059669;">(${question.marks} mark${question.marks > 1 ? 's' : ''})</span>
          </div>
          
          <div class="question-content" style="margin-bottom: 15px;">
            <div class="question-text" style="margin-bottom: 10px;">
              ${question.questionText}
            </div>
      `;

      // Add stem for CQ questions
      if (question.type === 'CQ' && question.stem) {
        html += `
          <div class="question-stem" style="background: #f8fafc; padding: 10px; border-left: 4px solid #2563eb; margin-bottom: 10px; font-style: italic;">
            ${question.stem}
          </div>
        `;
      }

      // Add options for MCQ questions
      if (question.type === 'MCQ' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options as string);
        html += '<div class="options" style="margin-left: 20px;">';
        options.forEach((option: string, optIndex: number) => {
          const optionLabel = String.fromCharCode(0x0995 + optIndex); // ক, খ, গ, ঘ
          html += `
            <div class="option" style="margin-bottom: 5px;">
              <span style="font-weight: bold;">${optionLabel}.</span> ${option}
            </div>
          `;
        });
        html += '</div>';
      }

      // Add sub-questions for CQ questions
      if (question.type === 'CQ' && question.subQuestions) {
        const subQuestions = Array.isArray(question.subQuestions) ? question.subQuestions : JSON.parse(question.subQuestions as string);
        html += '<div class="sub-questions" style="margin-left: 20px;">';
        subQuestions.forEach((subQ: any) => {
          html += `
            <div class="sub-question" style="margin-bottom: 10px;">
              <div class="sub-question-header" style="margin-bottom: 5px;">
                <span style="font-weight: bold;">(${subQ.part})</span>
                <span style="float: right; font-weight: bold; color: #059669;">(${subQ.marks} mark${subQ.marks > 1 ? 's' : ''})</span>
              </div>
              <div class="sub-question-text" style="margin-bottom: 5px;">
                ${subQ.question}
              </div>
            </div>
          `;
        });
        html += '</div>';
      }

      // Add answers if requested
      if (includeAnswers) {
        html += '<div class="answers" style="margin-top: 15px; padding: 10px; background: #f0fdf4; border-left: 4px solid #059669;">';
        html += '<div style="font-weight: bold; color: #059669; margin-bottom: 5px;">Answer:</div>';

        if (question.type === 'MCQ' && question.correctOption !== null && question.correctOption !== undefined) {
          const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options as string);
          const correctOption = options[question.correctOption];
          const optionLabel = String.fromCharCode(0x0995 + question.correctOption);
          html += `<div>Correct Answer: <strong>${optionLabel}. ${correctOption}</strong></div>`;
        }

        if (question.modelAnswer) {
          html += `<div style="margin-top: 5px;"><strong>Model Answer:</strong> ${question.modelAnswer}</div>`;
        }

        html += '</div>';
      }

      // Add metadata if requested
      if (includeMetadata) {
        const tags = Array.isArray(question.tags) ? question.tags : JSON.parse(question.tags as string);
        html += `
          <div class="question-metadata" style="margin-top: 10px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 5px;">
            <span>Subject: ${question.subject}</span>
            ${question.chapter ? `<span style="margin-left: 10px;">Chapter: ${question.chapter}</span>` : ''}
            <span style="margin-left: 10px;">Difficulty: ${question.difficulty}</span>
            ${tags ? `<span style="margin-left: 10px;">Tags: ${tags.join(', ')}</span>` : ''}
          </div>
        `;
      }

      html += '</div></div>';
      return html;
    };

    const questionsHTML = questions.map((question, index) => formatQuestion(question, index)).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
            margin: ${margin}mm;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: ${fontSize}pt;
            line-height: ${lineSpacing};
            color: #1f2937;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
          }
          
          .title {
            font-size: 24pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          
          .subtitle {
            font-size: 14pt;
            color: #6b7280;
            margin-bottom: 10px;
          }
          
          .info {
            font-size: 10pt;
            color: #6b7280;
          }
          
          .filters {
            background: #f8fafc;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 10pt;
          }
          
          .filter-item {
            display: inline-block;
            margin-right: 15px;
          }
          
          .filter-label {
            font-weight: bold;
            color: #374151;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          @media print {
            .question {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="subtitle">Question Bank</div>
          <div class="info">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </div>
        
        ${questionsHTML}
        
        <div class="page-break"></div>
        <div style="text-align: center; margin-top: 50px; font-size: 10pt; color: #6b7280;">
          <p>--- End of Questions ---</p>
          <p>Total Questions: ${questions.length}</p>
          <p>Total Marks: ${questions.reduce((sum, q) => sum + q.marks, 0)}</p>
        </div>
      </body>
      </html>
    `;
  }

  async generateQuestionBankPDF(data: QuestionBankPDFData, options: PDFOptions = {}): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Generate HTML content
      const html = await this.generateHTML(data.questions, {
        title: data.title,
        ...options
      });

      // Set content and wait for rendering
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.pageSize || 'A4',
        printBackground: true,
        margin: {
          top: options.margin || 20,
          right: options.margin || 20,
          bottom: options.margin || 20,
          left: options.margin || 20
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateIndividualQuestionPDF(question: Question, options: PDFOptions = {}): Promise<Buffer> {
    return this.generateQuestionBankPDF({
      title: `Question: ${question.questionText.substring(0, 50)}...`,
      questions: [question],
      generatedBy: 'System',
      generatedAt: new Date()
    }, options);
  }

  async generateAnswerKeyPDF(questions: Question[], options: PDFOptions = {}): Promise<Buffer> {
    return this.generateQuestionBankPDF({
      title: 'Answer Key',
      questions,
      generatedBy: 'System',
      generatedAt: new Date()
    }, {
      ...options,
      includeAnswers: true,
      includeMetadata: false
    });
  }
}

export const pdfGenerator = new PDFGenerator(); 