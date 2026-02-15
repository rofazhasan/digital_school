"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    useEffect(() => {
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
    if (pathname?.startsWith('/teacher') || pathname?.startsWith('/admin') || pathname?.startsWith('/student') || pathname?.startsWith('/exams/online')) {
        return null;
    }

    const name = settings?.instituteName || "Digital School";
    const address = settings?.address || "123 Education Street, Dhaka, Bangladesh";
    const phone = settings?.phone || "+880 1234-567890";
    const email = settings?.email || "info@digitalschool.edu";
    const logo = settings?.logoUrl || "/logo.png";

    return (
        <footer className="relative border-t bg-white/80 dark:bg-gray-950/80 backdrop-blur-md mt-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50 pointer-events-none" />

            <div className="container relative mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            {/* Use a fallback div if logo fails or for visual placeholder */}
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                DS
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                {name}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Empowering the next generation of learners with cutting-edge technology and comprehensive digital solutions.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                                <Facebook className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-900/20 dark:hover:text-sky-400">
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20 dark:hover:text-pink-400">
                                <Instagram className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                                <Linkedin className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Link Section 1 */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Platform</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">About Us</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Features</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Careers</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">News & Press</a></li>
                        </ul>
                    </div>

                    {/* Quick Link Section 2 */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Resources</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Support Center</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Documentation</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Privacy Policy</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Terms of Service</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Contact</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span>{address}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="h-4 w-4 text-primary shrink-0" />
                                <span>{phone}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                <span>{email}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} {name}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
