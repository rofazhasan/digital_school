"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Insight {
    text: string;
    type: 'good' | 'bad' | 'neutral';
    icon: string;
}

interface AIAnalysisCardProps {
    insights: Insight[];
}

export function AIAnalysisCard({ insights }: AIAnalysisCardProps) {
    return (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-xl border border-white/10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-full -mr-4 -mt-4 blur-2xl group-hover:scale-110 transition-transform duration-700" />

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    AI Learning Insights
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
                {insights && insights.length > 0 ? (
                    insights.map((insight, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${insight.type === 'good'
                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                    : insight.type === 'bad'
                                        ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                                        : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'
                                }`}
                        >
                            <div className={`p-2 rounded-xl text-xl ${insight.type === 'good' ? 'bg-emerald-500/10' :
                                    insight.type === 'bad' ? 'bg-rose-500/10' : 'bg-indigo-500/10'
                                }`}>
                                {insight.icon}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium leading-relaxed ${insight.type === 'good' ? 'text-emerald-800 dark:text-emerald-300' :
                                        insight.type === 'bad' ? 'text-rose-800 dark:text-rose-300' : 'text-indigo-800 dark:text-indigo-300'
                                    }`}>
                                    {insight.text}
                                </p>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-8 text-center text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Complete more exams to see personalized AI insights.</p>
                    </div>
                )}

                <div className="pt-2">
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
                        View Detailed Analysis <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
