"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    whileHover?: any;
}

export function GlassCard({ children, className, onClick, whileHover = { y: -5 } }: GlassCardProps) {
    return (
        <motion.div
            whileHover={onClick || whileHover ? whileHover : {}}
            onClick={onClick}
            className={cn(
                "bg-card/40 border border-border/50 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden relative group transition-all duration-300",
                onClick && "cursor-pointer active:scale-95",
                className
            )}
        >
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
}
