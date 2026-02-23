"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Sparkles, Coffee, Brain, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./GlassCard";
import { playSound } from "@/lib/sounds";

interface FocusModeProps {
    onClose: () => void;
}

const DURATIONS = [
    { id: "focus", label: "Focus", minutes: 25, icon: Sparkles },
    { id: "short", label: "Short Break", minutes: 5, icon: Coffee },
    { id: "long", label: "Long Break", minutes: 15, icon: Brain },
];

export function FocusMode({ onClose }: FocusModeProps) {
    const [activeTab, setActiveTab] = useState(DURATIONS[0]);
    const [timeLeft, setTimeLeft] = useState(activeTab.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [showAmbient, setShowAmbient] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            playSound("success");
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        playSound("click");
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        playSound("click");
        setIsActive(false);
        setTimeLeft(activeTab.minutes * 60);
    };

    const changeTab = (tab: typeof DURATIONS[0]) => {
        playSound("transition");
        setActiveTab(tab);
        setIsActive(false);
        setTimeLeft(tab.minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = 1 - timeLeft / (activeTab.minutes * 60);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        >
            {/* Background with Blur */}
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-3xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl"
            >
                <GlassCard className="p-8 md:p-12 border-white/20 shadow-2xl overflow-visible">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute -top-4 -right-4 bg-background/80 backdrop-blur px-2 py-2 rounded-full border border-border shadow-md hover:bg-muted"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <div className="flex flex-col items-center gap-12 text-center">
                        {/* Mode Switcher */}
                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border border-white/10">
                            {DURATIONS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => changeTab(tab)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab.id === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Timer Display */}
                        <div className="relative py-8">
                            {/* Progress Ring (Simulated with text shadow etc) */}
                            <motion.div
                                className="text-8xl md:text-[10rem] font-black tracking-tighter tabular-nums text-foreground drop-shadow-2xl flex items-center justify-center relative"
                                animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                {formatTime(timeLeft)}

                                {/* Micro-sparkles when active */}
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -inset-8 pointer-events-none"
                                    >
                                        <Sparkles className="absolute top-0 right-0 w-8 h-8 text-primary animate-pulse" />
                                        <Sparkles className="absolute bottom-4 left-0 w-6 h-6 text-primary/60 animate-bounce" />
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={resetTimer}
                                className="w-14 h-14 rounded-full border-white/10 hover:bg-white/5 transition-all"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </Button>

                            <Button
                                onClick={toggleTimer}
                                className={`w-24 h-24 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isActive
                                        ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
                                        : "bg-primary hover:bg-primary/90 shadow-primary/30"
                                    }`}
                            >
                                {isActive ? (
                                    <Pause className="w-10 h-10 fill-current" />
                                ) : (
                                    <Play className="w-10 h-10 ml-1.5 fill-current" />
                                )}
                            </Button>

                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                    playSound("click");
                                    setShowAmbient(!showAmbient);
                                }}
                                className={`w-14 h-14 rounded-full border-white/10 transition-all ${showAmbient ? "bg-primary/10 text-primary border-primary/30" : "hover:bg-white/5"
                                    }`}
                            >
                                <Volume2 className="w-6 h-6" />
                            </Button>
                        </div>

                        <p className="text-muted-foreground font-medium max-w-sm">
                            {isActive
                                ? "May your concentration be as deep as the ocean."
                                : "Ready to reach a new level of productivity?"}
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
