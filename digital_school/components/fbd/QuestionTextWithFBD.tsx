'use client';

import React from 'react';
import { FBDRenderer } from '@/components/fbd/FBDRenderer';
import { renderTextWithFBDs } from '@/utils/fbd/inline-parser';
import type { FBDDiagram } from '@/utils/fbd/types';

interface QuestionTextWithFBDProps {
    text: string;
    fbds?: FBDDiagram | FBDDiagram[];
    className?: string;
}

/**
 * Component to render text with embedded FBD diagrams
 * Replaces __FBD_N__ placeholders with actual diagrams
 */
export function QuestionTextWithFBD({ text, fbds, className = '' }: QuestionTextWithFBDProps) {
    if (!text) return null;

    // Convert single FBD to array
    const fbdArray = fbds ? (Array.isArray(fbds) ? fbds : [fbds]) : [];

    // Parse text and get parts
    const parts = renderTextWithFBDs(text, fbdArray);

    return (
        <div className={`question-text-with-fbd ${className}`}>
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    return (
                        <span key={index} dangerouslySetInnerHTML={{ __html: part.content as string }} />
                    );
                } else {
                    return (
                        <div key={index} className="inline-fbd my-4">
                            <FBDRenderer diagram={part.content as FBDDiagram} />
                        </div>
                    );
                }
            })}
        </div>
    );
}

/**
 * Example usage in question display
 */
export function ExampleQuestionDisplay({ question }: { question: any }) {
    return (
        <div className="question-container p-6 border rounded-lg">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold">Question {question.number}</h3>
                <span className="text-sm text-muted-foreground">{question.marks} marks</span>
            </div>

            {/* Question text with embedded FBDs */}
            <QuestionTextWithFBD
                text={question.questionText}
                fbds={question.fbd}
                className="text-base mb-4"
            />

            {/* MCQ Options with embedded FBDs */}
            {question.type === 'MCQ' && question.options && (
                <div className="space-y-2 mt-4">
                    {question.options.map((option: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>
                            <QuestionTextWithFBD
                                text={option.text}
                                fbds={question.fbd}
                                className="flex-1"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Model Answer with embedded FBDs */}
            {question.modelAnswer && (
                <div className="mt-6 border-t pt-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Answer:</p>
                    <QuestionTextWithFBD
                        text={question.modelAnswer}
                        fbds={question.fbd}
                        className="text-sm"
                    />
                </div>
            )}

            {/* Sub-questions with embedded FBDs */}
            {question.type === 'CQ' && question.subQuestions && (
                <div className="mt-4 space-y-3">
                    {question.subQuestions.map((sq: any, idx: number) => (
                        <div key={idx} className="pl-4 border-l-2">
                            <QuestionTextWithFBD
                                text={`${String.fromCharCode(97 + idx)}) ${sq.question}`}
                                fbds={question.fbd}
                                className="font-medium mb-2"
                            />
                            {sq.modelAnswer && (
                                <QuestionTextWithFBD
                                    text={sq.modelAnswer}
                                    fbds={question.fbd}
                                    className="text-sm text-muted-foreground"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
