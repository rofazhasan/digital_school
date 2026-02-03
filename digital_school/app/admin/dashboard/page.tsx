'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Scan
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




interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home, href: '#overview' },
  { id: 'students', label: 'Students', icon: Users, href: '#students', badge: 1250 },
  { id: 'teachers', label: 'Teachers', icon: UserCheck, href: '#teachers', badge: 45 },
  { id: 'classes', label: 'Classes', icon: GraduationCap, href: '#classes', badge: 12 },
  { id: 'exams', label: 'Exams', icon: FileText, href: '#exams', badge: 8 },
  { id: 'questions', label: 'Question Bank', icon: BookOpen, href: '#questions' },
  { id: 'admit-cards', label: 'Admit Cards', icon: ClipboardList, href: '#admit-cards' },
  { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
  { id: 'omr-scanner', label: 'OMR Scanner', icon: Scan, href: '/omr_scanner' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, href: '#attendance' },
  { id: 'notices', label: 'Notices', icon: Bell, href: '#notices' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '#billing' },
  { id: 'chat', label: 'Chat Support', icon: MessageSquare, href: '#chat' },
  { id: 'analytics', label: 'Analytics', icon: Activity, href: '#analytics' },
  { id: 'security', label: 'Security', icon: Shield, href: '#security' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'students':
        return <StudentsTab />;
      case 'teachers':
        return <TeachersTab />;
      case 'classes':
        return <ClassesTab />;
      case 'exams':
        return <ExamsTab />;
      case 'questions':
        return 'Hi';
      case 'admit-cards':
        return <AdminAdmitCardsTab />;
      case 'results':
        return <ResultsTab />;
      case 'attendance':
        return <AttendanceTab />;
      case 'notices':
        return <NoticesTab />;
      case 'billing':
        return <BillingTab />;
      case 'chat':
        return <ChatTab />;
      case 'analytics':
        return <AdminAnalyticsTab />;
      case 'security':
        return <SecurityTab />;
      case 'settings':
        return <AdminSettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  const [instituteSettings, setInstituteSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
  }, []);

  const instituteName = instituteSettings?.instituteName || "Digital School";
  const instituteLogo = instituteSettings?.logoUrl || "/logo.png";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay — covers everything except the sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          {/* Blur + darken effect behind the sidebar */}
          <div className="absolute inset-0 bg-gray-600 bg-opacity-60 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className={`fixed lg:relative z-50 h-full bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
              className="flex items-center gap-2"
            >
              <img src={instituteLogo} alt={instituteName} className="h-8 w-auto object-contain" />
              <span className="text-xl lg:text-2xl font-bold text-gray-800">{instituteName}</span>
            </motion.div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href);
                  } else {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center px-3 lg:px-4 py-3 lg:py-3 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium min-h-[44px] ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 shadow-sm ring-2 ring-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
              >
                <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                <motion.span
                  initial={{ opacity: 1 }}
                  animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
                  className="flex-1 text-left"
                >
                  {item.label}
                </motion.span>
                {item.badge && (
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
                    className={`text-xs px-2 py-1 rounded-full font-semibold min-w-[20px] text-center ${activeTab === item.id
                      ? 'bg-blue-200 text-blue-700'
                      : 'bg-blue-100 text-blue-600'
                      }`}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar with User Menu */}
        <div className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white border-b border-gray-200 relative z-10 shadow-sm">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 lg:hidden" />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center space-x-2 focus:outline-none group p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="inline-block w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm lg:text-lg shadow-sm">
                AD
              </span>
              <span className="hidden md:inline text-gray-800 font-medium">Admin</span>
              <svg className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div ref={userMenuRef} className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 ring-1 ring-black ring-opacity-5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm lg:text-base">Welcome back! Here&apos;s what&apos;s happening with your school.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">1,250</p>
            </div>
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-green-600">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Active Teachers</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">45</p>
            </div>
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-green-600">+3%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="p-2 lg:p-3 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-red-600">-2</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">$45,230</p>
            </div>
            <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-green-600">+8%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 lg:space-y-4">
            {[
              { action: 'New student registered', time: '2 minutes ago', type: 'student' },
              { action: 'Exam created: Math Final', time: '1 hour ago', type: 'exam' },
              { action: 'Teacher joined: Sarah Johnson', time: '3 hours ago', type: 'teacher' },
              { action: 'Results published: Science Mid', time: '5 hours ago', type: 'result' },
              { action: 'Notice posted: Holiday Schedule', time: '1 day ago', type: 'notice' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'student' ? 'bg-blue-500' :
                  activity.type === 'exam' ? 'bg-purple-500' :
                    activity.type === 'teacher' ? 'bg-green-500' :
                      activity.type === 'result' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {[
              { label: 'Add Student', icon: Users, color: 'blue' },
              { label: 'Create Exam', icon: FileText, color: 'purple' },
              { label: 'Post Notice', icon: Bell, color: 'yellow' },
              { label: 'View Reports', icon: BarChart3, color: 'green' },
            ].map((action, index) => (
              <button
                key={index}
                className={`p-3 lg:p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 lg:w-6 lg:h-6 text-${action.color}-600 mx-auto mb-2`} />
                <p className="text-xs lg:text-sm font-medium text-gray-700">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Students Tab Component
function StudentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const mockStudents = [
    {
      id: 1,
      name: 'Md. Rofaz Hasan Rafiu',
      email: 'rofaz@example.com',
      phone: '+880 1712345678',
      class: 'Class 10',
      roll: '2024001',
      status: 'active',
      joinDate: '2024-01-15',
      attendance: 95,
      gpa: 4.8
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+880 1812345678',
      class: 'Class 9',
      roll: '2024002',
      status: 'active',
      joinDate: '2024-01-20',
      attendance: 88,
      gpa: 4.2
    },
    {
      id: 3,
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '+880 1912345678',
      class: 'Class 11',
      roll: '2024003',
      status: 'inactive',
      joinDate: '2024-02-01',
      attendance: 75,
      gpa: 3.8
    },
    {
      id: 4,
      name: 'Fatima Ali',
      email: 'fatima@example.com',
      phone: '+880 2012345678',
      class: 'Class 10',
      roll: '2024004',
      status: 'active',
      joinDate: '2024-01-25',
      attendance: 92,
      gpa: 4.5
    },
    {
      id: 5,
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '+880 2112345678',
      class: 'Class 12',
      roll: '2024005',
      status: 'active',
      joinDate: '2024-02-10',
      attendance: 89,
      gpa: 4.1
    }
  ];

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll.includes(searchTerm);
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-2">Manage all students, their profiles, and academic records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Users className="w-5 h-5 mr-2" />
          Add New Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{mockStudents.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{mockStudents.filter(s => s.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">87.8%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg GPA</p>
              <p className="text-2xl font-bold text-gray-900">4.3</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class & Roll
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">Joined {student.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.class}</div>
                    <div className="text-sm text-gray-500">Roll: {student.roll}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                    <div className="text-sm text-gray-500">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-gray-900">Attendance: {student.attendance}%</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${student.attendance}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">GPA: {student.gpa}</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(student.gpa / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-green-600 hover:text-green-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredStudents.length}</span> of{' '}
                <span className="font-medium">{mockStudents.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Student</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Select Class</option>
                    <option>Class 9</option>
                    <option>Class 10</option>
                    <option>Class 11</option>
                    <option>Class 12</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Teachers Tab Component
function TeachersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const mockTeachers = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@school.com',
      phone: '+880 1712345678',
      subject: 'Mathematics',
      qualification: 'PhD in Mathematics',
      experience: '8 years',
      status: 'active',
      joinDate: '2020-03-15',
      studentsCount: 120,
      rating: 4.8,
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Prof. Ahmed Khan',
      email: 'ahmed.khan@school.com',
      phone: '+880 1812345678',
      subject: 'Physics',
      qualification: 'MSc in Physics',
      experience: '12 years',
      status: 'active',
      joinDate: '2018-06-20',
      studentsCount: 95,
      rating: 4.6,
      avatar: 'AK'
    },
    {
      id: 3,
      name: 'Ms. Fatima Ali',
      email: 'fatima.ali@school.com',
      phone: '+880 1912345678',
      subject: 'English',
      qualification: 'MA in English Literature',
      experience: '5 years',
      status: 'active',
      joinDate: '2021-01-10',
      studentsCount: 150,
      rating: 4.9,
      avatar: 'FA'
    },
    {
      id: 4,
      name: 'Mr. David Wilson',
      email: 'david.wilson@school.com',
      phone: '+880 2012345678',
      subject: 'Chemistry',
      qualification: 'MSc in Chemistry',
      experience: '6 years',
      status: 'inactive',
      joinDate: '2022-08-05',
      studentsCount: 80,
      rating: 4.3,
      avatar: 'DW'
    },
    {
      id: 5,
      name: 'Dr. Maria Garcia',
      email: 'maria.garcia@school.com',
      phone: '+880 2112345678',
      subject: 'Biology',
      qualification: 'PhD in Biology',
      experience: '10 years',
      status: 'active',
      joinDate: '2019-09-12',
      studentsCount: 110,
      rating: 4.7,
      avatar: 'MG'
    }
  ];

  const filteredTeachers = mockTeachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || teacher.subject === selectedSubject;
    const matchesStatus = selectedStatus === 'all' || teacher.status === selectedStatus;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-2">Manage all teachers, their profiles, and teaching assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <UserCheck className="w-5 h-5 mr-2" />
          Add New Teacher
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{mockTeachers.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{mockTeachers.filter(t => t.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">4.7</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">555</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject & Qualification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {teacher.avatar}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">Joined {teacher.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{teacher.subject}</div>
                    <div className="text-sm text-gray-500">{teacher.qualification}</div>
                    <div className="text-xs text-gray-400">{teacher.experience} experience</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{teacher.email}</div>
                    <div className="text-sm text-gray-500">{teacher.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-gray-900">Students: {teacher.studentsCount}</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(teacher.studentsCount / 150) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">Rating: {teacher.rating}</div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(teacher.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${teacher.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-green-600 hover:text-green-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTeachers.length}</span> of{' '}
                <span className="font-medium">{mockTeachers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Teacher</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                    <option>Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Biology</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualification</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter qualification"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder components for other tabs
function ClassesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const mockClasses = [
    {
      id: 1,
      name: 'Class 10-A',
      grade: 'Class 10',
      section: 'A',
      teacher: 'Dr. Sarah Johnson',
      students: 35,
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
      schedule: 'Monday-Friday, 8:00 AM - 2:00 PM',
      room: 'Room 101',
      status: 'active'
    },
    {
      id: 2,
      name: 'Class 9-B',
      grade: 'Class 9',
      section: 'B',
      teacher: 'Prof. Ahmed Khan',
      students: 32,
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
      schedule: 'Monday-Friday, 8:00 AM - 2:00 PM',
      room: 'Room 102',
      status: 'active'
    },
    {
      id: 3,
      name: 'Class 11-C',
      grade: 'Class 11',
      section: 'C',
      teacher: 'Ms. Fatima Ali',
      students: 28,
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
      schedule: 'Monday-Friday, 8:00 AM - 2:00 PM',
      room: 'Room 103',
      status: 'active'
    },
    {
      id: 4,
      name: 'Class 12-A',
      grade: 'Class 12',
      section: 'A',
      teacher: 'Mr. David Wilson',
      students: 30,
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
      schedule: 'Monday-Friday, 8:00 AM - 2:00 PM',
      room: 'Room 104',
      status: 'active'
    }
  ];

  const filteredClasses = mockClasses.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || cls.grade === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-2">Manage class sections, schedules, and assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <GraduationCap className="w-5 h-5 mr-2" />
          Add New Class
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{mockClasses.length}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">125</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900">{mockClasses.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Class Size</p>
              <p className="text-2xl font-bold text-gray-900">31</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by class name or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Grades</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.grade}</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {cls.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <UserCheck className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Teacher: {cls.teacher}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{cls.students} students</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{cls.schedule}</span>
              </div>
              <div className="flex items-center text-sm">
                <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{cls.subjects.length} subjects</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 text-gray-400 mr-2">📍</div>
                <span className="text-gray-600">{cls.room}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 text-blue-600 hover:text-blue-900 text-sm font-medium">View</button>
                <button className="flex-1 text-green-600 hover:text-green-900 text-sm font-medium">Edit</button>
                <button className="flex-1 text-purple-600 hover:text-purple-900 text-sm font-medium">Schedule</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Class</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Class 10-A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Select Grade</option>
                    <option>Class 9</option>
                    <option>Class 10</option>
                    <option>Class 11</option>
                    <option>Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., A, B, C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Teacher</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Select Teacher</option>
                    <option>Dr. Sarah Johnson</option>
                    <option>Prof. Ahmed Khan</option>
                    <option>Ms. Fatima Ali</option>
                    <option>Mr. David Wilson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Add Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const mockExams = [
    {
      id: 1,
      title: 'Mathematics Final Exam',
      subject: 'Mathematics',
      type: 'ONLINE',
      status: 'upcoming',
      date: '2025-07-20',
      time: '09:00 AM',
      duration: '3 hours',
      totalMarks: 100,
      participants: 150,
      teacher: 'Dr. Sarah Johnson',
      description: 'Comprehensive final examination covering all topics from the semester.'
    },
    {
      id: 2,
      title: 'Physics Mid-Term',
      subject: 'Physics',
      type: 'OFFLINE',
      status: 'ongoing',
      date: '2025-07-15',
      time: '10:30 AM',
      duration: '2 hours',
      totalMarks: 50,
      participants: 120,
      teacher: 'Prof. Ahmed Khan',
      description: 'Mid-term examination focusing on mechanics and thermodynamics.'
    },
    {
      id: 3,
      title: 'English Literature Quiz',
      subject: 'English',
      type: 'ONLINE',
      status: 'completed',
      date: '2025-07-10',
      time: '02:00 PM',
      duration: '1 hour',
      totalMarks: 25,
      participants: 180,
      teacher: 'Ms. Fatima Ali',
      description: 'Quiz on Shakespeare and modern literature.'
    },
    {
      id: 4,
      title: 'Chemistry Lab Test',
      subject: 'Chemistry',
      type: 'OFFLINE',
      status: 'upcoming',
      date: '2025-07-25',
      time: '11:00 AM',
      duration: '2.5 hours',
      totalMarks: 75,
      participants: 95,
      teacher: 'Mr. David Wilson',
      description: 'Practical laboratory examination with theoretical components.'
    },
    {
      id: 5,
      title: 'Biology Unit Test',
      subject: 'Biology',
      type: 'ONLINE',
      status: 'draft',
      date: '2025-08-01',
      time: '03:30 PM',
      duration: '1.5 hours',
      totalMarks: 40,
      participants: 110,
      teacher: 'Dr. Maria Garcia',
      description: 'Unit test covering cell biology and genetics.'
    }
  ];

  const filteredExams = mockExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || exam.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || exam.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'ONLINE' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exams Management</h1>
          <p className="text-gray-600 mt-2">Create, schedule, and monitor all examinations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
        >
          <FileText className="w-5 h-5 mr-2" />
          Create New Exam
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{mockExams.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{mockExams.filter(e => e.status === 'upcoming').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ongoing</p>
              <p className="text-2xl font-bold text-gray-900">{mockExams.filter(e => e.status === 'ongoing').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">655</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by title, subject, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Export Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                      <div className="text-sm text-gray-500">{exam.subject}</div>
                      <div className="text-xs text-gray-400 mt-1">{exam.description}</div>
                      <div className="text-xs text-gray-400">Teacher: {exam.teacher}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exam.date}</div>
                    <div className="text-sm text-gray-500">{exam.time}</div>
                    <div className="text-xs text-gray-400">Duration: {exam.duration}</div>
                    <div className="text-xs text-gray-400">Marks: {exam.totalMarks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(exam.type)}`}>
                        {exam.type}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exam.participants} students</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(exam.participants / 180) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-green-600 hover:text-green-900">Edit</button>
                      <button className="text-purple-600 hover:text-purple-900">Schedule</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredExams.length}</span> of{' '}
                <span className="font-medium">{mockExams.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Exam</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exam Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter exam title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    <option>Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Biology</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    <option>Select Type</option>
                    <option>ONLINE</option>
                    <option>OFFLINE</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                    <input
                      type="number"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter exam description"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Create Exam
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function ResultsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const mockResults = [
    {
      id: 1,
      examName: 'Mathematics Final Exam',
      class: 'Class 10-A',
      subject: 'Mathematics',
      totalStudents: 35,
      publishedStudents: 32,
      averageScore: 78.5,
      highestScore: 98,
      lowestScore: 45,
      passRate: 85.7,
      publishDate: '2025-07-12',
      status: 'published'
    },
    {
      id: 2,
      examName: 'Physics Mid-Term',
      class: 'Class 11-C',
      subject: 'Physics',
      totalStudents: 28,
      publishedStudents: 28,
      averageScore: 72.3,
      highestScore: 95,
      lowestScore: 52,
      passRate: 82.1,
      publishDate: '2025-07-08',
      status: 'published'
    },
    {
      id: 3,
      examName: 'English Literature Quiz',
      class: 'Class 9-B',
      subject: 'English',
      totalStudents: 32,
      publishedStudents: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      publishDate: null,
      status: 'pending'
    },
    {
      id: 4,
      examName: 'Chemistry Lab Test',
      class: 'Class 12-A',
      subject: 'Chemistry',
      totalStudents: 30,
      publishedStudents: 25,
      averageScore: 81.2,
      highestScore: 100,
      lowestScore: 58,
      passRate: 90.0,
      publishDate: '2025-07-10',
      status: 'partial'
    }
  ];

  const filteredResults = mockResults.filter(result => {
    const matchesSearch = result.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = selectedExam === 'all' || result.examName === selectedExam;
    const matchesClass = selectedClass === 'all' || result.class === selectedClass;

    return matchesSearch && matchesExam && matchesClass;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600 mt-2">Manage exam results, analytics, and student performance</p>
        </div>
        <button
          onClick={() => setShowPublishModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Publish Results
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{mockResults.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{mockResults.filter(r => r.status === 'published').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">78.2%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">84.5%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by exam name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Exams</option>
              <option value="Mathematics Final Exam">Mathematics Final</option>
              <option value="Physics Mid-Term">Physics Mid-Term</option>
              <option value="English Literature Quiz">English Quiz</option>
              <option value="Chemistry Lab Test">Chemistry Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              <option value="Class 10-A">Class 10-A</option>
              <option value="Class 11-C">Class 11-C</option>
              <option value="Class 9-B">Class 9-B</option>
              <option value="Class 12-A">Class 12-A</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Export Results
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class & Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{result.examName}</div>
                      <div className="text-sm text-gray-500">
                        {result.publishDate ? `Published: ${result.publishDate}` : 'Not published yet'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.class}</div>
                    <div className="text-sm text-gray-500">{result.subject}</div>
                    <div className="text-xs text-gray-400">{result.totalStudents} students</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-900">Avg: {result.averageScore}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${result.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Highest: {result.highestScore} | Lowest: {result.lowestScore}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-900">Pass Rate: {result.passRate}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${result.passRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Published: {result.publishedStudents}/{result.totalStudents}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-green-600 hover:text-green-900">Edit</button>
                      <button className="text-purple-600 hover:text-purple-900">Analytics</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredResults.length}</span> of{' '}
                <span className="font-medium">{mockResults.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', avgScore: 78.5, passRate: 85.7, color: 'bg-blue-500' },
              { subject: 'Physics', avgScore: 72.3, passRate: 82.1, color: 'bg-green-500' },
              { subject: 'Chemistry', avgScore: 81.2, passRate: 90.0, color: 'bg-purple-500' },
              { subject: 'English', avgScore: 75.8, passRate: 88.5, color: 'bg-yellow-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-900">{item.subject}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{item.avgScore}%</div>
                  <div className="text-xs text-gray-500">{item.passRate}% pass rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Mathematics Final results published', time: '2 hours ago', type: 'publish' },
              { action: 'Physics Mid-Term grading completed', time: '1 day ago', type: 'grade' },
              { action: 'Chemistry Lab results reviewed', time: '2 days ago', type: 'review' },
              { action: 'English Quiz scheduled for grading', time: '3 days ago', type: 'schedule' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'publish' ? 'bg-green-500' :
                  activity.type === 'grade' ? 'bg-blue-500' :
                    activity.type === 'review' ? 'bg-purple-500' : 'bg-yellow-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Publish Results Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Publish Results</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Exam</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                    <option>Select Exam</option>
                    <option>Mathematics Final Exam</option>
                    <option>Physics Mid-Term</option>
                    <option>English Literature Quiz</option>
                    <option>Chemistry Lab Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Publish Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                    <option>Send notification to students</option>
                    <option>Send notification to parents</option>
                    <option>Send to both</option>
                    <option>No notification</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Publish Results
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
