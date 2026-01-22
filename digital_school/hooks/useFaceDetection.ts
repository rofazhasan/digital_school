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
                // Fallback to CPU if WebGL fails?
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

    // Detection Loop
    const detectFace = useCallback(async () => {
        if (!videoRef.current || !modelRef.current || !isExamActive || !isCameraReady) return;

        try {
            const returnTensors = false;
            const predictions = await modelRef.current.estimateFaces(videoRef.current, returnTensors);

            const now = Date.now();
            // Debounce violations (e.g., waiting 5 seconds between warnings)
            if (now - lastViolationTime.current > 5000) {

                if (predictions.length === 0) {
                    // No face detected
                    triggerViolation("No face detected! Please look at the screen.");
                } else if (predictions.length > 1) {
                    // Multiple faces detected
                    triggerViolation("Multiple faces detected! Only the examinee should be visible.");
                } else {
                    // Optional: Basic gaze estimation logic could go here based on landmarks
                    // But for lightweight, existence is the primary check.
                    // We can check face probability
                    /*
                    const face = predictions[0] as any;
                    if (face.probability && face.probability[0] < 0.9) {
                        // Low confidence
                    }
                    */
                }
            }
        } catch (err) {
            console.error('Detection error:', err);
        }

        requestRef.current = requestAnimationFrame(detectFace);
    }, [isExamActive, isCameraReady]);

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
    };

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
