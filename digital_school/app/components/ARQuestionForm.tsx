import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ARQuestionFormProps {
    assertion: string;
    setAssertion: (value: string) => void;
    reason: string;
    setReason: (value: string) => void;
    correctOption: number;
    setCorrectOption: (value: number) => void;
    explanation: string;
    setExplanation: (value: string) => void;
    MathToolbar: any;
    handleInsertSymbol: (symbol: string) => void;
    textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
    makeFocusHandler: (key: string, setter: (value: string) => void) => () => void;
}

const AR_OPTIONS = [
    { value: 1, label: "Both A and R are true, and R is the correct explanation of A" },
    { value: 2, label: "Both A and R are true, but R is NOT the correct explanation of A" },
    { value: 3, label: "A is true, but R is false" },
    { value: 4, label: "A is false, but R is true" },
    { value: 5, label: "Both A and R are false" },
];

export const ARQuestionForm: React.FC<ARQuestionFormProps> = ({
    assertion,
    setAssertion,
    reason,
    setReason,
    correctOption,
    setCorrectOption,
    explanation,
    setExplanation,
    MathToolbar,
    handleInsertSymbol,
    textareaRefs,
    makeFocusHandler,
}) => {
    return (
        <div className="space-y-4">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">AR Question Format</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Create two statements: Assertion (A) and Reason (R). Students will evaluate their truth and relationship.
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>Option 1:</strong> Both true, R explains A</p>
                    <p><strong>Option 2:</strong> Both true, R doesn't explain A</p>
                    <p><strong>Option 3:</strong> A true, R false</p>
                    <p><strong>Option 4:</strong> A false, R true</p>
                    <p><strong>Option 5:</strong> Both false</p>
                </div>
            </div>

            {/* Assertion */}
            <div>
                <Label className="text-sm font-semibold">Assertion (A) *</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                <Textarea
                    ref={(el) => { textareaRefs.current['assertion'] = el; }}
                    onFocus={makeFocusHandler('assertion', setAssertion)}
                    value={assertion}
                    onChange={(e) => setAssertion(e.target.value)}
                    placeholder="Enter the assertion statement..."
                    rows={4}
                    className="mt-1"
                />
                {assertion && /\\/.test(assertion) && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium">Mathematical content detected</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Reason */}
            <div>
                <Label className="text-sm font-semibold">Reason (R) *</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                <Textarea
                    ref={(el) => { textareaRefs.current['reason'] = el; }}
                    onFocus={makeFocusHandler('reason', setReason)}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason statement..."
                    rows={4}
                    className="mt-1"
                />
                {reason && /\\/.test(reason) && (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-xs font-medium">Mathematical content detected</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Correct Option */}
            <div>
                <Label className="text-sm font-semibold">Correct Option *</Label>
                <Select value={correctOption.toString()} onValueChange={(val) => setCorrectOption(parseInt(val))}>
                    <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select the correct option" />
                    </SelectTrigger>
                    <SelectContent>
                        {AR_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                                <span className="font-semibold">Option {opt.value}:</span> {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Explanation */}
            <div>
                <Label className="text-sm font-semibold">Explanation (Optional)</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                <Textarea
                    ref={(el) => { textareaRefs.current['explanation'] = el; }}
                    onFocus={makeFocusHandler('explanation', setExplanation)}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Explain why the selected option is correct..."
                    rows={4}
                    className="mt-1"
                />
            </div>
        </div>
    );
};
