import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { parseRawOcrTextToQuestions } from '@/lib/ocr/questionParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const defaultSubject = (formData.get('defaultSubject') as string) || '';
    const defaultClass = (formData.get('defaultClass') as string) || '';
    const language = (formData.get('language') as string) || 'ben+eng';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize Tesseract worker
    // Tesseract 6 uses createWorker(languages)
    const worker = await createWorker(language.split('+'));

    const { data: { text, confidence } } = await worker.recognize(buffer);
    await worker.terminate();

    // Parse the extracted text into structured questions with LaTeX
    const questions = parseRawOcrTextToQuestions(text, {
      defaultClass,
      defaultSubject,
    });

    return NextResponse.json({
      success: true,
      rawText: text,
      ocrConfidence: confidence,
      questionsCount: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error('OCR Extraction Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image OCR',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
