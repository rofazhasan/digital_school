"use client";

import { motion } from "framer-motion";
import {
    ChevronDown,
    LogOut,
    Menu,
    Settings,
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
    user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
    onLogout: _onLogout, // eslint-disable-line @typescript-eslint/no-unused-vars
    className
}: DashboardSidebarProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={false}
            animate={{
                width: sidebarCollapsed ? 80 : 300,
                x: 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col bg-background/60 backdrop-blur-2xl border-r border-border/50 shadow-[0_0_40px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300 ${className}`}
        >
            <div className={`h-24 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-8'} border-b border-border/40`}>
                {!sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 overflow-hidden"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-primary/80 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/25 border border-white/10 flex-shrink-0">
                            DS
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 whitespace-nowrap leading-tight">
                                {instituteName}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 leading-tight">
                                Administration
                            </span>
                        </div>
                    </motion.div>
                )}
                {sidebarCollapsed && (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-primary/80 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/25 border border-white/10 group cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => setSidebarCollapsed(false)}>
                        DS
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`hidden lg:flex text-muted-foreground/50 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300 ${sidebarCollapsed ? 'mt-4 rotate-180 opacity-0 group-hover:opacity-100' : ''}`}
                >
                    {sidebarCollapsed ? <ChevronDown className="h-5 w-5 rotate-90" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-8 space-y-1.5 px-4 custom-scrollbar">
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
                        className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border border-white/10'
                            : 'text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground border border-transparent'
                            }`}
                    >
                        <div className={`transition-all duration-300 flex-shrink-0 ${activeTab === item.id ? 'text-primary-foreground scale-110' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'}`}>
                            <item.icon className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                        {!sidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`ml-4 text-sm font-semibold flex-1 text-left truncate tracking-tight`}
                            >
                                {item.label}
                            </motion.span>
                        )}
                        {!sidebarCollapsed && item.badge && (
                            <Badge variant="secondary" className={`bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 border-0 rounded-lg px-2 py-0.5 text-[10px] font-bold`}>
                                {item.badge}
                            </Badge>
                        )}

                        {activeTab === item.id && (
                            <motion.div
                                layoutId="activeHighlight"
                                className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="p-6 border-t border-border/40 bg-muted/20 backdrop-blur-sm">
                {!sidebarCollapsed ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-background/40 border border-border/40 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                        onClick={() => onTabChange('settings')}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-muted to-muted/50 flex items-center justify-center text-primary font-black border-2 border-background shadow-md overflow-hidden transition-transform group-hover:scale-105">
                                {user?.name?.[0] || 'U'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 truncate uppercase tracking-wider">Super Admin</p>
                        </div>
                        <Settings className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-500" />
                    </motion.div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-background/40 border border-border/40 flex items-center justify-center text-primary font-black border-2 border-background shadow-md group cursor-pointer hover:border-primary/30 transition-all" title={user?.name}>
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
    user?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    onLogout: () => void;
}

export function MobileDashboardSidebar({
    items,
    activeTab,
    onTabChange,
    isOpen,
    setIsOpen,
    onLogout
}: MobileSidebarProps) {
    const router = useRouter();

    return (
        <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}>
            <div className={`absolute inset-y-0 left-0 w-72 bg-background/95 backdrop-blur-xl shadow-2xl transition-transform transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-border bg-muted/30">
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
