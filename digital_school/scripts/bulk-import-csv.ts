import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.resolve(__dirname, '../questions.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    console.log('Parsing CSV...');
    
    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const records = results.data as any[];
            console.log(`Found ${records.length} records. Starting import...`);

            for (const record of records) {
                try {
                    const {
                        type,
                        subject,
                        topic,
                        marks,
                        difficulty,
                        questionText,
                        options,
                        explanation,
                        modelAnswer,
                        classId,
                        creatorId,
                        subQuestions
                    } = record;

                    if (!type || !questionText || !classId || !creatorId) {
                        console.warn('Skipping invalid record:', record.questionText?.substring(0, 30));
                        continue;
                    }

                    // Parse options if present
                    let parsedOptions = [];
                    if (options) {
                        try {
                            parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
                        } catch (e) {
                            // Fallback for simple comma-separated options
                            parsedOptions = options.split(',').map((opt: string) => ({ text: opt.trim(), isCorrect: false }));
                        }
                    }

                    // Parse sub-questions if present
                    let parsedSubQuestions = [];
                    if (subQuestions) {
                        try {
                            parsedSubQuestions = typeof subQuestions === 'string' ? JSON.parse(subQuestions) : subQuestions;
                        } catch (e) {
                            console.error('Failed to parse subQuestions:', e);
                        }
                    }

                    await prisma.question.create({
                        data: {
                            type: type.toUpperCase(),
                            subject: subject || 'General',
                            topic: topic || null,
                            marks: parseInt(marks) || 1,
                            difficulty: (difficulty || 'MEDIUM').toUpperCase() as any,
                            questionText,
                            explanation: explanation || null,
                            modelAnswer: modelAnswer || null,
                            options: parsedOptions,
                            subQuestions: parsedSubQuestions,
                            classId,
                            creatorId,
                            hasMath: questionText.includes('$') || questionText.includes('\\'),
                        }
                    });

                    console.log('Imported:', questionText.substring(0, 50) + '...');
                } catch (error) {
                    console.error('Error importing record:', error);
                }
            }

            console.log('Import completed!');
            await prisma.$disconnect();
        },
        error: (error: any) => {
            console.error('Error parsing CSV:', error);
        }
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
