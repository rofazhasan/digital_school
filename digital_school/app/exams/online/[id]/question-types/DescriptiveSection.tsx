"use client";

import React from "react";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { DebouncedTextarea } from "./SubjectiveSection";
import { toBengaliAlphabets } from '@/utils/numeralConverter';

interface DescriptiveSectionProps {
    question: any;
    userAnswer: any;
    disabled: boolean;
    submitted: boolean;
    onAnswerChange: (value: any) => void;
}

export const DescriptiveSection = ({
    question,
    userAnswer,
    disabled,
    submitted,
    onAnswerChange
}: DescriptiveSectionProps) => {
    const parts: any[] = question.subQuestions || [];

    return (
        <div className="space-y-8">
            {parts.map((part: any, pIdx: number) => {
                const ansKey = (sub: string | number) => `${question.id}_desc_${pIdx}_${sub}`;
                const getAns = (sub: string | number) => userAnswer?.[ansKey(sub)] ?? '';
                const setAns = (sub: string | number, val: string) =>
                    onAnswerChange({ ...userAnswer, [ansKey(sub)]: val });

                return (
                    <div key={pIdx} className="space-y-3 border rounded-xl p-4 bg-amber-50/40 dark:bg-amber-900/10 text-left">
                        {/* Part header */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">{part.label || `Part ${pIdx + 1}`}</span>
                            <span className="text-xs text-muted-foreground">[{part.marks} marks]</span>
                        </div>

                        {/* Instructions */}
                        {part.instructions && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic text-left">{part.instructions}</p>
                        )}

                        {/* ── WRITING ── */}
                        {part.subType === 'writing' && (
                            <div className="space-y-4">
                                {part.sourceText && (
                                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-base leading-relaxed text-blue-900 dark:text-blue-100 relative group text-left">
                                        <div className="absolute top-2 right-4 text-[10px] font-bold text-blue-300 dark:text-blue-700 uppercase tracking-widest pointer-events-none group-hover:text-blue-400 transition-colors">Source Material</div>
                                        <UniversalMathJax dynamic>{part.sourceText}</UniversalMathJax>
                                    </div>
                                )}
                                <DebouncedTextarea
                                    value={getAns('ans') as string}
                                    onChange={(val) => setAns('ans', val)}
                                    disabled={disabled || submitted}
                                    rows={8}
                                    placeholder={
                                        part.writingType === 'translation' ? 'Enter the translation in target language…' :
                                            part.writingType === 'summary' ? 'Write your concise summary (সারাংশ) here…' :
                                                part.writingType === 'story' ? 'Continue the narrative based on the prompt…' :
                                                    part.writingType === 'dialogue' ? 'Compose the dialogue between characters…' :
                                                        'Provide your detailed answer here…'
                                    }
                                    className="w-full p-5 rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base leading-relaxed resize-none"
                                />
                            </div>
                        )}

                        {/* ── FILL_IN ── */}
                        {part.subType === 'fill_in' && (
                            <div className="space-y-4">
                                {part.wordBox && part.wordBox.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-2xl shadow-sm">
                                        <div className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-300/60 w-full mb-2 uppercase tracking-tight text-left">Available Words:</div>
                                        {part.wordBox.map((w: string, wi: number) => (
                                            <span key={wi} className="px-3 py-1 bg-white dark:bg-gray-800 text-indigo-800 dark:text-indigo-200 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">{w}</span>
                                        ))}
                                    </div>
                                )}

                                {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (() => {
                                    const segments = part.passage.split('___');
                                    return (
                                        <div className="text-base leading-relaxed p-5 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-border backdrop-blur-sm text-left">
                                            {segments.map((seg: string, si: number) => (
                                                <span key={si}>
                                                    <UniversalMathJax inline dynamic>{seg}</UniversalMathJax>
                                                    {si < segments.length - 1 && (
                                                        <input
                                                            type="text"
                                                            value={getAns(si) as string}
                                                            onChange={(e) => setAns(si, e.target.value)}
                                                            disabled={disabled || submitted}
                                                            className="inline-block w-28 border-b-2 border-primary/40 bg-transparent text-center text-sm font-bold focus:outline-none focus:border-primary focus:bg-primary/5 transition-all mx-1 h-8 rounded-t-md"
                                                            placeholder={`(${si + 1})`}
                                                        />
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {part.fillType && part.fillType !== 'gap_passage' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(part.items || []).map((item: string, ii: number) => (
                                            <div key={ii} className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-2xl border border-border/50 group hover:border-primary/30 transition-colors text-left">
                                                <div className="flex gap-3 items-start mb-3">
                                                    <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">{ii + 1}</span>
                                                    <div className="text-sm font-medium text-foreground/80 pt-0.5 text-left"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={getAns(ii) as string}
                                                    onChange={(e) => setAns(ii, e.target.value)}
                                                    disabled={disabled || submitted}
                                                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder={
                                                        part.fillType === 'punctuation' ? 'Rewrite with punctuation…' :
                                                            part.fillType === 'sentence_change' ? 'Write the changed sentence…' :
                                                                part.fillType === 'tag_question' ? 'Write the tag…' :
                                                                    'Your answer…'
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── COMPREHENSION ── */}
                        {part.subType === 'comprehension' && (
                            <div className="space-y-4">
                                {part.passage && (
                                    <div className="p-5 bg-card/50 border border-border rounded-2xl text-base leading-relaxed text-foreground/90 text-left">
                                        <UniversalMathJax dynamic>{part.passage}</UniversalMathJax>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-4">
                                    {(part.questions || []).map((q: any, qi: number) => (
                                        <div key={qi} className="space-y-2 text-left">
                                            <p className="text-sm font-bold text-foreground/80 flex gap-2">
                                                <span>{qi + 1}.</span>
                                                <UniversalMathJax inline dynamic>{q.text || q}</UniversalMathJax>
                                            </p>
                                            <DebouncedTextarea
                                                value={getAns(qi) as string}
                                                onChange={(val) => setAns(qi, val)}
                                                disabled={disabled || submitted}
                                                rows={3}
                                                placeholder="Your answer…"
                                                className="w-full p-3 rounded-xl border border-border bg-background focus:border-primary transition-all text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
