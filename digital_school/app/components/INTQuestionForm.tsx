import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface INTQuestionFormProps {
    correctAnswer: number;
    setCorrectAnswer: (value: number) => void;
    modelAnswer: string;
    setModelAnswer: (value: string) => void;
    MathToolbar: any;
    handleInsertSymbol: (symbol: string) => void;
    textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
    makeFocusHandler: (key: string, setter: (value: string) => void) => () => void;
}

export const INTQuestionForm: React.FC<INTQuestionFormProps> = ({
    correctAnswer,
    setCorrectAnswer,
    modelAnswer,
    setModelAnswer,
    MathToolbar,
    handleInsertSymbol,
    textareaRefs,
    makeFocusHandler,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-semibold">Correct Answer (Integer) *</Label>
                <Input
                    type="number"
                    value={correctAnswer || ''}
                    onChange={(e) => setCorrectAnswer(parseInt(e.target.value) || 0)}
                    placeholder="Enter the correct integer answer"
                    className="mt-1"
                    step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter the numerical answer as an integer (whole number)
                </p>
            </div>

            <div>
                <Label className="text-sm font-semibold">Solution/Explanation (Optional)</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                <Textarea
                    ref={(el) => { textareaRefs.current['modelans'] = el; }}
                    onFocus={makeFocusHandler('modelans', setModelAnswer)}
                    value={modelAnswer}
                    onChange={(e) => setModelAnswer(e.target.value)}
                    placeholder="Explain the solution step by step..."
                    rows={6}
                    className="mt-1"
                />
                {modelAnswer && /\\/.test(modelAnswer) && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium">Mathematical content detected</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
