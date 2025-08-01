"use client";

import React, { useEffect, useState } from "react";
import { useExamContext } from "./ExamContext";
import { motion, useAnimation } from 'framer-motion';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
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

export default function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { exam } = useExamContext();
  const [secondsLeft, setSecondsLeft] = useState(exam.duration * 60);
  const [warned, setWarned] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const controls = useAnimation();

  useEffect(() => {
    setSecondsLeft(exam.duration * 60);
  }, [exam.duration]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
      controls.start({ scale: [1, 1.1, 1], boxShadow: [
        '0 0 0px #a78bfa',
        '0 0 24px #a78bfa',
        '0 0 0px #a78bfa'
      ] });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onTimeUp, controls]);

  useEffect(() => {
    if (!warned && secondsLeft === 300) {
      alert("Only 5 minutes left!");
      setWarned(true);
    }
  }, [secondsLeft, warned]);

  const timerColor = secondsLeft <= 300 ? "text-red-500" : "text-purple-700";
  const glassBg = "bg-gradient-to-br from-white/60 to-purple-100/60 backdrop-blur-md";
  const borderGlow = secondsLeft <= 300
    ? "border-4 border-red-400 shadow-[0_0_32px_4px_rgba(239,68,68,0.3)]"
    : "border-4 border-purple-300 shadow-[0_0_32px_4px_rgba(168,139,250,0.3)]";

  return (
    <motion.div
      animate={controls}
      className={`relative flex items-center justify-center ${glassBg} ${borderGlow} rounded-3xl select-none ${isMobile ? 'w-full sticky top-0 z-30 py-2 my-2' : 'mx-4 my-0 py-4 px-8'} transition-all duration-300`}
      style={{ minWidth: isMobile ? 0 : 180 }}
    >
      <span className={`font-extrabold ${timerColor} ${isMobile ? 'text-3xl' : 'text-5xl'} tracking-widest drop-shadow-lg`}>
        {formatTime(secondsLeft)}
      </span>
    </motion.div>
  );
} 