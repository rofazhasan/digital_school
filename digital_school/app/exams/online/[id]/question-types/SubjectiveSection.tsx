"use client";

import React, { useState, useEffect, memo } from "react";
import { Input } from "@/components/ui/input";

// Debounced Textarea for Subjective Answers
export const DebouncedTextarea = memo(({
    value,
    onChange,
    disabled,
    placeholder,
    rows,
    className,
}: {
    value: string,
    onChange: (val: string) => void,
    disabled: boolean,
    placeholder: string,
    rows?: number,
    className?: string,
}) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync local state if global state changes externally
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        // Debounce the global update
        const timeout = setTimeout(() => onChange(newVal), 1000);
        return () => clearTimeout(timeout);
    };

    return (
        <textarea
            value={localValue || ""}
            onChange={handleChange}
            disabled={disabled}
            rows={rows}
            className={className ?? "w-full min-h-[200px] p-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y text-base transition-all"}
            placeholder={placeholder}
        />
    );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';

// Debounced Input for CQ Sub-questions
export const DebouncedInput = memo(({
    value,
    onChange,
    disabled,
    placeholder
}: {
    value: string,
    onChange: (val: string) => void,
    disabled: boolean,
    placeholder: string
}) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        const timeout = setTimeout(() => onChange(newVal), 1000);
        return () => clearTimeout(timeout);
    };

    return (
        <Input
            value={localValue || ""}
            onChange={handleChange}
            disabled={disabled}
            className="bg-gray-50/50 h-12 rounded-xl border-border focus:ring-primary/20"
            placeholder={placeholder}
        />
    );
});

DebouncedInput.displayName = 'DebouncedInput';
