"use client";

import { motion } from "framer-motion";
import {
    ChevronDown,
    LogOut,
    Menu,
    Settings,
    Sparkles,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SidebarItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
}

interface DashboardSidebarProps {
    items: SidebarItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    user: any;
    instituteName: string;
    onLogout: () => void;
    className?: string;
}

export function DashboardSidebar({
    items,
    activeTab,
    onTabChange,
    sidebarCollapsed,
    setSidebarCollapsed,
    user,
    instituteName,
    onLogout,
    className
}: DashboardSidebarProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={false}
            animate={{ width: sidebarCollapsed ? 80 : 280 }}
            className={`fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border shadow-2xl shadow-black/5 dark:shadow-none transition-all duration-300 ${className}`}
        >
            <div className={`h-20 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-sidebar-border`}>
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
                            DS
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 whitespace-nowrap">
                            {instituteName}
                        </span>
                    </div>
                )}
                {sidebarCollapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                        DS
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full ${sidebarCollapsed ? 'mt-4 rotate-180' : ''}`}
                >
                    {sidebarCollapsed ? <ChevronDown className="h-5 w-5 rotate-90" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-1 px-3 custom-scrollbar">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (item.href.startsWith('/') && item.href !== '#') {
                                router.push(item.href);
                            } else {
                                onTabChange(item.id);
                            }
                        }}
                        className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${activeTab === item.id
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <div className={`p-1 rounded-lg transition-all duration-300 flex-shrink-0 ${activeTab === item.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        {!sidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 font-medium text-sm flex-1 text-left truncate"
                            >
                                {item.label}
                            </motion.span>
                        )}
                        {!sidebarCollapsed && item.badge && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                {item.badge}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
                {!sidebarCollapsed ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onTabChange('settings')}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-background shadow-sm">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-background shadow-sm" title={user?.name}>
                            {user?.name?.[0]}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

interface MobileSidebarProps {
    items: SidebarItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    user: any;
    onLogout: () => void;
}

export function MobileDashboardSidebar({
    items,
    activeTab,
    onTabChange,
    isOpen,
    setIsOpen,
    user,
    onLogout
}: MobileSidebarProps) {
    const router = useRouter();

    return (
        <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}>
            <div className={`absolute inset-y-0 left-0 w-72 bg-background/95 backdrop-blur-xl shadow-2xl transition-transform transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-border bg-gradient-to-r from-muted/50 to-background/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            DS
                        </div>
                        <span className="font-bold text-xl text-foreground">Menu</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="overflow-y-auto py-6 space-y-1 h-[calc(100vh-80px)] px-3 custom-scrollbar">
                    {items.map((item) => (
                        <div key={item.id}>
                            <div
                                onClick={() => {
                                    if (item.href.startsWith('/') && item.href !== '#') {
                                        router.push(item.href);
                                    } else {
                                        onTabChange(item.id);
                                        setIsOpen(false);
                                    }
                                }}
                                className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                      ${activeTab === item.id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/50'}
                    `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </div>
                        </div>
                    ))}
                    <div className="px-3 mt-8 pt-8 border-t border-border">
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 py-6 text-base rounded-xl" onClick={onLogout}>
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
