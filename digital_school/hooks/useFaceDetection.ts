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

    // Detailed Status States
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [modelError, setModelError] = useState<string | null>(null);

    // Grace Period Logic
    const GRACE_PERIOD_MS = 40000; // 40 Seconds
    const [faceMissingSince, setFaceMissingSince] = useState<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    // Initialize Camera
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (!isExamActive) return;

            setCameraError(null);
            try {
                // Check if browser supports getUserMedia
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Browser API not supported");
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for metadata to load to ensure video is ready used
                    videoRef.current.onloadedmetadata = async () => {
                        try {
                            await videoRef.current?.play();
                            setIsCameraReady(true);
                        } catch (playErr) {
                            console.error('Video play error:', playErr);
                            setCameraError('Failed to start video stream.');
                        }
                    };
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                // Differentiate error types if possible
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    setCameraError('Permission denied. Please allow camera access.');
                    toast.error('Camera access denied. Please enable permissions.');
                } else {
                    setCameraError('Failed to access camera.');
                    toast.error('Camera access failed.');
                }
            }
        };

        if (isExamActive) {
            startCamera();
        } else {
            setIsCameraReady(false);
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setIsCameraReady(false);
        };
    }, [isExamActive]);

    // Load Model
    useEffect(() => {
        const loadModel = async () => {
            if (!isExamActive) return;

            setModelError(null);
            try {
                // Ensure backend is ready
                await tf.ready();

                try {
                    await tf.setBackend('webgl');
                } catch (bgErr) {
                    console.warn('WebGL backend failed, falling back to cpu', bgErr);
                    await tf.setBackend('cpu');
                }

                console.log("Loading BlazeFace model...");
                // Add timeout to model loading
                const modelPromise = blazeface.load();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Model load timeout")), 15000)
                );

                const model = await Promise.race([modelPromise, timeoutPromise]) as blazeface.BlazeFaceModel;

                modelRef.current = model;
                setModelLoaded(true);
                console.log("BlazeFace model loaded successfully");
            } catch (err) {
                console.error('Error loading face detection model:', err);
                setModelError('Failed to load AI model. Please check connection and refresh.');
                toast.error('Proctoring AI failed to load.');
            }
        };

        if (isExamActive && !modelLoaded) {
            loadModel();
        }
    }, [isExamActive, modelLoaded]);

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
                        return null; // Reset to give fresh grace period
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
        faceMissingSince,
        cameraError,
        modelError
    };
};
