"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const currentVal = userAnswer?.answer ?? userAnswer ?? "";
    const correctVal = question.correctAnswer || question.modelAnswer || question.correct || question.answer;
    const isCorrect = Number(currentVal) === Number(correctVal);

    return (
        <div className="space-y-4 text-left">
            <Input
                type="number"
                value={currentVal}
                onChange={(e) => onAnswerChange({ answer: parseInt(e.target.value) || 0 })}
                disabled={disabled || submitted}
                className={cn(
                    "w-full max-w-xs text-xl font-bold p-8 border-2 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-left",
                    showResult && (isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-rose-500 bg-rose-50 text-rose-900")
                )}
                placeholder="Enter integer answer..."
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
