"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  ArrowRight 
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  institute?: {
    id: string;
    name: string;
  };
  studentProfile?: {
    roll: string;
    registrationNo: string;
    class: {
      name: string;
      section: string;
    };
  };
  teacherProfile?: {
    employeeId: string;
    department: string;
    subjects: string[];
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current user data
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleDashboard = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'SUPER_USER':
        return '/super-user/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'TEACHER':
        return '/teacher/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_USER':
        return 'bg-purple-500';
      case 'ADMIN':
        return 'bg-red-500';
      case 'TEACHER':
        return 'bg-blue-500';
      case 'STUDENT':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_USER':
        return <Settings className="h-5 w-5" />;
      case 'ADMIN':
        return <Users className="h-5 w-5" />;
      case 'TEACHER':
        return <BookOpen className="h-5 w-5" />;
      case 'STUDENT':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-muted-foreground">Role-based Dashboard</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleColor(user.role)} text-white`}>
                    {getRoleIcon(user.role)}
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {user.institute && (
                <div>
                  <p className="text-sm text-muted-foreground">Institute</p>
                  <p className="font-medium">{user.institute.name}</p>
                </div>
              )}
            </div>

            {/* Role-specific information */}
            {user.studentProfile && (
              <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                <h3 className="font-semibold mb-2">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Roll</p>
                    <p className="font-medium">{user.studentProfile.roll}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration No</p>
                    <p className="font-medium">{user.studentProfile.registrationNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">
                      {user.studentProfile.class.name} - {user.studentProfile.class.section}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user.teacherProfile && (
              <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                <h3 className="font-semibold mb-2">Teacher Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{user.teacherProfile.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{user.teacherProfile.department}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Subjects</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.teacherProfile.subjects.map((subject, index) => (
                        <Badge key={index} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Dashboard Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Role Dashboard</CardTitle>
            <CardDescription>
              Navigate to your role-specific dashboard for full functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push(getRoleDashboard())}
            >
              Go to {user.role.replace('_', ' ')} Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 