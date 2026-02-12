// MC Question Form Component
// This handles the Multiple Correct question type where multiple options can be correct

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Upload, Trash2, X } from "lucide-react";

interface MCOption {
    text: string;
    isCorrect: boolean;
    explanation?: string;
    image?: string;
}

interface MCFormProps {
    options: MCOption[];
    setOptions: (options: MCOption[]) => void;
    MathToolbar: React.ComponentType<{ onInsert: (text: string) => void }>;
    handleInsertSymbol: (text: string) => void;
    handleFieldImageUpload: (file: File, callback: (url: string) => void) => void;
    textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
    makeFocusHandler: (id: string, setter: (v: any) => void) => () => void;
}

export function MCQuestionForm({
    options,
    setOptions,
    MathToolbar,
    handleInsertSymbol,
    handleFieldImageUpload,
    textareaRefs,
    makeFocusHandler
}: MCFormProps) {
    const correctCount = options.filter(o => o.isCorrect).length;

    return (
        <div className="space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Multiple Correct:</strong> Select 2 or more correct options. Students must select ALL correct answers to get full marks.
                </p>
            </div>
            <Label>Options (Select multiple correct answers)</Label>
            <MathToolbar onInsert={handleInsertSymbol} />
            {options.map((opt, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={opt.isCorrect}
                            onCheckedChange={(checked) => {
                                const newOpts = [...options];
                                newOpts[i].isCorrect = checked as boolean;
                                setOptions(newOpts);
                            }}
                        />
                        <Textarea
                            ref={el => { textareaRefs.current[`mc-opt-${i}`] = el; }}
                            onFocus={makeFocusHandler(`mc-opt-${i}`, (newText) => {
                                const newOpts = [...options];
                                newOpts[i].text = newText;
                                setOptions(newOpts);
                            })}
                            value={opt.text}
                            onChange={e => {
                                const newOpts = [...options];
                                newOpts[i].text = e.target.value;
                                setOptions(newOpts);
                            }}
                            placeholder={`Option ${i + 1}`}
                            rows={2}
                            className="h-auto flex-grow"
                        />
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        handleFieldImageUpload(e.target.files[0], (url) => {
                                            const newOpts = [...options];
                                            newOpts[i].image = url;
                                            setOptions(newOpts);
                                        });
                                        e.target.value = '';
                                    }
                                }}
                                className="hidden"
                                id={`mc-opt-img-${i}`}
                            />
                            <Label htmlFor={`mc-opt-img-${i}`} className="cursor-pointer">
                                <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600" asChild>
                                    <span><Upload className="h-4 w-4" /></span>
                                </Button>
                            </Label>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setOptions(options.filter((_, idx) => i !== idx))}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                    {opt.image && (
                        <div className="ml-8 mb-2 relative w-20 h-20 group">
                            <img src={opt.image} alt="Option attachment" className="w-full h-full object-cover rounded border" />
                            <button
                                type="button"
                                onClick={() => {
                                    const newOpts = [...options];
                                    newOpts[i].image = undefined;
                                    setOptions(newOpts);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    {opt.isCorrect && (
                        <div className="ml-6 space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-400">Explanation (Optional)</Label>
                            <MathToolbar onInsert={handleInsertSymbol} />
                            <Textarea
                                ref={el => { textareaRefs.current[`mc-opt-expl-${i}`] = el; }}
                                onFocus={makeFocusHandler(`mc-opt-expl-${i}`, (newText) => {
                                    const newOpts = [...options];
                                    newOpts[i].explanation = newText;
                                    setOptions(newOpts);
                                })}
                                value={opt.explanation || ''}
                                onChange={e => {
                                    const newOpts = [...options];
                                    newOpts[i].explanation = e.target.value;
                                    setOptions(newOpts);
                                }}
                                placeholder="Explain why this option is correct..."
                                rows={3}
                                className="h-auto"
                            />
                        </div>
                    )}
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions([...options, { text: '', isCorrect: false, explanation: '', image: '' }])}
            >
                <PlusCircle className="mr-2 h-4 w-4" />Add Option
            </Button>
            {correctCount < 2 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-700">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        ⚠️ Please select at least 2 correct options for Multiple Correct questions.
                    </p>
                </div>
            )}
        </div>
    );
}
