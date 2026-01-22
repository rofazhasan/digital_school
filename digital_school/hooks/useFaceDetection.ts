import { useEffect, useRef, useState, useCallback } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { toast } from 'sonner';

interface UseFaceDetectionProps {
    isExamActive: boolean;
    onViolation: (count: number) => void;
    maxWarnings: number;
}

export const useFaceDetection = ({ isExamActive, onViolation, maxWarnings }: UseFaceDetectionProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const modelRef = useRef<blazeface.BlazeFaceModel | null>(null);
    const requestRef = useRef<number>(0);
    const [warnings, setWarnings] = useState(0);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

    // Grace Period Logic
    const GRACE_PERIOD_MS = 40000; // 40 Seconds
    const [faceMissingSince, setFaceMissingSince] = useState<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    // Initialize Camera
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setIsCameraReady(true);
                        videoRef.current?.play();
                    };
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                toast.error('Camera access is required for proctoring. Please allow camera access.');
            }
        };

        if (isExamActive) {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isExamActive]);

    // Load Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.setBackend('webgl');
                const model = await blazeface.load();
                modelRef.current = model;
                setModelLoaded(true);
            } catch (err) {
                console.error('Error loading face detection model:', err);
                try {
                    await tf.setBackend('cpu');
                    const model = await blazeface.load();
                    modelRef.current = model;
                    setModelLoaded(true);
                } catch (cpuErr) {
                    console.error('Failed to load model on CPU as well', cpuErr);
                    toast.error('Failed to load proctoring system.');
                }
            }
        };

        if (isExamActive) {
            loadModel();
        }
    }, [isExamActive]);

    const triggerViolation = (reason: string) => {
        lastViolationTime.current = Date.now();
        setWarnings(prev => {
            const newCount = prev + 1;

            toast.warning(`Security Alert ${newCount}/${maxWarnings}: ${reason}`, {
                duration: 4000,
                className: 'bg-red-500 text-white border-none font-bold',
            });

            onViolation(newCount);
            return newCount;
        });
        // Reset missing timer after violation to give another full grace period
        setFaceMissingSince(null);
    };

    // Detection Loop
    const detectFace = useCallback(async () => {
        if (!videoRef.current || !modelRef.current || !isExamActive || !isCameraReady) return;

        try {
            const returnTensors = false;
            const predictions = await modelRef.current.estimateFaces(videoRef.current, returnTensors);
            const now = Date.now();

            if (predictions.length === 0) {
                // --- NO FACE DETECTED ---
                setFaceMissingSince(prev => {
                    if (prev === null) return now; // Start timer

                    const elapsed = now - prev;
                    if (elapsed > GRACE_PERIOD_MS) {
                        // Timout exceeded
                        triggerViolation("Face not visible for 40 seconds. Please keep your face in the camera frame.");
                        return null; // Reset to null so it restarts if they stay missing (or we can keep triggering?)
                        // Let's reset so they get another 40s.
                    }
                    return prev; // Keep existing start time
                });

            } else {
                // --- FACE DETECTED ---
                setFaceMissingSince(null); // Reset timer immediately

                if (predictions.length > 1) {
                    // Multiple faces - immediate violation with debounce
                    if (now - lastViolationTime.current > 5000) {
                        triggerViolation("Multiple faces detected! Only the examinee should be visible.");
                    }
                }
            }

        } catch (err) {
            console.error('Detection error:', err);
        }

        requestRef.current = requestAnimationFrame(detectFace);
    }, [isExamActive, isCameraReady]);

    useEffect(() => {
        if (isExamActive && isCameraReady && modelLoaded) {
            requestRef.current = requestAnimationFrame(detectFace);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isExamActive, isCameraReady, modelLoaded, detectFace]);

    return {
        videoRef,
        warnings,
        isCameraReady,
        modelLoaded,
        faceMissingSince
    };
};
