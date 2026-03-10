"use client";

import React from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";

// Image Zoom Component
export const ZoomableImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className={`relative group cursor-zoom-in ${className}`}>
                    <img src={src} alt={alt} className="w-full h-full object-contain transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full h-fit max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
                <DialogTitle className="sr-only">Zoomed Image</DialogTitle>
                <img src={src} alt={alt} className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-background" />
            </DialogContent>
        </Dialog>
    );
};

export const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
    },
};
