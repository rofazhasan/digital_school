"use client";

import React, { useState, useEffect, memo, useRef } from "react";
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
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local state if global state changes externally
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        // Cancel previous pending update
        if (timerRef.current) clearTimeout(timerRef.current);
        
        // Schedule new update
        timerRef.current = setTimeout(() => {
            onChange(newVal);
        }, 1000);
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
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChange(newVal);
        }, 1000);
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
