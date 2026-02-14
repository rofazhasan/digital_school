"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";

interface MTFItem {
    id: string;
    text: string;
}

interface MTFQuestionFormProps {
    leftColumn: MTFItem[];
    setLeftColumn: (items: MTFItem[]) => void;
    rightColumn: MTFItem[];
    setRightColumn: (items: MTFItem[]) => void;
    matches: Record<string, string>;
    setMatches: (matches: Record<string, string>) => void;
    explanation: string;
    setExplanation: (val: string) => void;
    MathToolbar: any;
    handleInsertSymbol: (symbol: string) => void;
    textareaRefs: any;
    makeFocusHandler: (id: string, setter: (v: any) => void) => () => void;
}

export const MTFQuestionForm: React.FC<MTFQuestionFormProps> = ({
    leftColumn,
    setLeftColumn,
    rightColumn,
    setRightColumn,
    matches,
    setMatches,
    explanation,
    setExplanation,
    MathToolbar,
    handleInsertSymbol,
    textareaRefs,
    makeFocusHandler,
}) => {
    const addLeftRow = () => {
        const newId = String(leftColumn.length + 1);
        setLeftColumn([...leftColumn, { id: newId, text: "" }]);
    };

    const addRightRow = () => {
        const nextLetter = String.fromCharCode(65 + rightColumn.length); // A, B, C...
        setRightColumn([...rightColumn, { id: nextLetter, text: "" }]);
    };

    const removeLeftRow = (index: number) => {
        const item = leftColumn[index];
        const newLeft = leftColumn.filter((_, i) => i !== index);
        setLeftColumn(newLeft);

        // Remove match if exists
        const newMatches = { ...matches };
        delete newMatches[item.id];
        setMatches(newMatches);
    };

    const removeRightRow = (index: number) => {
        const item = rightColumn[index];
        const newRight = rightColumn.filter((_, i) => i !== index);
        setRightColumn(newRight);

        // Remove any matches pointing to this item
        const newMatches = { ...matches };
        Object.keys(newMatches).forEach(key => {
            if (newMatches[key] === item.id) {
                delete newMatches[key];
            }
        });
        setMatches(newMatches);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <Card className="border-2 border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Column A (Left)</h3>
                        <Button variant="outline" size="sm" onClick={addLeftRow} className="h-7 text-[10px] gap-1 bg-white dark:bg-gray-950">
                            <Plus className="w-3 h-3" /> ADD ITEM
                        </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                        {leftColumn.map((item, idx) => (
                            <div key={item.id} className="flex gap-2 items-center group">
                                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                    {item.id}
                                </div>
                                <Input
                                    value={item.text}
                                    onChange={(e) => {
                                        const newLeft = [...leftColumn];
                                        newLeft[idx].text = e.target.value;
                                        setLeftColumn(newLeft);
                                    }}
                                    onFocus={makeFocusHandler(`left-${item.id}`, (val) => {
                                        const newLeft = [...leftColumn];
                                        newLeft[idx].text = val;
                                        setLeftColumn(newLeft);
                                    })}
                                    ref={(el) => { if (el) textareaRefs.current[`left-${item.id}`] = el; }}
                                    placeholder="Item text..."
                                    className="flex-1 text-sm rounded-xl h-10 border-gray-200 focus:ring-blue-500"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLeftRow(idx)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Right Column */}
                <Card className="border-2 border-purple-100 dark:border-purple-900 shadow-sm overflow-hidden">
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Column B (Right)</h3>
                        <Button variant="outline" size="sm" onClick={addRightRow} className="h-7 text-[10px] gap-1 bg-white dark:bg-gray-950">
                            <Plus className="w-3 h-3" /> ADD ITEM
                        </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                        {rightColumn.map((item, idx) => (
                            <div key={item.id} className="flex gap-2 items-center group">
                                <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                    {item.id}
                                </div>
                                <Input
                                    value={item.text}
                                    onChange={(e) => {
                                        const newRight = [...rightColumn];
                                        newRight[idx].text = e.target.value;
                                        setRightColumn(newRight);
                                    }}
                                    onFocus={makeFocusHandler(`right-${item.id}`, (val) => {
                                        const newRight = [...rightColumn];
                                        newRight[idx].text = val;
                                        setRightColumn(newRight);
                                    })}
                                    ref={(el) => { if (el) textareaRefs.current[`right-${item.id}`] = el; }}
                                    placeholder="Item text..."
                                    className="flex-1 text-sm rounded-xl h-10 border-gray-200 focus:ring-purple-500"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRightRow(idx)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Matching Matrix */}
            <Card className="border-2 border-green-100 dark:border-green-900 shadow-md">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 border-b border-green-100 dark:border-green-800">
                    <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Define Correct Matches
                    </h3>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">Select which item in Column A matches which item in Column B.</p>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leftColumn.map(left => (
                            <div key={left.id} className="space-y-2 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase">Column A: {left.id}</Label>
                                <Select
                                    value={matches[left.id] || ""}
                                    onValueChange={(val) => {
                                        const newMatches = { ...matches };
                                        newMatches[left.id] = val;
                                        setMatches(newMatches);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl h-10 border-gray-200 bg-white dark:bg-gray-950">
                                        <SelectValue placeholder="Select match..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rightColumn.map(right => (
                                            <SelectItem key={right.id} value={right.id}>
                                                {right.id}: {right.text.substring(0, 20)}...
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Math Toolbar & Explanation */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resources & Explanation</h3>
                </div>

                <MathToolbar />

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 dark:text-gray-400">Explanation (Optional)</Label>
                    <div className="relative group">
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            onFocus={makeFocusHandler('mtf-explanation', setExplanation)}
                            ref={(el) => { if (el) textareaRefs.current['mtf-explanation'] = el; }}
                            placeholder="Why are these matches correct?"
                            className="w-full min-h-[120px] p-4 text-sm rounded-3xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
