import React from 'react';
import { Card } from "@/components/ui/card";
import { Loader2, Camera, CameraOff } from 'lucide-react';

interface ProctoringCameraProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraReady: boolean;
    modelLoaded: boolean;
    warnings: number;
    maxWarnings: number;
}

export const ProctoringCamera: React.FC<ProctoringCameraProps> = ({
    videoRef,
    isCameraReady,
    modelLoaded,
    warnings,
    maxWarnings
}) => {
    return (
        <Card className="fixed bottom-4 right-4 w-48 h-36 z-50 overflow-hidden shadow-2xl border-2 border-primary/20 bg-black/90 group transition-all hover:scale-105">
            {/* Video Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Loading State */}
            {(!isCameraReady || !modelLoaded) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-medium">Starting AI Proctor...</span>
                </div>
            )}

            {/* Status Overlay */}
            <div className="absolute top-2 right-2 flex gap-1">
                {isCameraReady ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
            </div>

            {warnings > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] font-bold py-1 text-center">
                    {warnings} VIOLATIONS DETECTED
                </div>
            )}

            {/* Helper Text on Hover */}
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white text-center font-medium">Keep face visible</p>
            </div>
        </Card>
    );
};
