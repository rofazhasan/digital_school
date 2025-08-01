"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle, AlertCircle, Building } from "lucide-react";

export default function SetupPage() {
  const [formData, setFormData] = useState({
    // Super User fields
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Institute fields
    instituteName: "",
    instituteAddress: "",
    institutePhone: "",
    instituteEmail: "",
    instituteWebsite: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Validate required institute fields
    if (!formData.instituteName.trim()) {
      setError("Institute name is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/setup/super-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Super User data
          name: formData.name,
          email: formData.email,
          password: formData.password,
          // Institute data
          institute: {
            name: formData.instituteName,
            address: formData.instituteAddress || null,
            phone: formData.institutePhone || null,
            email: formData.instituteEmail || null,
            website: formData.instituteWebsite || null,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to create super user and institute");
        return;
      }

      setSuccess("Super user and institute created successfully! Redirecting to dashboard...");
      
      // Redirect to super user dashboard after 2 seconds
      setTimeout(() => {
        router.push("/super-user/dashboard");
      }, 2000);

    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the super user and institute");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Elite Exam System</CardTitle>
          <CardDescription>
            Create the initial super user account and institute for Elite Exam System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Super User Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Super User Account</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Institute Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Institute Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instituteName">Institute Name *</Label>
                <Input
                  id="instituteName"
                  name="instituteName"
                  type="text"
                  placeholder="Enter institute name"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instituteEmail">Institute Email</Label>
                  <Input
                    id="instituteEmail"
                    name="instituteEmail"
                    type="email"
                    placeholder="institute@example.com"
                    value={formData.instituteEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutePhone">Institute Phone</Label>
                  <Input
                    id="institutePhone"
                    name="institutePhone"
                    type="tel"
                    placeholder="+8801712345678"
                    value={formData.institutePhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instituteAddress">Institute Address</Label>
                <Input
                  id="instituteAddress"
                  name="instituteAddress"
                  type="text"
                  placeholder="Enter institute address"
                  value={formData.instituteAddress}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instituteWebsite">Institute Website</Label>
                <Input
                  id="instituteWebsite"
                  name="instituteWebsite"
                  type="url"
                  placeholder="https://www.institute.com"
                  value={formData.instituteWebsite}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Super User & Institute...
                </>
              ) : (
                "Create Super User & Institute"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>This will create the first super user account and institute with full system access.</p>
            <p className="mt-2">
              <strong>Note:</strong> Only one super user can exist in the system.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 