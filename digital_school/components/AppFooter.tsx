"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Globe, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

interface InstituteSettings {
    instituteName?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    signatureUrl?: string;
    colorTheme?: any;
}

export function AppFooter() {
    const pathname = usePathname();
    const [settings, setSettings] = useState<InstituteSettings | null>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setSettings(data);
                }
            })
            .catch(console.error);
    }, []);

    // Hide Footer on Dashboard routes to prevent "Double Footer" issue
    // Also hide on online exam page for immersive experience
    const hideOnRoutes = ['/teacher', '/admin', '/student', '/exams/online'];
    if (hideOnRoutes.some(route => pathname?.startsWith(route))) {
        return null;
    }

    const name = settings?.instituteName || "Elite Exam System";
    const address = settings?.address || "123 Education Street, Dhaka, Bangladesh";
    const phone = settings?.phone || "+880 1234-567890";
    const email = settings?.email || "info@digitalschool.edu";
    const logo = settings?.logoUrl || "/logo.png";

    return (
        <footer className="relative border-t bg-white/80 dark:bg-gray-950/80 backdrop-blur-md mt-auto overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container relative mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                                {logo ? (
                                    <img src={logo} alt="L" className="h-6 w-6 object-contain dark:invert dark:grayscale dark:brightness-200 transition-all" />
                                ) : "DS"}
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {name}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            The future of assessment technology for Bangladesh. Empowering educators with high-precision OMR and AI-powered solutions.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                <Facebook className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                <Instagram className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                <Linkedin className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Link Section 1 */}
                    <div>
                        <h3 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">Platform</h3>
                        <ul className="space-y-4 text-sm">
                            <li><a href="/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Login</a></li>
                            <li><a href="/signup" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Create Account</a></li>
                            <li><a href="/#features" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Features</a></li>
                            <li><a href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Pricing</a></li>
                        </ul>
                    </div>

                    {/* Quick Link Section 2 */}
                    <div>
                        <h3 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">Support</h3>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Help Center</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Documentation</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Terms of Service</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-125 transition-all" /> Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">Contact Us</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <span className="leading-relaxed">{address}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <span>{phone}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <span>{email}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 dark:border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <p className="text-xs text-muted-foreground font-medium">
                            © {new Date().getFullYear()} {name}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">System Operational</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 text-[10px] text-muted-foreground uppercase font-bold tracking-widest mr-4">
                            <a href="#" className="hover:text-primary transition-colors">Status</a>
                            <a href="#" className="hover:text-primary transition-colors">API</a>
                            <a href="#" className="hover:text-primary transition-colors">Security</a>
                        </div>
                        <DarkModeToggle />
                    </div>
                </div>
            </div>
        </footer>
    );
}
