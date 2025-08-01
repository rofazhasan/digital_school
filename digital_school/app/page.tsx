"use client";

import React from "react";
import { useTheme } from "next-themes";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    ArrowRight,
    Sun,
    Moon,
    ChevronDown,
    Bot,
    ScanLine,
    Palette,
    Code,
    PenTool,
    UploadCloud,
    BarChart,
    Star,
    Linkedin,
    Facebook,
    Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import HeroCanvas from "@/components/ui/hero-canvas";
import { cn } from "@/lib/utils";

// --- Animation Variants ---
const containerVariants = (stagger = 0.1) => ({
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { staggerChildren: stagger },
    },
    whileInView: {
        opacity: 1,
        transition: { staggerChildren: stagger },
    },
    viewport: { once: true, amount: 0.2 },
});

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const },
    },
    whileInView: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const },
    },
};

// --- Main Page Component ---
export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <main className="flex-grow">
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <AboutSection />
                <CtaSection />
                <DeveloperTrademarkSection />
            </main>
            <Footer />
        </div>
    );
}

// --- Theme Toggle ---
const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};

// --- Hero Section ---
const HeroSection = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({
                                 clientX,
                                 clientY,
                                 currentTarget,
                             }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    return (
        <header className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden">
            <HeroCanvas />
            <motion.div
                onMouseMove={handleMouseMove}
                className="group relative z-10 flex flex-col items-center glass-card rounded-3xl p-8 md:p-12 border border-border/20"
                variants={containerVariants(0.15)}
                initial="initial"
                animate="animate"
            >
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.1), transparent 80%)`,
                    }}
                />
                <motion.h1
                    className="shimmer-text text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter"
                    variants={itemVariants}
                >
                    Elite Exam System
                </motion.h1>
                <motion.p
                    className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground"
                    variants={itemVariants}
                >
                    Empowering the Future of Assessment in Bangladesh.
                </motion.p>
                <motion.div
                    className="mt-8 flex flex-col sm:flex-row gap-4"
                    variants={itemVariants}
                >
                    <Button size="lg" className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                        <a href="/login">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <a href="#features">Learn More</a>
                    </Button>
                </motion.div>
            </motion.div>

            <motion.div
                className="absolute bottom-10 z-10"
                initial={{ opacity: 0, y: 0 }}
                animate={{
                    opacity: 1,
                    y: 10,
                    transition: {
                        delay: 1,
                        repeat: Infinity,
                        repeatType: "mirror",
                        duration: 1.5,
                    },
                }}
            >
                <ChevronDown className="h-8 w-8 text-muted-foreground/50" />
            </motion.div>
        </header>
    );
};

// --- Features Section ---
const features = [
    {
        title: "AI-Powered Question Generation",
        description:
            "Instantly create diverse and challenging question sets tailored to any subject or difficulty.",
        icon: Bot,
        className: "md:col-span-2",
    },
    {
        title: "High-Precision OMR Scanning",
        description:
            "Digitize thousands of answer sheets with unparalleled accuracy using just your phone.",
        icon: ScanLine,
    },
    {
        title: "Professional Print Layouts",
        description:
            "Generate beautiful, print-ready question papers and reports with your institution's branding.",
        icon: Palette,
    },
    {
        title: "Unified Question Repository",
        description:
            "Build, manage, and reuse a rich repository of MCQ, CQ, and fill-in-the-blank questions.",
        icon: Code,
        className: "md:col-span-2",
    },
];

const FeaturesSection = () => (
    <section id="features" className="py-24 sm:py-32 px-4 bg-background/50">
        <div className="max-w-7xl mx-auto">
            <motion.div
                className="text-center"
                variants={containerVariants()}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2
                    className="text-base font-semibold text-primary"
                    variants={itemVariants}
                >
                    Features
                </motion.h2>
                <motion.p
                    className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                    variants={itemVariants}
                >
                    The Ultimate Assessment Toolkit
                </motion.p>
                <motion.p
                    className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground"
                    variants={itemVariants}
                >
                    Everything you need, beautifully integrated into one powerful
                    platform designed for modern education.
                </motion.p>
            </motion.div>

            <motion.div
                className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
                variants={containerVariants(0.2)}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.2 }}
            >
                {features.map((feature, i) => (
                    <FeatureCard key={i} {...feature} />
                ))}
            </motion.div>
        </div>
    </section>
);

const FeatureCard = ({
                         icon: Icon,
                         title,
                         description,
                         className,
                     }: {
    icon: React.ComponentType<{ size?: number }>;
    title: string;
    description: string;
    className?: string;
}) => (
    <motion.div
        variants={itemVariants}
        className={cn(
            "group relative rounded-2xl border border-border/50 bg-card/40 p-8 h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:scale-[1.02]",
            className
        )}
    >
        <div className="relative z-10 flex flex-col h-full">
            <div className="p-4 mb-4 inline-block bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
            <p className="text-muted-foreground text-lg flex-grow">{description}</p>
        </div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
    </motion.div>
);

// --- How It Works Section ---
const processSteps = [
    {
        number: "01",
        icon: PenTool,
        title: "Create & Customize",
        description: "Use our powerful question bank or let our AI generate questions in minutes.",
    },
    {
        number: "02",
        icon: UploadCloud,
        title: "Conduct & Scan",
        description: "Administer exams online or offline. Scan OMR sheets with your phone for results.",
    },
    {
        number: "03",
        icon: BarChart,
        title: "Analyze & Improve",
        description: "Get deep insights into performance with beautiful, automated reports and analytics.",
    },
];

const HowItWorksSection = () => (
    <section className="py-24 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-base font-semibold text-primary">How It Works</h2>
            <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                A Simple, Powerful Process
            </p>
        </div>
        <div className="mt-20 max-w-7xl mx-auto">
            <div className="relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
                    <svg width="100%" height="100%">
                        <line
                            x1="0"
                            y1="0"
                            x2="100%"
                            y2="0"
                            strokeWidth="2"
                            strokeDasharray="8 8"
                            className="stroke-border"
                        />
                    </svg>
                </div>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-y-20 md:gap-x-8"
                    variants={containerVariants(0.3)}
                    initial="initial"
                    whileInView="whileInView"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {processSteps.map((step) => (
                        <motion.div
                            key={step.number}
                            className="relative flex flex-col items-center text-center"
                            variants={itemVariants}
                        >
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-secondary border-2 border-primary/20">
                                <step.icon size={32} className="text-primary" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-foreground">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-muted-foreground">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    </section>
);

// --- Testimonials Section ---
const testimonials = [
    {
        name: "Principal, Maple Leaf Int. School",
        quote: "The most intuitive and powerful exam system we've ever used. It has transformed our assessment process.",
    },
    {
        name: "Academic Head, Scholastica",
        quote: "AI question generation is a game-changer. It saved our teachers hundreds of hours.",
    },
    {
        name: "Director, Notre Dame College",
        quote: "OMR scanning accuracy is top-notch, and automated analytics give valuable insights.",
    },
    {
        name: "IT Admin, Viqarunnisa Noon School",
        quote: "A secure, scalable platform. Their support team is incredibly responsive.",
    },
    {
        name: "Founder, UCC Coaching",
        quote: "Professional print layouts and detailed reports improved our branding significantly.",
    },
];

const TestimonialsSection = () => (
    <section className="py-24 bg-secondary/30 overflow-hidden">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Leading Institutions</h2>
        <div className="relative w-full">
            <div className="flex animate-marquee-slow">
                {[...testimonials, ...testimonials].map((t, i) => (
                    <Card key={i} className="flex-shrink-0 w-96 mx-4 p-8 glass-card rounded-xl">
                        <div className="flex items-center mb-4 text-yellow-400">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <Star key={j} className="w-5 h-5 fill-current" />
                            ))}
                        </div>
                        <p className="text-lg italic text-foreground/90">&quot;{t.quote}&quot;</p>
                        <p className="mt-6 font-semibold text-right text-muted-foreground">— {t.name}</p>
                    </Card>
                ))}
            </div>
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-secondary/30 to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-secondary/30 to-transparent pointer-events-none"></div>
        </div>
    </section>
);

// --- About Section ---
const AboutSection = () => (
    <section className="py-24 sm:py-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants} initial="initial" whileInView="whileInView" viewport={{ once: true, amount: 0.2 }}>
                <h2 className="text-base font-semibold text-primary">About Us</h2>
                <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                    Built for Bangladesh, by Bangladeshis
                </p>
                <p className="mt-6 text-lg text-muted-foreground">
                    Our platform is engineered for the modern educational institutions of Bangladesh.
                    We offer a robust, all-in-one solution to streamline the entire exam process.
                    Full <span className="font-semibold text-green-600 dark:text-green-400">Bangla support</span>,
                    tailored to the local curriculum — empowering educators to create fair, efficient, and insightful assessments.
                </p>
            </motion.div>
            <motion.div className="relative h-96" variants={itemVariants} initial="initial" whileInView="whileInView" viewport={{ once: true, amount: 0.2 }}>
                <TechStackVisual />
            </motion.div>
        </div>
    </section>
);

const TechStackVisual = () => (
    <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
            {["Next.js", "AI", "OMR", "React", "Tailwind", "ShadCN"].map((tech, i) => (
                <motion.div
                    key={tech}
                    className="absolute flex items-center justify-center p-4 rounded-full bg-card/80 border border-border shadow-lg"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: `calc(50% + ${Math.cos(i * Math.PI / 3) * 140}px - 40px)`,
                        y: `calc(50% + ${Math.sin(i * Math.PI / 3) * 140}px - 30px)`,
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 10, delay: i * 0.1 }}
                >
                    <span className="font-semibold text-sm text-foreground">{tech}</span>
                </motion.div>
            ))}
        </div>
    </div>
);

// --- CTA Section ---
const CtaSection = () => (
    <section className="py-24 sm:py-32 px-4">
        <div className="relative max-w-4xl mx-auto">
            <div className="relative z-10 glass-card rounded-2xl p-8 md:p-16 text-center overflow-hidden">
                <div className="absolute inset-0 aurora-bg opacity-30 z-0" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                        Ready to Revolutionize Your Exams?
                    </h2>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Join the schools across Bangladesh that trust Elite to deliver fair, fast, and future-ready assessments.
                    </p>
                    <div className="mt-10">
                        <Button size="lg" className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                            <a href="/login">Request a Demo</a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// --- Developer Trademark Section ---
const DeveloperTrademarkSection = () => (
    <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
            <Card className="glass-card p-6 md:p-8 text-center">
                <h3 className="font-semibold text-lg">Developed with ❤️ by Md. Rofaz Hasan Rafiu</h3>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="https://linkedin.com/in/rafiu-dev" target="_blank" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin /></a>
                    <a href="https://facebook.com/rafiu.dev" target="_blank" className="text-muted-foreground hover:text-primary transition-colors"><Facebook /></a>
                    <a href="mailto:contact.rafiu.dev@gmail.com" className="text-muted-foreground hover:text-primary transition-colors"><Mail /></a>
                </div>
                <div className="mt-6 border-t border-border/50 pt-6">
                    <p className="text-sm text-muted-foreground">In official partnership with</p>
                    <p className="font-bold text-xl">Elite School & College, Rangpur</p>
                    <a href="mailto:contact.eliteschool@example.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">contact.eliteschool@example.com</a>
                </div>
            </Card>
        </div>
    </section>
);

// --- Footer ---
const Footer = () => (
    <footer className="bg-card/30 text-foreground py-12 px-4 border-t border-border/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="md:col-span-1 flex flex-col items-center md:items-start">
                <h4 className="font-bold text-lg mb-2">Elite Exam System</h4>
                <p className="text-muted-foreground text-sm max-w-xs">The future of assessment technology for Bangladesh.</p>
            </div>
            <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-muted-foreground">
                    <li><a href="/login" className="hover:text-primary transition-colors">Login</a></li>
                    <li><a href="/signup" className="hover:text-primary transition-colors">Create Account</a></li>
                    <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                    <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-4">Contact</h4>
                <ul className="space-y-2 text-muted-foreground">
                    <li><a href="mailto:contact.eliteschool@example.com" className="hover:text-primary transition-colors">School Inquiries</a></li>
                    <li><a href="mailto:support.elite@example.com" className="hover:text-primary transition-colors">Technical Support</a></li>
                    <li><a href="mailto:contact.rafiu.dev@gmail.com" className="hover:text-primary transition-colors">Developer Contact</a></li>
                </ul>
            </div>
            <div className="flex flex-col items-center md:items-start">
                <h4 className="font-bold mb-4">Theme</h4>
                <ThemeToggle />
            </div>
        </div>
        <div className="text-center text-muted-foreground/50 mt-12 pt-8 border-t border-border/20">
            <p>&copy; {new Date().getFullYear()} Elite Exam System. All Rights Reserved. A concern of Elite School & College.</p>
        </div>
    </footer>
);