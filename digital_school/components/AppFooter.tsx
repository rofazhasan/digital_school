"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
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

    const name = settings?.instituteName || "Digital School";
    const address = settings?.address || "123 Education Street, Dhaka, Bangladesh";
    const phone = settings?.phone || "+880 1234-567890";
    const email = settings?.email || "info@digitalschool.edu";
    const logo = settings?.logoUrl || "/logo.png";

    return (
        <footer className="border-t bg-muted/50 mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <img src={logo} alt={name} className="h-8 w-auto object-contain" />
                            <span className="font-semibold text-lg">{name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Empowering education through technology. Providing comprehensive digital solutions for modern learning.
                        </p>
                        <div className="flex space-x-4">
                            <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                                <MapPin className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <div className="space-y-2 text-sm">
                            <a href="#" className="block text-muted-foreground hover:text-foreground">About Us</a>
                            <a href="#" className="block text-muted-foreground hover:text-foreground">Contact</a>
                            <a href="#" className="block text-muted-foreground hover:text-foreground">Privacy Policy</a>
                            <a href="#" className="block text-muted-foreground hover:text-foreground">Terms of Service</a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Contact Info</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="whitespace-pre-wrap">{address}</p>
                            <p>Phone: {phone}</p>
                            <p>Email: {email}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-8 pt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
