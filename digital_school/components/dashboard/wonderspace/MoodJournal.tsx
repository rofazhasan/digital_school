"use client";

import { useState } from "react";
import { Smile, Frown, Meh, SmilePlus, Angry, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "./GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "@/lib/sounds";

const MOODS = [
    { id: "great", icon: SmilePlus, label: "Great", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "good", icon: Smile, label: "Good", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "okay", icon: Meh, label: "Okay", color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "bad", icon: Frown, label: "Bad", color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "angry", icon: Angry, label: "Angry", color: "text-rose-500", bg: "bg-rose-500/10" },
];

export function MoodJournal() {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selectedMood) {
            playSound("success");
            setIsSubmitted(true);
            // Simulate API call
            setTimeout(() => {
                // Reset after some time or keep state
            }, 3000);
        }
    };

    const handleSelectMood = (id: string) => {
        playSound("click");
        setSelectedMood(id);
    };

    return (
        <GlassCard className="h-full">
            <div className="flex flex-col gap-6">
                <h3 className="text-lg font-bold">How are you feeling?</h3>

                <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                        <motion.div
                            key="mood-selection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-5 gap-2">
                                {MOODS.map((mood) => {
                                    const Icon = mood.icon;
                                    const isActive = selectedMood === mood.id;
                                    return (
                                        <button
                                            key={mood.id}
                                            onClick={() => handleSelectMood(mood.id)}
                                            className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 ${isActive
                                                    ? `${mood.bg} ${mood.color} ring-1 ring-current`
                                                    : "hover:bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            <Icon className={`w-8 h-8 ${isActive ? "scale-110" : "scale-100"}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{mood.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedMood && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <Textarea
                                        placeholder="Briefly, what's on your mind?"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="bg-muted/30 border-transparent focus:bg-card focus:border-primary/20 rounded-2xl min-h-[80px] resize-none"
                                    />
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg shadow-primary/20 group"
                                    >
                                        Save Entry
                                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-8 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                <SmilePlus className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-lg font-bold mb-1">Entry Saved!</h4>
                            <p className="text-xs text-muted-foreground">Log your progress every day.</p>
                            <Button
                                variant="ghost"
                                onClick={() => setIsSubmitted(false)}
                                className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                            >
                                New Entry
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    );
}
