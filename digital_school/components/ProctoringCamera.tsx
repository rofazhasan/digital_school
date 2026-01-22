import React from 'react';
import { Card } from "@/components/ui/card";
import { Loader2, Camera, CameraOff } from 'lucide-react';

interface ProctoringCameraProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraReady: boolean;
    modelLoaded: boolean;
    warnings: number;
    maxWarnings: number;
    faceMissingSince: number | null;
    cameraError?: string | null;
    modelError?: string | null;
}

export const ProctoringCamera: React.FC<ProctoringCameraProps> = ({
    videoRef,
    isCameraReady,
    modelLoaded,
    warnings,
    maxWarnings,
    faceMissingSince,
    cameraError,
    modelError
}) => {
    // Calculate remaining seconds if face is missing
    const [secondsRemaining, setSecondsRemaining] = React.useState(40);

    React.useEffect(() => {
        if (!faceMissingSince) {
            setSecondsRemaining(40);
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Date.now() - faceMissingSince;
            const remaining = Math.max(0, 40 - Math.ceil(elapsed / 1000));
            setSecondsRemaining(remaining);
        }, 500);

        return () => clearInterval(interval);
    }, [faceMissingSince]);

    // Error State
    if (cameraError || modelError) {
        return (
            <Card className="fixed bottom-4 right-4 w-56 h-40 z-50 flex flex-col items-center justify-center bg-red-900/90 border-red-500 shadow-2xl p-4 text-center">
                <CameraOff className="w-8 h-8 text-red-300 mb-2" />
                <p className="text-xs text-white font-bold">{cameraError || modelError}</p>
                <p className="text-[10px] text-white/70 mt-1">Please allow camera or refresh.</p>
            </Card>
        );
    }

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

            {/* Loading / Status State */}
            {(!isCameraReady || !modelLoaded) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-2 bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">
                        {!isCameraReady ? "Waiting for Camera..." : "Loading AI Model..."}
                    </span>
                </div>
            )}

            {/* Status Overlay */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                {isCameraReady && modelLoaded ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
            </div>

            {/* Missing Face Countdown Overlay */}
            {faceMissingSince && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] text-yellow-500 animate-in fade-in duration-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Face Not Detected</p>
                    <p className="text-3xl font-black font-mono my-1">{secondsRemaining}s</p>
                    <p className="text-[9px] text-white/80 text-center px-2">Show face to avoid violation</p>
                </div>
            )}

            {/* Violation Banner */}
            {warnings > 0 && !faceMissingSince && (
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
