"use client";

import React, { memo } from "react";
import { MathJax } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { ZoomableImage } from "./shared";

// Premium MCQ Option Component
export const MCQOption = memo(({
    option,
    index,
    isSelected,
    isCorrect,
    showResult,
    userAnswer,
    disabled,
    submitted,
    onSelect,
    fontSize = 'md'
}: {
    option: any;
    index: number;
    isSelected: boolean;
    isCorrect: boolean;
    showResult: boolean;
    userAnswer: any;
    disabled: boolean;
    submitted: boolean;
    onSelect: (label: string) => void;
    fontSize?: 'md' | 'lg' | 'xl';
}) => {
    const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);
    const textSizeClass = fontSize === 'xl' ? 'text-xl md:text-2xl' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-base md:text-lg';

    const getStyles = () => {
        const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

        if (showResult) {
            if (isCorrect) return `${base} bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-100`;
            if (isSelected && !isCorrect) return `${base} bg-rose-50 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100`;
            return `${base} bg-muted/30 border-border text-muted-foreground opacity-60 grayscale`;
        }

        if (isSelected) return `${base} bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary transform scale-[1.01] z-10 dark:bg-primary/20 dark:ring-primary/40`;

        return `${base} bg-card border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5`;
    };

    return (
        <button
            onClick={() => onSelect(label)}
            disabled={disabled || submitted || !!userAnswer}
            className={getStyles()}
        >
            <div className={`
        flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-300 shadow-sm
        ${showResult && isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200' :
                    showResult && isSelected && !isCorrect ? 'bg-rose-500 text-white shadow-rose-200' :
                        isSelected ? 'bg-primary text-primary-foreground shadow-primary/20 scale-110' :
                            'bg-muted text-muted-foreground group-hover:bg-card-foreground/5 group-hover:text-primary group-hover:shadow-md group-hover:scale-110'}
      `}>
                {String.fromCharCode(65 + index)}
            </div>

            <div className={`flex-1 pt-1 ${textSizeClass} leading-relaxed font-medium text-foreground group-hover:text-primary transition-colors`}>
                <div className="min-w-0 text-left">
                    <MathJax inline dynamic>
                        <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
                    </MathJax>
                </div>
                {option?.image && (
                    <div className="mt-4">
                        <ZoomableImage
                            src={option.image}
                            alt="Option"
                            className="max-h-48 w-full rounded-lg border border-border bg-card p-1 shadow-sm group-hover:shadow-md transition-shadow"
                        />
                    </div>
                )}
            </div>

            {showResult && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-background rounded-full p-1 shadow-sm" />}
                    {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-background rounded-full p-1 shadow-sm" />}
                </div>
            )}
        </button>
    );
});

MCQOption.displayName = 'MCQOption';

// Premium Multiple Correct Option Component
export const MCOption = memo(({
    option,
    index,
    isSelected,
    isCorrect,
    showResult,
    disabled,
    submitted,
    onSelect,
    fontSize = 'md'
}: {
    option: any;
    index: number;
    isSelected: boolean;
    isCorrect: boolean;
    showResult: boolean;
    disabled: boolean;
    submitted: boolean;
    onSelect: (index: number) => void;
    fontSize?: 'md' | 'lg' | 'xl';
}) => {
    const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);
    const textSizeClass = fontSize === 'xl' ? 'text-xl md:text-2xl' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-base md:text-lg';

    const getStyles = () => {
        const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

        if (showResult) {
            if (isCorrect) return `${base} bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-100`;
            if (isSelected && !isCorrect) return `${base} bg-rose-50 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100`;
            return `${base} bg-muted/30 border-border text-muted-foreground opacity-60 grayscale`;
        }

        if (isSelected) return `${base} bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary transform scale-[1.01] z-10 dark:bg-primary/20 dark:ring-primary/40`;

        return `${base} bg-card border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5`;
    };

    return (
        <button
            onClick={() => onSelect(index)}
            disabled={disabled || submitted}
            className={getStyles()}
        >
            <div className={`
        flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300
        ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-110' : 'bg-card border-border text-transparent group-hover:border-primary/50'}
        ${showResult && isCorrect ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100' : ''}
        ${showResult && isSelected && !isCorrect ? 'bg-rose-600 border-rose-600 text-white shadow-rose-100' : ''}
      `}>
                <Check className={`w-4 h-4 md:w-5 md:h-5 ${isSelected || (showResult && isCorrect) ? 'scale-100' : 'scale-0'} transition-transform duration-200`} />
            </div>
            <div className={`flex-1 pt-0.5 ${textSizeClass} leading-relaxed font-medium text-foreground group-hover:text-primary transition-colors text-left`}>
                <MathJax inline dynamic>
                    <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
                </MathJax>
            </div>

            {showResult && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-background rounded-full p-1 shadow-sm" />}
                    {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-background rounded-full p-1 shadow-sm" />}
                </div>
            )}
        </button>
    );
});

MCOption.displayName = 'MCOption';
