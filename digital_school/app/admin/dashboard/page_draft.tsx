import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    GraduationCap,
    FileText,
    Calendar,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    Home,
    UserCheck,
    BookOpen,
    ClipboardList,
    CreditCard,
    MessageSquare,
    Activity,
    Shield,
    Menu,
    X,
    Scan,
    Plus,
    Search,
    Filter,
    Download,
    Trash2,
    Edit,
    CheckCircle,
    Clock,
    Zap,
    User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppFooter } from '@/components/AppFooter';
import {
    AdminAnalyticsTab,
    AttendanceTab,
    NoticesTab,
    BillingTab,
    ChatTab,
    SecurityTab,
    AdminSettingsTab,
    AdminAdmitCardsTab
} from "@/components/dashboard/admin-tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ... Interfaces ...

// ... Main Component ...
