"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Phone, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    pendingEmail?: string;
    pendingPhone?: string;
}

export function ProfileSettings({ user }: { user: UserProfile }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Password Form State
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    // Email Form State
    const [email, setEmail] = useState(user.email);
    const [emailPassword, setEmailPassword] = useState('');

    // Phone Form State
    const [phone, setPhone] = useState(user.phone || '');
    const [phonePassword, setPhonePassword] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setLoading('password');
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'password', ...passwords }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Password updated successfully");
                setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(data.error || "Failed to update password");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user.email) return;

        setLoading('email');
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', newEmail: email, password: emailPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Verification email sent to your new address");
                setEmailPassword('');
            } else {
                toast.error(data.error || "Failed to initiate email change");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handleUpdatePhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone === user.phone) return;

        setLoading('phone');
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'phone', newPhone: phone, password: phonePassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Phone change request submitted for admin approval");
                setPhonePassword('');
            } else {
                toast.error(data.error || "Failed to submit phone change");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground text-lg">Manage your account security and contact information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Section */}
                <Card className="shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Mail className="h-5 w-5 text-primary" />
                            Email Address
                        </CardTitle>
                        <CardDescription>Update your primary email address. Requires verification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateEmail} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            {user.pendingEmail && (
                                <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-blue-800 text-xs border border-blue-100">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>Pending verification: <strong>{user.pendingEmail}</strong></span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email-password">Current Password</Label>
                                <Input
                                    id="email-password"
                                    type="password"
                                    value={emailPassword}
                                    placeholder="Required to change email"
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    className="h-11"
                                    required={email !== user.email}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading === 'email' || email === user.email}
                                className="w-full h-11"
                            >
                                {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Email
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Phone Section */}
                <Card className="shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Phone className="h-5 w-5 text-primary" />
                            Phone Number
                        </CardTitle>
                        <CardDescription>Update your phone number. Requires admin approval.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePhone} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            {user.pendingPhone && (
                                <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-3 text-amber-800 text-xs border border-amber-100">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>Awaiting approval: <strong>{user.pendingPhone}</strong></span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="phone-password">Current Password</Label>
                                <Input
                                    id="phone-password"
                                    type="password"
                                    value={phonePassword}
                                    placeholder="Required to change phone"
                                    onChange={(e) => setPhonePassword(e.target.value)}
                                    className="h-11"
                                    required={phone !== user.phone}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading === 'phone' || phone === user.phone}
                                className="w-full h-11"
                            >
                                {loading === 'phone' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Phone
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Change Password */}
            <Card className="shadow-sm border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Lock className="h-5 w-5 text-primary" />
                        Change Password
                    </CardTitle>
                    <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Current Password</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={passwords.oldPassword}
                                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                    className="h-11"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="h-11"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="h-11"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading === 'password'} className="h-11 px-8">
                                {loading === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-primary">Security Note</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Sensitive account changes such as email or phone number updates require a verification process.
                        Until the change is verified or approved, your existing contact information will remain active.
                    </p>
                </div>
            </div>
        </div>
    );
}
