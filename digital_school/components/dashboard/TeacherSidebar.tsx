"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    Plus,
    BookOpen,
    Brain,
    FileCheck,
    Scan,
    CheckSquare,
    TrendingUp,
    Bell,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    className?: string;
    onNavigate?: () => void; // Optional callback to close sheet on mobile
}

export function TeacherSidebar({ activeTab, setActiveTab, className, onNavigate }: TeacherSidebarProps) {
    const router = useRouter();

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (onNavigate) onNavigate();
    };

    const handleRoute = (path: string) => {
        router.push(path);
        if (onNavigate) onNavigate();
    };

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Dashboard
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('dashboard')}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Overview
                        </Button>
                        <Button
                            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('analytics')}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Analytics
                        </Button>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Management
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={activeTab === 'create-questions' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleRoute('/create-question')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Questions
                        </Button>
                        <Button
                            variant={activeTab === 'question-bank' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleRoute('/question-bank')}
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Question Bank
                        </Button>
                        <Button
                            variant={activeTab === 'ai-generator' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleRoute('/teacher/ai-generator')}
                        >
                            <Brain className="mr-2 h-4 w-4" />
                            AI Generator
                        </Button>
                        <Button
                            variant={activeTab === 'create-exams' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('create-exams')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Exams
                        </Button>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Evaluation
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={activeTab === 'evaluate-cq' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('evaluate-cq')}
                        >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Evaluate CQ
                        </Button>
                        <Button
                            variant={activeTab === 'scan-sheets' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('scan-sheets')}
                        >
                            <Scan className="mr-2 h-4 w-4" />
                            Scan OMR & CQ
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleRoute('/exams/results')}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Exam Results
                        </Button>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Classroom
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={activeTab === 'attendance' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('attendance')}
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Attendance
                        </Button>
                        <Button
                            variant={activeTab === 'notices' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleTabChange('notices')}
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            Notices
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
