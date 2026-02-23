"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, Award, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformancePredictorProps {
    projection: {
        nextPredictedScore: number;
        growthRate: string;
        confidence: string;
    } | null;
}

export function PerformancePredictor({ projection }: PerformancePredictorProps) {
    if (!projection) return null;

    const scoreColor = projection.nextPredictedScore >= 80 ? 'text-emerald-500' :
        projection.nextPredictedScore >= 60 ? 'text-amber-500' : 'text-rose-500';

    return (
        <Card className="border-0 shadow-2xl bg-card border border-border overflow-hidden relative group">
            {/* Decorative background circle */}
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Target className="w-5 h-5 text-rose-500" />
                    Score Predictor
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10">
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                initial={{ strokeDashoffset: 364.4 }}
                                animate={{ strokeDashoffset: 364.4 - (364.4 * projection.nextPredictedScore) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={scoreColor}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black tracking-tighter">{projection.nextPredictedScore}%</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Projected</span>
                        </div>
                    </div>

                    <div className="mt-6 w-full space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">Growth Rate</span>
                            </div>
                            <span className={`text-sm font-bold ${Number(projection.growthRate) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {Number(projection.growthRate) > 0 ? '+' : ''}{projection.growthRate}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Award className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">Confidence</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className={`w-1 h-3 rounded-full ${(projection.confidence === 'High' && i <= 3) ||
                                                (projection.confidence === 'Medium' && i <= 2) ||
                                                (projection.confidence === 'Low' && i <= 1)
                                                ? 'bg-blue-500' : 'bg-muted-foreground/20'
                                            }`} />
                                    ))}
                                </div>
                                <span className="text-xs font-bold">{projection.confidence}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2 text-center">
                    <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        AI-generated based on recent performance trends
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
