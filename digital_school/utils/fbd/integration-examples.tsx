/**
 * Example: Integrating FBD into Question Bank
 * Shows how to add FBD editor to question creation/editing
 */

'use client';

import React, { useState } from 'react';
import { FBDEditor } from '@/components/fbd/FBDEditor';
import { FBDRenderer } from '@/components/fbd/FBDRenderer';
import type { FBDDiagram } from '@/utils/fbd/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

/**
 * Example Question Form with FBD Integration
 * This shows how to integrate the FBD editor into your question creation form
 */
export function QuestionFormWithFBD() {
    const [questionText, setQuestionText] = useState('');
    const [fbd, setFbd] = useState<FBDDiagram | null>(null);
    const [showFBDEditor, setShowFBDEditor] = useState(false);

    const handleSaveFBD = (diagram: FBDDiagram) => {
        setFbd(diagram);
        setShowFBDEditor(false);
    };

    const handleSubmit = async () => {
        // Example: Save question with FBD to database
        const questionData = {
            type: 'SUBJECTIVE',
            subject: 'Physics',
            questionText,
            fbd: fbd, // Store FBD as JSON
            marks: 5,
            difficulty: 'MEDIUM',
            // ... other fields
        };

        try {
            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData),
            });

            if (response.ok) {
                alert('Question saved successfully!');
            }
        } catch (error) {
            console.error('Error saving question:', error);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create Physics Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                    <Label>Question Text</Label>
                    <Textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter the question..."
                        rows={4}
                    />
                </div>

                {/* FBD Section */}
                <div className="space-y-2">
                    <Label>Free Body Diagram (Optional)</Label>

                    {fbd ? (
                        <div className="space-y-2">
                            {/* Preview */}
                            <div className="border rounded-lg p-4 bg-white">
                                <FBDRenderer diagram={fbd} />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Dialog open={showFBDEditor} onOpenChange={setShowFBDEditor}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Edit Diagram</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Free Body Diagram</DialogTitle>
                                        </DialogHeader>
                                        <FBDEditor initialDiagram={fbd} onSave={handleSaveFBD} />
                                    </DialogContent>
                                </Dialog>

                                <Button variant="outline" onClick={() => setFbd(null)}>
                                    Remove Diagram
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Dialog open={showFBDEditor} onOpenChange={setShowFBDEditor}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Add Free Body Diagram</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                    <DialogTitle>Create Free Body Diagram</DialogTitle>
                                </DialogHeader>
                                <FBDEditor onSave={handleSaveFBD} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Submit */}
                <Button onClick={handleSubmit} className="w-full">
                    Save Question
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Example: Displaying Question with FBD in Exam Paper
 */
export function ExamQuestionWithFBD({ question }: { question: any }) {
    return (
        <div className="space-y-4 p-6 border rounded-lg">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold">Question {question.number}</h3>
                <span className="text-sm text-muted-foreground">{question.marks} marks</span>
            </div>

            <p className="text-base">{question.questionText}</p>

            {/* Render FBD if present */}
            {question.fbd && (
                <div className="my-4 flex justify-center">
                    <FBDRenderer diagram={question.fbd as FBDDiagram} />
                </div>
            )}

            {/* Answer space */}
            <div className="mt-6 border-t pt-4">
                <p className="text-sm text-muted-foreground">Answer:</p>
                <div className="mt-2 min-h-[200px] border rounded p-4 bg-slate-50">
                    {/* Student answer area */}
                </div>
            </div>
        </div>
    );
}

/**
 * Example: API Route for Saving Question with FBD
 */
export const questionAPIExample = `
// app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateFBD } from '@/utils/fbd/generator';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate FBD if present
    if (data.fbd) {
      const validation = validateFBD(data.fbd);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid FBD', details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Save to database
    const question = await prisma.question.create({
      data: {
        type: data.type,
        subject: data.subject,
        questionText: data.questionText,
        fbd: data.fbd,  // Stored as JSON
        marks: data.marks,
        difficulty: data.difficulty,
        classId: data.classId,
        createdById: data.userId,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hasFBD = searchParams.get('hasFBD') === 'true';

  const questions = await prisma.question.findMany({
    where: hasFBD ? {
      fbd: { not: null }
    } : undefined,
    include: {
      class: true,
      createdBy: true,
    },
  });

  return NextResponse.json(questions);
}
`;

/**
 * Example: Programmatic FBD Generation for Batch Questions
 */
export const batchGenerationExample = `
import { createBlockOnIncline, createHangingMass } from '@/utils/fbd/generator';

// Generate 10 physics questions with FBDs
async function generatePhysicsQuestions() {
  const questions = [];

  // 5 incline problems with varying angles
  for (let i = 0; i < 5; i++) {
    const angle = 15 + i * 15; // 15°, 30°, 45°, 60°, 75°
    const mass = 5 + i * 2;
    
    const fbd = createBlockOnIncline(\`incline-\${i}\`, angle, mass, true);
    
    questions.push({
      questionText: \`A \${mass} kg block rests on a \${angle}° incline. Calculate the normal force and friction force.\`,
      fbd,
      subject: 'Physics',
      marks: 5,
      difficulty: 'MEDIUM',
    });
  }

  // 5 hanging mass problems
  for (let i = 0; i < 5; i++) {
    const mass = 3 + i;
    
    const fbd = createHangingMass(\`hanging-\${i}\`, mass);
    
    questions.push({
      questionText: \`A \${mass} kg mass hangs from a string. Calculate the tension in the string.\`,
      fbd,
      subject: 'Physics',
      marks: 4,
      difficulty: 'EASY',
    });
  }

  // Bulk insert
  await prisma.question.createMany({
    data: questions.map(q => ({
      ...q,
      type: 'SUBJECTIVE',
      classId: 'class-id',
      createdById: 'user-id',
    })),
  });

  console.log(\`Created \${questions.length} physics questions with FBDs\`);
}
`;
