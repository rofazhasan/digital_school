"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { LiveExpressionInput } from "@/components/ui/QuestionRenderers";

interface IntNumericSectionProps {
    question: any;
    userAnswer: any;
    disabled: boolean;
    submitted: boolean;
    onAnswerChange: (value: any) => void;
}

export const IntNumericSection = ({
    question,
    userAnswer,
    disabled,
    submitted,
    onAnswerChange
}: IntNumericSectionProps) => {
    const showResult = submitted;
    const currentVal = typeof userAnswer === 'object' && userAnswer !== null ? (userAnswer.answer ?? '') : (userAnswer ?? "");
    const correctVal = question.correctAnswer || question.modelAnswer || question.correct || question.answer;

    return (
        <div className="space-y-4 text-left">
            <LiveExpressionInput
                value={currentVal}
                onChange={(val) => onAnswerChange({ answer: val })}
                disabled={disabled || submitted}
                placeholder="Enter answer or math expression..."
            />
            {showResult && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-left">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold">Correct Answer: {correctVal}</span>
                </div>
            )}
        </div>
    );
};
