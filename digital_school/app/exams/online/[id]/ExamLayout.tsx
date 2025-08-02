"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useExamContext } from "./ExamContext";
import Navigator from "./Navigator";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Confetti from 'react-confetti';

function SaveStatusIndicator() {
  const { saveStatus, isSyncPending, submitted } = useExamContext();
  if (submitted) return null;
  if (saveStatus === "saving") return <span className="ml-4 text-blue-500 animate-pulse">Saving...</span>;
  if (saveStatus === "saved") return <span className="ml-4 text-green-600">All changes saved ✓</span>;
  if (saveStatus === "error") return <span className="ml-4 text-red-600">Save failed!</span>;
  if (isSyncPending) return <span className="ml-4 text-yellow-600">Syncing...</span>;
  return null;
}

function OnlineStatusIndicator() {
  const { isOnline, isSyncPending } = useExamContext();
  if (!isOnline)
    return <span className="ml-4 text-orange-600" title="Offline"><span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1 align-middle" />Offline: changes will sync when online</span>;
  if (isSyncPending)
    return <span className="ml-4 text-yellow-600" title="Syncing"><span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-1 align-middle" />Syncing...</span>;
  return <span className="ml-4 text-green-600" title="Online"><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 align-middle" />Online</span>;
}

function AccessibilityToggles() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useExamContext();
  return (
    <div className="flex items-center ml-4 space-x-2">
      <label className="flex items-center space-x-1">
        <span className="text-xs">A</span>
        <select
          value={fontSize}
          onChange={e => setFontSize(e.target.value)}
          className="border rounded px-1 py-0.5 text-xs"
        >
          <option value="md">A</option>
          <option value="lg">A+</option>
          <option value="xl">A++</option>
        </select>
      </label>
      <label className="flex items-center space-x-1">
        <input
          type="checkbox"
          checked={highContrast}
          onChange={e => setHighContrast(e.target.checked)}
          className="accent-black"
        />
        <span className="text-xs">High Contrast</span>
      </label>
    </div>
  );
}

export default function ExamLayout() {
  const router = useRouter();
  const { exam, answers, fontSize, highContrast, navigation, setNavigation } = useExamContext();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");
  const [started, setStarted] = useState(false);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Filter out questions without valid IDs to prevent duplicate key errors
  const validQuestions = Array.isArray(exam.questions) ? exam.questions.filter((q: any) => {
    // Ensure question exists and has a valid ID
    if (!q || !q.id || typeof q.id !== 'string' || q.id.trim() === '') {
      return false;
    }
    return true;
  }).filter((q: any, index: number, self: any[]) => {
    // Remove duplicates based on ID
    const firstIndex = self.findIndex((q2: any) => q2.id === q.id);
    if (firstIndex !== index) {
      return false;
    }
    return true;
  }).map((q: any, index: number) => {
    // Ensure each question has a unique, non-empty ID
    if (!q.id || q.id.trim() === '') {
      return { ...q, id: `fallback-${index}` };
    }
    return q;
  }) : [];
  
  // Question visibility tracking using Intersection Observer
  useEffect(() => {
    if (!mainAreaRef.current || submitted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the question with the highest intersection ratio
        let bestQuestionIndex = 0;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const questionId = entry.target.getAttribute('data-question-id');
          if (!questionId) return;

          const questionIndex = validQuestions.findIndex((q: any) => q.id === questionId);
          if (questionIndex === -1) return;

          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestQuestionIndex = questionIndex;
          }
        });

        // Update current question if it's different and has sufficient visibility
        if (bestRatio > 0.3 && bestQuestionIndex !== navigation.current) {
          setNavigation({ ...navigation, current: bestQuestionIndex });
        }
      },
      {
        root: mainAreaRef.current,
        rootMargin: '-20% 0px -20% 0px', // Only consider questions in the center 60% of the viewport
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all question elements
    const observeQuestions = () => {
      const questionElements = Object.values(questionRefs.current).filter(ref => ref && ref.getAttribute('data-question-id'));
      
      questionElements.forEach((ref) => {
        if (ref && ref.getAttribute('data-question-id')) {
          observer.observe(ref);
        }
      });
    };

    // Initial observation
    observeQuestions();

    // Re-observe after a short delay to catch dynamically loaded questions
    const timeoutId = setTimeout(observeQuestions, 500);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [validQuestions, navigation, submitted, setNavigation]);
  
  // Determine if exam is MCQ-only
  const isMCQOnly = validQuestions.every((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq");

  const handleStart = async () => {
    try {
      // Track exam start time
      const startResponse = await fetch(`/api/exams/${exam.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
      } else {
        const successData = await startResponse.json().catch(() => ({}));
      }
    } catch (error) {
    }
    
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    setStarted(true);
  };

  const handleTimeUp = async () => {
    // Auto-submit when time runs out
    await handleSubmit();
    // Redirect to results page
    setTimeout(() => {
      router.push(`/exams/results/${exam.id}`);
    }, 2000);
  };

  const fetchResult = async () => {
    const res = await fetch(`/api/results?examId=${exam.id}`);
    if (res.ok) {
      const data = await res.json();
      setResult(data.result);
    }
  };

  const getCurrentUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (error) {
      console.error('Failed to get user data:', error);
    }
    return null;
  };

  // Fullscreen and anti-cheat logic (only after started)
  useEffect(() => {
    if (!started || submitted) return;
    // Tab switch/visibility
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setViolationCount(v => v + 1);
        setViolationMsg("Tab switch detected! Please stay on the exam page.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Fullscreen exit
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setViolationCount(v => v + 1);
        setViolationMsg("Fullscreen exited! Please stay in fullscreen during the exam.");
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [started, submitted]);

  // Auto-submit after 3 violations
  useEffect(() => {
    if (violationCount >= 3 && !submitted) {
      setViolationMsg("Too many violations. Exam will be auto-submitted.");
      handleSubmit();
    }
  }, [violationCount, submitted]);

  // Clear violation message when exam is submitted
  useEffect(() => {
    if (submitted) {
      setViolationMsg("");
    }
  }, [submitted]);

  // Prevent right-click and copy/paste in main area
  useEffect(() => {
    if (!started || submitted) return;
    const main = mainAreaRef.current;
    if (!main) return;
    const prevent = (e: Event) => e.preventDefault();
    main.addEventListener("contextmenu", prevent);
    main.addEventListener("copy", prevent);
    main.addEventListener("cut", prevent);
    main.addEventListener("paste", prevent);
    // Prevent screenshot (PrintScreen)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        setViolationMsg("স্ক্রিনশট নেয়া নিষিদ্ধ!");
        e.preventDefault();
      }
      // Block Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(e.key.toLowerCase())) {
        setViolationMsg("কপি/পেস্ট/কাট নিষিদ্ধ!");
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      main.removeEventListener("contextmenu", prevent);
      main.removeEventListener("copy", prevent);
      main.removeEventListener("cut", prevent);
      main.removeEventListener("paste", prevent);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mainAreaRef, started]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // Get current user data
      const currentUser = await getCurrentUser();
      
      // First, upload all images with metadata
      const imageUploadPromises = [];
      for (const [questionId, answer] of Object.entries(answers)) {
        if (questionId.endsWith('_images') && Array.isArray(answer)) {
          for (const imageData of answer) {
            const formData = new FormData();
            formData.append("image", imageData.file);
            formData.append("questionId", imageData.questionId);
            formData.append("studentId", currentUser?.studentProfile?.id || currentUser?.id || "");
            formData.append("studentName", currentUser?.name || "Unknown");
            formData.append("questionText", imageData.questionText);
            formData.append("timestamp", imageData.timestamp);
            
            const uploadPromise = fetch(`/api/exams/${exam.id}/upload-image`, {
              method: "POST",
              body: formData
            }).then(async (response) => {
              if (response.ok) {
                const result = await response.json();
                return { questionId: imageData.questionId, url: result.url };
              } else {
                throw new Error(`Failed to upload image for question ${imageData.questionId}`);
              }
            });
            imageUploadPromises.push(uploadPromise);
          }
        }
      }
      
      // Wait for all image uploads to complete
      const uploadedImages = await Promise.all(imageUploadPromises);
      
      // Replace file objects with URLs in answers
      const finalAnswers = { ...answers };
      for (const [questionId, answer] of Object.entries(answers)) {
        if (questionId.endsWith('_images') && Array.isArray(answer)) {
          const questionBaseId = questionId.replace('_images', '');
          const questionImages = uploadedImages.filter(img => img.questionId === questionBaseId);
          finalAnswers[questionId] = questionImages.map(img => img.url);
        }
      }
      
      const res = await fetch(`/api/exams/${exam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Submission failed: ${errText}`);
      }
      setSubmitted(true);
      await fetchResult();
      
      // Redirect to results page after a short delay
      setTimeout(() => {
        router.push(`/exams/results/${exam.id}`);
      }, 3000); // 3 second delay to show submission success
    } catch (e: any) {
      setError(e.message || "Submission failed");
      // Log error for debugging
      if (typeof window !== "undefined") console.error("Exam submission error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Font size classes
  const fontSizeClass = fontSize === 'md' ? 'text-base' : fontSize === 'lg' ? 'text-lg' : 'text-xl';
  const contrastClass = highContrast ? 'bg-black text-yellow-200' : '';

  // Calculate totalEarned using robust normalization for MCQ-only submitted exams
  let totalEarned = 0;
  if (submitted && isMCQOnly && result) {
    totalEarned = exam.questions.reduce((sum: number, q: any) => {
      let correctLabel = "";
      if (typeof q.correct === "number") {
        const correctOpt = q.options[q.correct];
        correctLabel = typeof correctOpt === "object" && correctOpt !== null ? (correctOpt.text || String(correctOpt)) : String(correctOpt);
      } else if (typeof q.correct === "object" && q.correct !== null) {
        correctLabel = q.correct.text || String(q.correct);
      } else {
        correctLabel = String(q.correct);
      }
      const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
      const userAnswer = result?.answers?.[q.id] ?? answers?.[q.id] ?? "";
      const isCorrect = normalize(userAnswer) === normalize(correctLabel);
      return sum + (isCorrect ? Number(q.marks) || 1 : 0);
    }, 0);
  }

  if (!started) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 overflow-hidden">
        {/* 3D Animated Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} />
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
              <mesh castShadow receiveShadow>
                <icosahedronGeometry args={[2.5, 1]} />
                <meshStandardMaterial color="#a78bfa" roughness={0.3} metalness={0.7} transparent opacity={0.18} />
              </mesh>
            </Float>
            <Environment preset="sunset" />
            <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
          </Canvas>
        </div>
        {/* Foreground Instructions */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, type: 'spring' }} className="relative z-10 w-full max-w-2xl mx-auto bg-white/80 rounded-3xl shadow-2xl p-8 mt-8 mb-8 backdrop-blur-md border border-purple-100">
          <div className="mb-6 text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-purple-700 mb-2 drop-shadow">{exam?.name || "পরীক্ষা"}</div>
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-gray-700 mb-2">
              <span>শ্রেণি: <span className="font-bold text-purple-600">{exam?.className || "N/A"}</span></span>
              <span>পূর্ণমান: <span className="font-bold text-purple-600">{exam?.totalMarks || "N/A"}</span></span>
              <span>সময়: <span className="font-bold text-purple-600">{exam?.duration} মিনিট</span></span>
              <span>ধরন: <span className="font-bold text-purple-600">{exam?.type || "N/A"}</span></span>
            </div>
            {exam?.description && <div className="text-gray-600 mt-2">{exam.description}</div>}
          </div>
          <div className="mb-6">
            <div className="text-lg font-bold text-purple-700 mb-2">পরীক্ষার নির্দেশনা (Instructions):</div>
            
            {/* Visual Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-semibold text-red-700 mb-1">নেগেটিভ মার্কিং</div>
                <div className="text-lg font-bold text-red-600">
                  {exam?.mcqNegativeMarking && exam.mcqNegativeMarking > 0 
                    ? `${exam.mcqNegativeMarking}%`
                    : "নেই"
                  }
                </div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-700 mb-1">CQ প্রশ্ন</div>
                <div className="text-lg font-bold text-blue-600">
                  {exam?.cqTotalQuestions && exam.cqTotalQuestions > 0 
                    ? `${exam.cqRequiredQuestions || 0}/${exam.cqTotalQuestions}`
                    : "নেই"
                  }
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-semibold text-green-700 mb-1">SQ প্রশ্ন</div>
                <div className="text-lg font-bold text-green-600">
                  {exam?.sqTotalQuestions && exam.sqTotalQuestions > 0 
                    ? `${exam.sqRequiredQuestions || 0}/${exam.sqTotalQuestions}`
                    : "নেই"
                  }
                </div>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-2 text-base text-gray-800">
              <li>পরীক্ষা শুরুর আগে সকল প্রস্তুতি সম্পন্ন করুন।</li>
              <li>পরীক্ষা চলাকালীন সময়ে অন্য ট্যাব/উইন্ডোতে যাবেন না।</li>
              <li>পরীক্ষা চলাকালীন কপি/পেস্ট, রাইট-ক্লিক, বা স্ক্রিনশট নেয়া নিষিদ্ধ।</li>
              <li>সমস্ত প্রশ্ন মনোযোগ সহকারে পড়ুন এবং উত্তর দিন।</li>
              
              {/* Negative Marking Instructions */}
              <li className="font-semibold text-red-600">
                {exam?.mcqNegativeMarking && exam.mcqNegativeMarking > 0 
                  ? `নেগেটিভ মার্কিং: MCQ প্রশ্নে ভুল উত্তরের জন্য ${exam.mcqNegativeMarking}% নেগেটিভ মার্ক কাটা হবে।`
                  : "নেগেটিভ মার্কিং: এই পরীক্ষায় কোনো নেগেটিভ মার্কিং নেই।"
                }
              </li>
              
              {/* CQ Instructions */}
              <li className="font-semibold text-blue-600">
                {exam?.cqTotalQuestions && exam.cqTotalQuestions > 0 
                  ? `CQ (ক্রিয়েটিভ প্রশ্ন): মোট ${exam.cqTotalQuestions}টি প্রশ্ন থেকে ${exam.cqRequiredQuestions || 0}টি প্রশ্নের উত্তর দিতে হবে।`
                  : "CQ (ক্রিয়েটিভ প্রশ্ন): এই পরীক্ষায় CQ প্রশ্ন নেই।"
                }
              </li>
              
              {/* SQ Instructions */}
              <li className="font-semibold text-green-600">
                {exam?.sqTotalQuestions && exam.sqTotalQuestions > 0 
                  ? `SQ (সংক্ষিপ্ত প্রশ্ন): মোট ${exam.sqTotalQuestions}টি প্রশ্ন থেকে ${exam.sqRequiredQuestions || 0}টি প্রশ্নের উত্তর দিতে হবে।`
                  : "SQ (সংক্ষিপ্ত প্রশ্ন): এই পরীক্ষায় SQ প্রশ্ন নেই।"
                }
              </li>
              
              {/* Answer Submission Rules */}
              <li className="font-semibold text-orange-600">
                উত্তর জমা দেওয়ার নিয়ম:
              </li>
              <li className="ml-4">• MCQ প্রশ্নে সঠিক অপশন নির্বাচন করুন।</li>
              <li className="ml-4">• CQ/SQ প্রশ্নে বিস্তারিত উত্তর লিখুন।</li>
              <li className="ml-4">• CQ এবং SQ প্রশ্নের জন্য হাতের লেখা উত্তর ক্যামেরা দিয়ে তুলে আপলোড করতে পারবেন।</li>
              <li className="ml-4">• "ক্যামেরা দিয়ে ছবি তুলুন" বোতামে ক্লিক করে ছবি তুলুন।</li>
              <li className="ml-4 font-semibold text-red-600">• উত্তর সংখ্যা নির্ধারিত সীমা অতিক্রম করলে পরীক্ষা বাতিল হবে এবং শূন্য মার্ক দেওয়া হবে।</li>
              
              {/* Warning Section */}
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-700 mb-2">⚠️ গুরুত্বপূর্ণ সতর্কতা:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  <li>নির্ধারিত প্রশ্নের চেয়ে বেশি প্রশ্নের উত্তর দিলে পরীক্ষা বাতিল হবে।</li>
                  <li>ভুল উত্তরের জন্য নেগেটিভ মার্ক কাটা হবে।</li>
                  <li>পরীক্ষা চলাকালীন নিয়ম ভঙ্গ করলে শূন্য মার্ক দেওয়া হবে।</li>
                  <li>সময় শেষ হওয়ার আগেই উত্তর জমা দিন।</li>
                </ul>
              </div>
              
              <li>প্রয়োজনে প্রশ্ন মার্ক করে রাখতে পারবেন।</li>
              <li>সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হবে।</li>
              <li>পরীক্ষা চলাকালীন ইন্টারনেট সংযোগ বজায় রাখুন।</li>
              <li>পরীক্ষা চলাকালীন কোনো সমস্যা হলে শিক্ষককে অবহিত করুন।</li>
              <li>পরীক্ষা চলাকালীন নিয়ম ভঙ্গ করলে পরীক্ষা বাতিল হতে পারে।</li>
              <li>MCQ প্রশ্নে অপশন একবার নির্বাচন করলে পরিবর্তন করা যাবে না।</li>
            </ul>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="flex justify-center mt-8">
            <Button className="text-2xl px-12 py-4 bg-gradient-to-r from-purple-500 to-blue-400 text-white font-bold rounded-2xl shadow-xl transition-all duration-300" onClick={handleStart}>
              পরীক্ষা শুরু করুন
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-100 overflow-hidden">
      
      {/* 3D Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh castShadow receiveShadow>
              <icosahedronGeometry args={[2.5, 1]} />
              <meshStandardMaterial color="#a78bfa" roughness={0.3} metalness={0.7} transparent opacity={0.25} />
            </mesh>
          </Float>
          <Environment preset="sunset" />
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>
      {/* Foreground UI */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <Card className="rounded-none border-b sticky top-0 z-10 bg-white/80 backdrop-blur shadow-md">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
            <div className="font-bold text-lg drop-shadow-md text-purple-700">{exam?.name || "Exam"}</div>
            <div className="flex items-center">
              {!submitted && <Timer onTimeUp={handleTimeUp} />}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <SaveStatusIndicator />
                <OnlineStatusIndicator />
              </motion.div>
              <AccessibilityToggles />
            </div>
            {/* Submit button - hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || submitted}
                  className="transition-all shadow-lg bg-gradient-to-r from-purple-500 to-blue-400 text-white font-bold px-6 py-2 rounded-lg"
                >
                  {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit"}
                </Button>
              </motion.div>
            </div>
          </CardHeader>
        </Card>
        {/* Alerts */}
        {violationMsg && !submitted && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}>
            <Alert variant="destructive" className="rounded-none">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{violationMsg}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        {error && <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}><Alert variant="destructive" className="rounded-none"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></motion.div>}
        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar: Navigator (desktop only) */}
          {!isMobile && (
            <aside className="w-64 border-r bg-white/60 p-4 overflow-y-auto hidden md:block shadow-lg">
              <Navigator questions={validQuestions} />
            </aside>
          )}
          {/* Main Area: Questions */}
          <main ref={mainAreaRef} className="flex-1 p-2 sm:p-4 overflow-y-auto">
            {submitted && isMCQOnly && result ? (
              <>
                <Confetti
                  width={windowSize.width}
                  height={windowSize.height}
                  numberOfPieces={250}
                  recycle={false}
                  gravity={0.25}
                  initialVelocityY={10}
                  tweenDuration={6000}
                />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-center justify-center text-center p-4 min-h-[60vh]">
                  {/* Animated Score Card */}
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.05, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 10 }} className="relative z-30 bg-gradient-to-br from-purple-400/90 to-blue-400/90 rounded-3xl shadow-2xl px-10 py-8 mb-6 flex flex-col items-center border-4 border-white/40">
                    <CheckCircleIcon className="w-16 h-16 text-green-300 mb-2 animate-bounce" />
                    <div className="text-3xl font-extrabold text-white drop-shadow mb-2">Exam Submitted!</div>
                    <div className="text-lg text-white/90 mb-2">Your Score</div>
                    {/* In the score card, display totalEarned instead of result.total */}
                    <div className="text-5xl font-black text-green-200 drop-shadow-lg animate-pulse">{totalEarned}</div>
                  </motion.div>
                  <div className="w-full max-w-2xl mx-auto space-y-6 mt-4">
                    {/* MCQ Section for Results */}
                    {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">✓</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Multiple Choice Questions (MCQ)</h3>
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length} Questions
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {validQuestions
                            .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq")
                            .map((q: any, idx: number) => {
                              const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                              return (
                                <QuestionCard
                                  key={`results-mcq-${idx}-${q.id || `fallback-${idx}`}`}
                                  disabled
                                  result={result}
                                  submitted
                                  isMCQOnly
                                  questionIdx={originalIndex}
                                  questionOverride={q}
                                />
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* CQ Section for Results */}
                    {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">✏️</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Creative Questions (CQ)</h3>
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                            {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length} Questions
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {validQuestions
                            .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq")
                            .map((q: any, idx: number) => {
                              const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                              return (
                                <QuestionCard
                                  key={`results-cq-${idx}-${q.id || `fallback-${idx}`}`}
                                  disabled
                                  result={result}
                                  submitted
                                  isMCQOnly
                                  questionIdx={originalIndex}
                                  questionOverride={q}
                                />
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* SQ Section for Results */}
                    {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-sm">💬</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Short Questions (SQ)</h3>
                          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                            {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length} Questions
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {validQuestions
                            .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq")
                            .map((q: any, idx: number) => {
                              const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                              return (
                                <QuestionCard
                                  key={`results-sq-${idx}-${q.id || `fallback-${idx}`}`}
                                  disabled
                                  result={result}
                                  submitted
                                  isMCQOnly
                                  questionIdx={originalIndex}
                                  questionOverride={q}
                                />
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            ) : submitted && !isMCQOnly ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-center justify-center text-center p-4">
                <div className="text-2xl text-green-700 font-bold mb-2">Exam Submitted Successfully!</div>
                <div className="text-yellow-600 font-semibold mt-2">
                  Your result will be published after teacher review.
                </div>
              </motion.div>
            ) : !isMobile ? (
              <div className="flex flex-col gap-6 h-full overflow-y-auto">
                <AnimatePresence>
                  {/* MCQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">✓</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Multiple Choice Questions (MCQ)</h2>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`desktop-mcq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-200'
                                  : 'bg-blue-50/50 border-blue-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                  MCQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* CQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">✏️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Creative Questions (CQ)</h2>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`desktop-cq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-green-100/80 border-green-400 ring-2 ring-green-200'
                                  : 'bg-green-50/50 border-green-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-green-200 text-green-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                  CQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* SQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-bold text-sm">💬</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Short Questions (SQ)</h2>
                        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`desktop-sq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-yellow-100/80 border-yellow-400 ring-2 ring-yellow-200'
                                  : 'bg-yellow-50/50 border-yellow-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-yellow-200 text-yellow-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                  SQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-20">
                <AnimatePresence>
                  {/* MCQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">✓</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Multiple Choice Questions (MCQ)</h2>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`mobile-mcq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-200'
                                  : 'bg-blue-50/50 border-blue-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                  MCQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* CQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">✏️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Creative Questions (CQ)</h2>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`mobile-cq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-green-100/80 border-green-400 ring-2 ring-green-200'
                                  : 'bg-green-50/50 border-green-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-green-200 text-green-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                  CQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* SQ Section */}
                  {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-bold text-sm">💬</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Short Questions (SQ)</h2>
                        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                          {validQuestions.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq").length} Questions
                        </span>
                      </div>
                      
                      {validQuestions
                        .filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq")
                        .map((q: any, idx: number) => {
                          const originalIndex = validQuestions.findIndex((originalQ: any) => originalQ.id === q.id);
                          return (
                            <motion.div
                              key={`mobile-sq-${idx}-${q.id || `fallback-${idx}`}`}
                              ref={(el) => { questionRefs.current[q.id || `fallback-${idx}`] = el; }}
                              data-question-id={q.id || `fallback-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`rounded-2xl shadow-2xl p-4 mb-4 border-2 flex flex-col gap-2 ${
                                navigation.current === validQuestions.findIndex((q2: any) => q2.id === q.id)
                                  ? 'bg-yellow-100/80 border-yellow-400 ring-2 ring-yellow-200'
                                  : 'bg-yellow-50/50 border-yellow-200'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                                <span className="inline-block w-8 h-8 rounded-full bg-yellow-200 text-yellow-700 font-bold flex items-center justify-center text-lg shadow mb-2 md:mb-0">
                                  {idx + 1}
                                </span>
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                  SQ
                                </span>
                              </div>
                              <QuestionCard
                                questionIdx={originalIndex}
                                questionOverride={q}
                                isMCQOnly={isMCQOnly}
                                submitted={submitted}
                                result={result}
                                disabled={submitting || submitted}
                                hideScore={true}
                              />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
        {/* Mobile: Sticky Progress Bar and Submit Button */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur shadow-lg p-2">
            <div className="flex flex-col gap-2">
              {/* Submit Button for Mobile */}
              <div className="flex justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || submitted}
                    className="transition-all shadow-lg bg-gradient-to-r from-purple-500 to-blue-400 text-white font-bold px-8 py-3 rounded-lg w-full max-w-xs"
                  >
                    {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Exam"}
                  </Button>
                </motion.div>
              </div>
              {/* Navigator */}
              <div className="flex items-center justify-center">
                <Navigator questions={validQuestions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback useMediaQuery if not present
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
} 