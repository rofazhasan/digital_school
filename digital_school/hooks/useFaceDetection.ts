import { useEffect, useRef, useState, useCallback } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { toast } from 'sonner';

interface UseFaceDetectionProps {
    isExamActive: boolean;
    onViolation: (count: number) => void;
    maxWarnings: number;
    onAutoSubmit?: (reason: string) => void;
}

export const useFaceDetection = ({ isExamActive, onViolation, maxWarnings, onAutoSubmit }: UseFaceDetectionProps) => {
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
    const isLookingAwayRef = useRef<number | null>(null);

    const startCamera = useCallback(async () => {
        if (!isExamActive) return;

        setCameraError(null);
        setIsCameraReady(false);

        try {
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser API not supported");
            }

            console.log("Requesting camera access...");

            // Add timeout for camera permission
            const streamPromise = navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: false,
            });

            // Timeout after 10 seconds if permission dialog is ignored
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Camera permission timeout")), 10000)
            );

            const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream;
            console.log("Camera access granted, stream id:", stream.id);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for metadata to load to ensure video is ready used
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        console.log("Video metadata loaded, attempting to play");
                        await videoRef.current?.play();
                        setIsCameraReady(true);
                        console.log("Camera ready and playing");
                    } catch (playErr) {
                        console.error('Video play error:', playErr);
                        setCameraError('Failed to start video stream.');
                    }
                };
            } else {
                console.warn("videoRef.current is null, retrying attachment in 500ms");
                // Retry once after a short delay
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().then(() => setIsCameraReady(true)).catch(e => console.error(e));
                    } else {
                        console.error("videoRef.current is still null");
                        setCameraError("Camera initialized but video element missing. Please refresh.");
                    }
                }, 500);
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            // Differentiate error types if possible
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setCameraError('Permission denied. Please allow camera access.');
                toast.error('Camera access denied. Please enable permissions.');
            } else if (err instanceof Error && err.message === "Camera permission timeout") {
                setCameraError('Camera request timed out. Please check permissions.');
            } else {
                setCameraError('Failed to access camera.');
                toast.error('Camera access failed.');
            }
        }
    }, [isExamActive]);

    // Initialize Camera
    useEffect(() => {
        if (isExamActive) {
            startCamera();
        } else {
            setIsCameraReady(false);
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            setIsCameraReady(false);
        };
    }, [isExamActive, startCamera]);

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
                } else {
                    // --- GAZE / HEAD POSE DETECTION (Single Face) ---
                    const face = predictions[0];
                    if (face.landmarks) {
                        // Landmarks: 0=RightEye, 1=LeftEye, 2=Nose, 3=Mouth, 4=RightEar, 5=LeftEar
                        const landmarks = face.landmarks as number[][];
                        const rightEye = landmarks[0] as [number, number];
                        const leftEye = landmarks[1] as [number, number];
                        const nose = landmarks[2] as [number, number];

                        // Calculate horizontal center of eyes
                        const eyesCenter = (rightEye[0] + leftEye[0]) / 2;

                        // Calculate face width (approximate)
                        const faceWidth = Math.abs(rightEye[0] - leftEye[0]);

                        // Calculate nose deviation from center
                        // If nose is significantly to the left or right of eye center, head is turned
                        const deviation = nose[0] - eyesCenter;

                        // Normalize deviation by face width
                        // Threshold: 0.5 means nose is halfway to the ear (approx)
                        const turnRatio = deviation / (faceWidth || 1);

                        // If ratio > 0.6 (Right) or < -0.6 (Left) -> Looking away
                        // We use a looser threshold to avoid false positives
                        if (Math.abs(turnRatio) > 0.65) {
                            if (!isLookingAwayRef.current) {
                                isLookingAwayRef.current = now;
                            } else if (now - isLookingAwayRef.current > 4000) {
                                // Looking away for > 4 seconds
                                if (now - lastViolationTime.current > 10000) { // Debounce violations
                                    triggerViolation("Please look at the screen. Head turned away detected.");
                                    isLookingAwayRef.current = null; // Reset
                                }
                            }
                        } else {
                            isLookingAwayRef.current = null; // Reset if looking straight
                        }
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
        modelError,
        retryCamera: startCamera
    };
};
