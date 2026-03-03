"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MTFGridProps {
    question: any;
    userAnswer: any;
    showResult: boolean;
    disabled: boolean;
    onSelect: (leftId: string, rightId: string) => void;
}

export const MTFGrid = ({
    question,
    userAnswer,
    showResult,
    disabled,
    onSelect
}: MTFGridProps) => {
    const leftColumn = question.leftColumn || [];
    const rightColumn = question.rightColumn || [];
    const matches = userAnswer || {};
    const correctMatches = question.matches || {};

    // Mobile Selection State
    const [activeLeftId, setActiveLeftId] = useState<string | null>(null);

    // Helper to get text for right item
    const getRightText = (id: string) => {
        const item = rightColumn.find((r: any) => r.id === id);
        return item ? item.text : id;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- DESKTOP VIEW (Row-based Pairing) --- */}
            <div className="hidden md:flex flex-col gap-6">
                {leftColumn.map((lc: any) => {
                    const currentMatchId = matches[lc.id];
                    const cAns = correctMatches[lc.id];
                    const isCorrect = showResult && currentMatchId === cAns;
                    const isWrong = showResult && currentMatchId && currentMatchId !== cAns;

                    return (
                        <div
                            key={lc.id}
                            className={cn(
                                "group relative p-6 rounded-3xl border-2 transition-all duration-500",
                                isCorrect ? "bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5" :
                                    isWrong ? "bg-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5" :
                                        currentMatchId ? "bg-primary/5 border-primary/20 shadow-md shadow-primary/5" :
                                            "bg-card border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                            )}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center font-bold text-lg border border-border shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                        {lc.id}
                                    </div>
                                    <div className="text-xl font-bold text-foreground/90">
                                        <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                                    </div>
                                </div>

                                {showResult && (
                                    <div className="flex items-center gap-2">
                                        {isCorrect ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 px-3 py-1">
                                                <Check className="w-3.5 h-3.5" /> Correct Match
                                            </Badge>
                                        ) : isWrong ? (
                                            <Badge variant="destructive" className="gap-1 px-3 py-1">
                                                <X className="w-3.5 h-3.5" /> Wrong Match
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 gap-1 px-3 py-1 animate-pulse">
                                                <AlertCircle className="w-3.5 h-3.5" /> Missed
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {rightColumn.map((rc: any) => {
                                    const isSelected = currentMatchId === rc.id;
                                    const isItemCorrect = showResult && cAns === rc.id;
                                    const isWrongSelection = showResult && isSelected && !isItemCorrect;

                                    return (
                                        <button
                                            key={rc.id}
                                            onClick={() => !disabled && !showResult && onSelect(lc.id, rc.id)}
                                            disabled={disabled || showResult}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                                isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" :
                                                    isItemCorrect ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" :
                                                        isWrongSelection ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-105" :
                                                            "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                                            )}
                                        >
                                            <span className="text-base font-semibold leading-snug">
                                                <UniversalMathJax inline dynamic>{rc.text}</UniversalMathJax>
                                            </span>

                                            {(isSelected || isItemCorrect || isWrongSelection) && (
                                                <div className="absolute right-2 top-2">
                                                    {isItemCorrect ? <Check className="w-4 h-4 opacity-70" /> : isWrongSelection ? <X className="w-4 h-4 opacity-70" /> : null}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {showResult && !isCorrect && (
                                <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Correct Answer:</span>
                                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                        <UniversalMathJax inline dynamic>{getRightText(cAns)}</UniversalMathJax>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- MOBILE VIEW (Card Stack) --- */}
            <div className="md:hidden space-y-3">
                {leftColumn.map((lc: any) => {
                    const currentMatchId = matches[lc.id];
                    const currentMatchText = currentMatchId ? getRightText(currentMatchId) : null;
                    const uAns = matches[lc.id];
                    const cAns = correctMatches[lc.id];
                    const isCorrect = showResult && uAns === cAns;
                    const isWrong = showResult && uAns && uAns !== cAns;

                    return (
                        <Dialog key={lc.id} open={activeLeftId === lc.id} onOpenChange={(open) => setActiveLeftId(open ? lc.id : null)}>
                            <DialogTrigger asChild>
                                <div
                                    className={`
                    p-4 rounded-xl border-2 transition-all active:scale-[0.98] cursor-pointer text-left
                    ${isCorrect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : isWrong ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : currentMatchId ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/40' : 'bg-card border-border hover:border-primary/20'}
                  `}
                                    onClick={() => !disabled && !showResult && setActiveLeftId(lc.id)}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="w-6 h-6 rounded bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">
                                            {lc.id}
                                        </span>
                                        {currentMatchId && (
                                            <Badge variant={isCorrect ? "default" : isWrong ? "destructive" : "secondary"} className={isCorrect ? "bg-green-600" : ""}>
                                                Matched: {currentMatchId}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="font-medium text-foreground/90 mb-3">
                                        <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                                    </div>

                                    {currentMatchId ? (
                                        <div className="p-2 bg-muted/30 rounded-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="w-1 h-8 bg-primary rounded-full"></div>
                                            <div className="line-clamp-2 w-full text-left">
                                                <UniversalMathJax inline dynamic>{currentMatchText}</UniversalMathJax>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-2 text-center text-xs text-muted-foreground border-t border-dashed border-border mt-2">
                                            Tap to select match
                                        </div>
                                    )}

                                    {showResult && !isCorrect && (
                                        <div className="mt-2 text-xs text-green-600 font-bold bg-green-500/10 p-2 rounded">
                                            Correct: {cAns} - {getRightText(cAns)}
                                        </div>
                                    )}
                                </div>
                            </DialogTrigger>

                            {!disabled && !showResult && (
                                <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto rounded-3xl">
                                    <DialogTitle>Select Match for {lc.id}</DialogTitle>
                                    <div className="py-2 space-y-2">
                                        <div className="p-3 bg-muted rounded-lg mb-4 text-sm text-muted-foreground text-left">
                                            <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                                        </div>
                                        <div className="h-px bg-border my-4" />
                                        {rightColumn.map((rc: any) => {
                                            const isSelected = currentMatchId === rc.id;
                                            return (
                                                <button
                                                    key={rc.id}
                                                    onClick={() => {
                                                        onSelect(lc.id, rc.id);
                                                        setActiveLeftId(null);
                                                    }}
                                                    className={`
                               w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3
                               ${isSelected ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-card border-border hover:bg-muted'}
                             `}
                                                >
                                                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                        {rc.id}
                                                    </span>
                                                    <div className="text-sm font-medium text-foreground text-left">
                                                        <UniversalMathJax inline dynamic>{rc.text}</UniversalMathJax>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </DialogContent>
                            )}
                        </Dialog>
                    );
                })}
            </div>

            {showResult && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2 text-left">Detailed Results</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {leftColumn.map((lc: any) => {
                            const uAns = matches[lc.id];
                            const cAns = correctMatches[lc.id];
                            const isCorrect = uAns === cAns;
                            return (
                                <div key={lc.id} className="flex items-center justify-between p-2 bg-card rounded border border-border text-sm">
                                    <span className="font-bold text-muted-foreground">{lc.id}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                                            <UniversalMathJax inline dynamic>{uAns ? getRightText(uAns) : '?'}</UniversalMathJax>
                                        </span>
                                        <span className="text-muted-foreground/30">→</span>
                                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                                            <UniversalMathJax inline dynamic>{getRightText(cAns)}</UniversalMathJax>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
