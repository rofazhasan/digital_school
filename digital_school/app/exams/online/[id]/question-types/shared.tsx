"use client";

import React from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, X, Upload, Camera as CameraIcon } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { compressImage } from "../performance-utils";

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

// Helper: Image Gallery + Upload Logic
export const QuestionImageGallery = memo(({ qId, subIdx, answers, setAnswers, disabled, submitted, setIsUploading, onCaptureClick }: any) => {
    const keyBase = typeof subIdx === 'number' ? `${qId}_sub_${subIdx}` : qId;
    const singleImage = answers[`${keyBase}_image`];
    const multipleImages = answers[`${keyBase}_images`] || [];
    const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setIsUploading?.(true);
        const slots = 5 - allImages.length;
        const toUpload = files.slice(0, slots);
        if (files.length > slots) toast.warning(`Only uploading ${slots} image(s). Max 5.`);

        const urls: string[] = [];
        for (const f of toUpload) {
            // Compress image before upload
            const compressedFile = await compressImage(f);
            
            const fd = new FormData();
            fd.append('file', compressedFile);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (res.ok) urls.push(data.url);
            } catch (err) { console.error(err); }
        }
        if (urls.length > 0) {
            setAnswers((prev: any) => ({ ...prev, [`${keyBase}_images`]: [...allImages, ...urls] }));
        }
        setIsUploading?.(false);
        e.target.value = '';
    };

    const removeImage = (idx: number) => {
        setAnswers((prev: any) => {
            const next = { ...prev };
            const filtered = allImages.filter((_: any, i: number) => i !== idx);
            if (filtered.length > 0) next[`${keyBase}_images`] = filtered;
            else delete next[`${keyBase}_images`];
            delete next[`${keyBase}_image`];
            return next;
        });
    };

    return (
        <div className="space-y-3">
            {allImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {allImages.map((url: string, i: number) => (
                        <div key={i} className="relative group">
                            <ZoomableImage src={url} alt="Gallery" className="h-16 w-16 object-cover rounded-lg border shadow-sm" />
                            {!disabled && !submitted && (
                                <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {!disabled && !submitted && allImages.length < 5 && (
                <div className="flex flex-wrap gap-2">
                    <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" id={`up-${keyBase}`} />
                    <label htmlFor={`up-${keyBase}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border rounded-xl text-xs font-bold cursor-pointer hover:bg-accent transition-colors">
                        <Upload className="w-3.5 h-3.5 text-primary" /> Upload Images
                    </label>
                    <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" id={`cap-${keyBase}`} />
                    <label htmlFor={`cap-${keyBase}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-bold cursor-pointer hover:bg-primary/10 transition-colors">
                        <CameraIcon className="w-3.5 h-3.5" /> Direct Capture
                    </label>
                    {!Capacitor.isNativePlatform() && (
                        <button onClick={onCaptureClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border rounded-xl text-xs font-bold hover:bg-accent transition-colors">
                            <CameraIcon className="w-3.5 h-3.5 text-muted-foreground" /> Webcam View
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

QuestionImageGallery.displayName = 'QuestionImageGallery';
