"use client";

import React from "react";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { DebouncedTextarea } from "./SubjectiveSection";
import { toBengaliAlphabets } from '@/utils/numeralConverter';
import { ZoomableImage, QuestionImageGallery } from "./shared";
import { BeautifulChart } from "@/app/components/BeautifulChart";
import { ChevronRight, ArrowDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DescriptiveSectionProps {
    question: any;
    userAnswer: any;
    answers: any;
    setAnswers: (val: any) => void;
    setIsUploading?: (val: boolean) => void;
    onCaptureClick: (target: { qId: string, idx?: number }) => void;
    disabled: boolean;
    submitted: boolean;
    onAnswerChange: (value: any) => void;
}

export const DescriptiveSection = ({
    question,
    userAnswer,
    answers,
    setAnswers,
    setIsUploading,
    onCaptureClick,
    disabled,
    submitted,
    onAnswerChange
}: DescriptiveSectionProps) => {
    const parts: any[] = question.subQuestions || question.sub_questions || question.parts || [];

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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">{part.label || `Part ${pIdx + 1}`}</span>
                                <span className="text-xs text-muted-foreground">[{part.marks} marks]</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        {(part.instructions || part.instruction)?.trim() && (
                            <div className="p-3 bg-white/60 dark:bg-amber-900/5 border-l-4 border-amber-500 rounded-r shadow-sm border-y border-r border-amber-100 dark:border-amber-900/20">
                                <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    Student Instructions
                                </div>
                                <div className="text-sm font-medium text-amber-900 dark:text-amber-100 italic leading-relaxed">
                                    <UniversalMathJax dynamic>{part.instructions || part.instruction}</UniversalMathJax>
                                </div>
                            </div>
                        )}

                        {/* Main Text Content */}
                        {(part.text || part.questionText) && (
                            <div className="text-base font-medium text-amber-900 dark:text-amber-100 leading-relaxed bg-white/40 dark:bg-gray-800/20 p-4 rounded-xl border border-amber-200/20 shadow-sm whitespace-pre-wrap">
                                <UniversalMathJax dynamic>{(part.text || part.questionText || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                            </div>
                        )}

                        {/* ── WRITING ── */}
                        {part.subType === 'writing' && (
                            <div className="space-y-4">
                                {part.sourceText && (
                                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-base leading-relaxed text-blue-900 dark:text-blue-100 relative group text-left whitespace-pre-wrap">
                                        <div className="absolute top-2 right-4 text-[10px] font-bold text-blue-300 dark:text-blue-700 uppercase tracking-widest pointer-events-none group-hover:text-blue-400 transition-colors">Source Material</div>
                                        <UniversalMathJax dynamic>{part.sourceText.replace(/\|\|/g, '\n')}</UniversalMathJax>
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
                                {part.wordBox && part.wordBox.length > 0 && part.clueType !== 'in_text' && (
                                    <div className="flex flex-wrap gap-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-2xl shadow-sm">
                                        <div className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-300/60 w-full mb-2 uppercase tracking-tight text-left">
                                            {part.clueType === 'word_box' ? 'Words in Box:' : 'Available Words:'}
                                        </div>
                                        {part.wordBox.map((w: string, wi: number) => (
                                            <span key={wi} className="px-3 py-1 bg-white dark:bg-gray-800 text-indigo-800 dark:text-indigo-200 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">{w}</span>
                                        ))}
                                    </div>
                                )}

                                {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (() => {
                                    const segments = part.passage.replace(/\|\|/g, '\n').split('___');
                                    return (
                                        <div className="text-base leading-relaxed p-5 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-border backdrop-blur-sm text-left whitespace-pre-wrap">
                                            {segments.map((seg: string, si: number) => (
                                                <span key={si}>
                                                    <UniversalMathJax inline dynamic>{seg}</UniversalMathJax>
                                                    {si < segments.length - 1 && (
                                                        part.clueType === 'in_text' ? (
                                                            <div className="inline-block mx-1">
                                                                <Select
                                                                    value={getAns(si) as string}
                                                                    onValueChange={(val) => setAns(si, val)}
                                                                    disabled={disabled || submitted}
                                                                >
                                                                    <SelectTrigger className="h-8 w-32 border-primary/40 focus:ring-primary/20">
                                                                        <SelectValue placeholder={`(${si + 1})`} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {(part.wordBox || []).map((w: string, wi: number) => (
                                                                            <SelectItem key={wi} value={w}>{w}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={getAns(si) as string}
                                                                onChange={(e) => setAns(si, e.target.value)}
                                                                disabled={disabled || submitted}
                                                                className="inline-block w-28 border-b-2 border-primary/40 bg-transparent text-center text-sm font-bold focus:outline-none focus:border-primary focus:bg-primary/5 transition-all mx-1 h-8 rounded-t-md"
                                                                placeholder={`(${si + 1})`}
                                                            />
                                                        )
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
                            <div className="space-y-4 text-left">
                                {(part.passage || part.stemPassage) && (
                                    <div className="p-5 bg-card/50 border border-border rounded-2xl text-base leading-relaxed text-foreground/90 whitespace-pre-wrap shadow-sm">
                                        <UniversalMathJax dynamic>{(part.passage || part.stemPassage || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                    </div>
                                )}
                                {part.primaryImage && (
                                    <div className="flex justify-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-border/50">
                                        <ZoomableImage src={part.primaryImage} alt="Passage Image" className="max-h-64 rounded-lg object-contain" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-4">
                                    {(part.questions || []).map((q: any, qi: number) => (
                                        <div key={qi} className="p-4 bg-muted/10 rounded-2xl border border-border/40 space-y-3">
                                            <div className="text-sm font-bold text-foreground/80 flex gap-2">
                                                <span className="shrink-0 text-primary">{qi + 1}.</span>
                                                <UniversalMathJax inline dynamic>{q.text || q}</UniversalMathJax>
                                            </div>
                                            <DebouncedTextarea
                                                value={getAns(qi) as string}
                                                onChange={(val) => setAns(qi, val)}
                                                disabled={disabled || submitted}
                                                rows={3}
                                                placeholder="Write your answer here..."
                                                className="w-full p-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm leading-relaxed"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── COMPREHENSION_MCQ ── */}
                        {part.subType === 'comprehension_mcq' && (
                            <div className="space-y-6 text-left">
                                {(part.passage || part.stemPassage) && (
                                    <div className="p-5 bg-card/50 border-l-4 border-amber-400 rounded-2xl text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                        <UniversalMathJax dynamic>{(part.passage || part.stemPassage || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                    </div>
                                )}
                                {part.primaryImage && (
                                    <div className="flex justify-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-border/50">
                                        <ZoomableImage src={part.primaryImage} alt="Passage Image" className="max-h-64 rounded-lg object-contain" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(part.subQuestions || part.questions || []).map((sq: any, sqi: number) => (
                                        <div key={sqi} className="p-5 bg-white dark:bg-gray-800/40 border border-border/50 rounded-2xl shadow-sm space-y-4">
                                            <div className="flex gap-3">
                                                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-black text-amber-700 dark:text-amber-400 border border-amber-200/50">{sqi + 1}</span>
                                                <div className="text-base font-bold leading-tight">
                                                    <UniversalMathJax dynamic>{sq.questionText || sq.text || sq.question}</UniversalMathJax>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 pl-9">
                                                {(sq.options || []).map((opt: any, oidx: number) => {
                                                    const optText = typeof opt === 'string' ? opt : opt.text;
                                                    const isSelected = getAns(sqi) === optText;
                                                    return (
                                                        <button
                                                            key={oidx}
                                                            onClick={() => !disabled && !submitted && setAns(sqi, optText)}
                                                            disabled={disabled || submitted}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-amber-100 border-amber-400 dark:bg-amber-900/40 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/20' : 'bg-transparent border-border/60 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/30'}`}
                                                        >
                                                            <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>{String.fromCharCode(65 + oidx)}</span>
                                                            <div className="flex-1 text-sm"><UniversalMathJax inline>{optText}</UniversalMathJax></div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── SHORT_ANSWER ── */}
                        {part.subType === 'short_answer' && (
                            <div className="space-y-6">
                                {(part.questions || []).map((q: string, qi: number) => (
                                    <div key={qi} className="space-y-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-border/50 group transition-all hover:border-amber-200">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-200/50 shrink-0 mt-0.5">{qi + 1}</div>
                                            <div className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug"><UniversalMathJax dynamic>{q}</UniversalMathJax></div>
                                        </div>
                                        <DebouncedTextarea
                                            value={getAns(qi) as string}
                                            onChange={(val) => setAns(qi, val)}
                                            disabled={disabled || submitted}
                                            rows={2}
                                            placeholder="Write your answer here…"
                                            className="w-full p-4 rounded-xl border border-border bg-background/50 focus:border-amber-400 transition-all text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── ERROR_CORRECTION ── */}
                        {part.subType === 'error_correction' && (
                            <div className="space-y-4">
                                {(part.sentences || []).map((s: string, si: number) => (
                                    <div key={si} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-border/50 group transition-all hover:border-amber-200 space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase shrink-0 mt-0.5">{String.fromCharCode(97 + si)}</div>
                                            <div className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed"><UniversalMathJax dynamic>{s}</UniversalMathJax></div>
                                        </div>
                                        <div className="flex gap-2 items-center bg-amber-50/30 dark:bg-amber-900/10 p-2 rounded-xl">
                                            <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                                            <input
                                                type="text"
                                                value={getAns(si) as string}
                                                onChange={(e) => setAns(si, e.target.value)}
                                                disabled={disabled || submitted}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-amber-700 dark:text-amber-400 placeholder-amber-200"
                                                placeholder="Enter the corrected sentence here…"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── MATCHING ── */}
                        {part.subType === 'matching' && (
                            <div className="overflow-x-auto py-2">
                                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${[part.leftColumn, part.rightColumn, part.columnC, part.columnD].filter(c => c && c.length > 0).length}, minmax(200px, 1fr))` }}>
                                    {[
                                        { label: 'Column A', data: part.leftColumn },
                                        { label: 'Column B', data: part.rightColumn },
                                        { label: 'Column C', data: part.columnC },
                                        { label: 'Column D', data: part.columnD }
                                    ].filter(c => c.data && c.data.length > 0).map((col, ci) => (
                                        <div key={ci} className="space-y-2">
                                            <div className="text-xs font-black text-amber-700/60 uppercase tracking-widest px-2">{col.label}</div>
                                            <div className="space-y-2">
                                                {col.data.map((item: any, ii: number) => (
                                                    <div key={ii} className="p-3 bg-white dark:bg-gray-800 border-2 border-amber-100 dark:border-amber-900/30 rounded-xl text-sm font-medium shadow-sm flex gap-2">
                                                        <span className="text-amber-500 font-bold">{ci === 0 ? (ii + 1) : String.fromCharCode(65 + ii)}{ci > 1 ? (ci === 2 ? '.I' : '.a') : ''}.</span>
                                                        <UniversalMathJax inline dynamic>{item.text || item}</UniversalMathJax>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 border border-amber-200/50 rounded-2xl">
                                    <div className="text-xs font-bold mb-3 text-amber-800">Match the pairs (e.g. 1-A-I):</div>
                                    <DebouncedTextarea
                                        value={getAns('match') as string}
                                        onChange={(val) => setAns('match', val)}
                                        disabled={disabled || submitted}
                                        rows={2}
                                        placeholder="e.g. 1-A-I, 2-B-II, 3-C-III..."
                                        className="w-full p-4 rounded-xl border-2 border-amber-100 bg-background text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── FLOWCHART ── */}
                        {part.subType === 'flowchart' && (
                            <div className="space-y-6 flex flex-col items-center">
                                {(part.items || []).map((item: string, ii: number) => {
                                    const isVertical = part.flowchartStyle !== 'horizontal';
                                    const isPrompt = ii === 0;

                                    return (
                                        <React.Fragment key={ii}>
                                            <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 rounded-2xl shadow-md min-w-[200px] max-w-lg text-center relative group">
                                                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-gray-950">{ii + 1}</div>
                                                <div className="text-base font-semibold leading-relaxed">
                                                    {isPrompt ? (
                                                        <UniversalMathJax dynamic>{item}</UniversalMathJax>
                                                    ) : (
                                                        <textarea
                                                            value={getAns(`flow_${ii}_0`) as string}
                                                            onChange={(e) => setAns(`flow_${ii}_0`, e.target.value)}
                                                            disabled={disabled || submitted}
                                                            className="w-full bg-transparent text-center focus:outline-none placeholder:text-amber-200 dark:placeholder:text-amber-900/50 resize-none overflow-hidden min-h-[40px] border-b-2 border-dashed border-amber-300 h-auto"
                                                            placeholder={`Complete Step ${ii + 1}...`}
                                                            rows={1}
                                                            onInput={(e) => {
                                                                const target = e.target as HTMLTextAreaElement;
                                                                target.style.height = 'auto';
                                                                target.style.height = (target.scrollHeight) + 'px';
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            {ii < (part.items || []).length - 1 && (
                                                <div className="flex items-center justify-center text-amber-300 dark:text-amber-800 py-1">
                                                    {isVertical ? <ArrowDown className="w-8 h-8 animate-pulse" /> : <ChevronRight className="w-8 h-8 animate-pulse" />}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── TABLE ── */}
                        {part.subType === 'table' && (
                            <div className="overflow-x-auto rounded-xl border border-border mt-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            {(part.tableHeaders || []).map((h: string, hi: number) => (
                                                <th key={hi} className="p-3 text-left font-bold text-muted-foreground"><UniversalMathJax inline dynamic>{h}</UniversalMathJax></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(part.tableRows || []).map((row: string[], ri: number) => (
                                            <tr key={ri} className="hover:bg-muted/20 transition-colors">
                                                {(part.tableHeaders || []).map((_: string, ci: number) => {
                                                    const isBlank = !row[ci] || row[ci] === '___';
                                                    return (
                                                        <td key={ci} className="p-3">
                                                            {isBlank ? (
                                                                <input
                                                                    type="text"
                                                                    value={getAns(`${ri}_${ci}`) as string}
                                                                    onChange={(e) => setAns(`${ri}_${ci}`, e.target.value)}
                                                                    disabled={disabled || submitted}
                                                                    className="w-full min-w-[100px] border-b-2 border-primary/40 focus:border-primary focus:outline-none bg-transparent px-2 py-1 transition-all"
                                                                    placeholder="..."
                                                                />
                                                            ) : (
                                                                <span className="text-foreground/80"><UniversalMathJax inline dynamic>{row[ci]}</UniversalMathJax></span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── REARRANGING ── */}
                        {part.subType === 'rearranging' && (
                            <div className="space-y-4 bg-muted/20 p-4 md:p-6 rounded-2xl border border-border text-left">
                                <div className="text-xs font-black text-primary/70 uppercase tracking-widest mb-4">Arrange the Following</div>
                                <div className="space-y-2">
                                    {(part.items || []).map((item: string, ii: number) => (
                                        <div key={ii} className="flex gap-3 items-start p-3 bg-card border border-border/50 rounded-xl shadow-sm text-left">
                                            <span className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold leading-none">{String.fromCharCode(65 + ii)}</span>
                                            <div className="text-sm font-medium leading-relaxed pt-0.5"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-card border-2 border-primary/20 rounded-xl shadow-inner text-left">
                                    <div className="text-xs font-bold mb-2 text-foreground/80">Your Sequence (e.g. B, D, A, C ...):</div>
                                    <input
                                        type="text"
                                        value={getAns('order') as string}
                                        onChange={(e) => setAns('order', e.target.value)}
                                        disabled={disabled || submitted}
                                        className="w-full bg-background border border-border/50 rounded-lg px-4 py-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                                        placeholder="Enter sequence..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── TRUE/FALSE ── */}
                        {part.subType === 'true_false' && (
                            <div className="grid grid-cols-1 gap-3">
                                {(part.statements || []).map((stmt: string, sIdx: number) => (
                                    <div key={sIdx} className="p-4 bg-card border border-border/50 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left shadow-sm">
                                        <div className="flex gap-3 flex-1">
                                            <span className="text-sm font-bold text-muted-foreground">{sIdx + 1}.</span>
                                            <div className="text-sm font-medium"><UniversalMathJax dynamic>{stmt}</UniversalMathJax></div>
                                        </div>
                                        <div className="shrink-0 w-32">
                                            <Select
                                                value={getAns(sIdx) as string}
                                                onValueChange={(val) => setAns(sIdx, val)}
                                                disabled={disabled || submitted}
                                            >
                                                <SelectTrigger className="w-full bg-background border-primary/30">
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="True">True</SelectItem>
                                                    <SelectItem value="False">False</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── LABEL DIAGRAM ── */}
                        {part.subType === 'label_diagram' && (
                            <div className="space-y-6 text-center">
                                {part.imageUrl && (
                                    <div className="relative inline-block border-2 border-border shadow-md rounded-xl overflow-hidden">
                                        <ZoomableImage src={part.imageUrl} alt="Diagram" className="max-w-full h-auto object-contain max-h-[350px]" />
                                        <div className="absolute inset-0 pointer-events-none">
                                            {(part.labels || []).map((l: any, i: number) => (
                                                <div key={i} className="absolute w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-black shadow-md border border-background" style={{ top: `${l.y}%`, left: `${l.x}%`, transform: 'translate(-50%, -50%)' }}>
                                                    {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(part.labels || []).map((_: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-card border border-border/50 rounded-lg shadow-sm text-left">
                                            <div className="w-8 h-8 shrink-0 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">{i + 1}</div>
                                            <input
                                                type="text"
                                                value={getAns(i) as string}
                                                onChange={(e) => setAns(i, e.target.value)}
                                                disabled={disabled || submitted}
                                                className="w-full bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary focus:outline-none px-2 py-1 text-sm transition-colors"
                                                placeholder={`Label ${i + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── INTERPRETING_GRAPH ── */}
                        {part.subType === 'interpreting_graph' && part.chartConfig && (
                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
                                    <BeautifulChart 
                                        type={part.chartConfig.type} 
                                        data={(part.chartConfig.labels || []).map((l: string, i: number) => ({
                                          label: l,
                                          value: part.chartConfig.data?.[i] || 0
                                        }))}
                                        xAxisLabel={part.chartConfig.xAxisLabel} 
                                        yAxisLabel={part.chartConfig.yAxisLabel}
                                    />
                                </div>
                                <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">Write your interpretation / answer here:</p>
                                    <DebouncedTextarea
                                        value={getAns('ans') as string}
                                        onChange={(val) => setAns('ans', val)}
                                        disabled={disabled || submitted}
                                        rows={4}
                                        placeholder="Based on the graph, provide your answer..."
                                        className="w-full p-4 rounded-xl border-2 border-amber-100 bg-background focus:border-amber-400 transition-all text-sm shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Image Gallery for each part */}
                        <div className="mt-6 pt-6 border-t border-dashed border-amber-200/50">
                            <div className="text-[10px] font-black text-amber-800/40 uppercase tracking-widest mb-3">Upload Answers / Sketches</div>
                            <QuestionImageGallery
                                qId={question.id}
                                subIdx={pIdx}
                                answers={answers}
                                setAnswers={setAnswers}
                                disabled={disabled}
                                submitted={submitted}
                                setIsUploading={setIsUploading}
                                onCaptureClick={(target: any) => onCaptureClick(target)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
