"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    BarChart3,
    Users,
    DollarSign,
    MessageSquare,
    Shield,
    Settings,
    Bell,
    Search,
    Download,
    Filter,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
} from 'chart.js';

import { SecuritySettings } from "./SecuritySettings";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement
);

export function AdminAnalyticsTab() {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue ($)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Expenses ($)',
                data: [8000, 12000, 10000, 15000, 18000, 20000],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }
        ]
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">$123,456</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">2,350</div>
                        <p className="text-xs text-muted-foreground">+180 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92.5%</div>
                        <p className="text-xs text-muted-foreground">+2.5% from last term</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">-4 from yesterday</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Revenue vs Expenses for first half of year.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[400px]">
                    <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                </CardContent>
            </Card>
        </div>
    );
}

export function AttendanceTab() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>Monitor student and teacher attendance.</CardDescription>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                        <Input type="date" className="flex-1 sm:w-auto" />
                        <Button className="flex-1 sm:flex-none">View Report</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 border rounded-lg bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800">
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">Present</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">850</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800">
                        <div className="text-sm font-medium text-red-800 dark:text-red-300">Absent</div>
                        <div className="text-2xl font-bold text-red-900 dark:text-red-100">45</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Late</div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">32</div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">Class</TableHead>
                                <TableHead className="min-w-[120px]">Total Students</TableHead>
                                <TableHead className="min-w-[100px]">Present</TableHead>
                                <TableHead className="min-w-[100px]">Absent</TableHead>
                                <TableHead className="min-w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { class: 'Class 10-A', total: 45, present: 42, absent: 3 },
                                { class: 'Class 12-B', total: 40, present: 35, absent: 5 },
                                { class: 'Class 9-C', total: 38, present: 38, absent: 0 },
                            ].map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium whitespace-nowrap">{row.class}</TableCell>
                                    <TableCell>{row.total}</TableCell>
                                    <TableCell className="text-green-600 font-medium">{row.present}</TableCell>
                                    <TableCell className="text-red-600 font-medium">{row.absent}</TableCell>
                                    <TableCell><Button variant="ghost" size="sm">Details</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export function NoticesTab() {
    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>Notice Board</CardTitle>
                    <CardDescription>Manage and publish notices.</CardDescription>
                </div>
                <Button className="w-full sm:w-auto">
                    <Bell className="mr-2 h-4 w-4" /> Publish Notice
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[
                        { title: 'Summer Vacation Announcement', date: '2025-06-15', audience: 'All', status: 'Published' },
                        { title: 'Exam Schedule Update', date: '2025-06-20', audience: 'Students', status: 'Published' },
                        { title: 'Parents Meeting', date: '2025-07-01', audience: 'Parents', status: 'Draft' },
                    ].map((notice, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                            <div>
                                <h4 className="font-medium">{notice.title}</h4>
                                <div className="text-sm text-muted-foreground flex gap-3">
                                    <span>{notice.date}</span>
                                    <span>•</span>
                                    <span>{notice.audience}</span>
                                </div>
                            </div>
                            <div className="flex justify-start sm:justify-end">
                                <Badge variant={notice.status === 'Published' ? 'default' : 'secondary'}>{notice.status}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function BillingTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing & Invoices</CardTitle>
                <CardDescription>Manage student fees and payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Input placeholder="Search invoice..." className="w-full sm:max-w-sm" />
                    <Button variant="outline" className="w-full sm:w-auto"><Filter className="h-4 w-4 sm:mr-2" /><span className="sm:hidden">Filter</span><span className="hidden sm:inline">Filter Records</span></Button>
                </div>
                <div className="rounded-md border overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">Invoice ID</TableHead>
                                <TableHead className="min-w-[150px]">Student</TableHead>
                                <TableHead className="min-w-[100px]">Amount</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[120px]">Date</TableHead>
                                <TableHead className="min-w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { id: 'INV-001', student: 'John Doe', amount: '$500', status: 'Paid', date: '2025-05-01' },
                                { id: 'INV-002', student: 'Jane Smith', amount: '$500', status: 'Pending', date: '2025-05-05' },
                                { id: 'INV-003', student: 'Ali Khan', amount: '$450', status: 'Overdue', date: '2025-04-20' },
                            ].map((inv, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{inv.id}</TableCell>
                                    <TableCell className="whitespace-nowrap">{inv.student}</TableCell>
                                    <TableCell>{inv.amount}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                                inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                        }>{inv.status}</Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{inv.date}</TableCell>
                                    <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export function ChatTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 h-auto md:h-[600px] border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="border-b md:border-b-0 md:border-r col-span-1 bg-muted p-4 overflow-y-auto">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search contacts..." className="pl-9 bg-card" />
                    </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar pb-3 md:pb-0">
                    {['Support Team', 'Teachers Group', 'Admin Console'].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer bg-white border min-w-[180px] md:min-w-0 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                {name.charAt(0)}
                            </div>
                            <div className="hidden sm:block">
                                <div className="font-medium text-sm">{name}</div>
                                <div className="text-xs text-muted-foreground truncate w-24 lg:w-32">Latest message...</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-1 md:col-span-2 flex flex-col min-h-[400px]">
                <div className="p-4 border-b flex justify-between items-center bg-card sticky top-0 z-10">
                    <div className="font-medium">Support Team</div>
                    <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 p-4 bg-muted flex items-center justify-center text-muted-foreground">
                    Select a chat to start messaging
                </div>
                <div className="p-3 border-t bg-card flex gap-2 sticky bottom-0 z-10">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button className="px-6">Send</Button>
                </div>
            </div>
        </div>
    );
}

export function SecurityTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage platform security and access controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-1">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-1">
                        <Label className="text-base">Login Alerts</Label>
                        <p className="text-sm text-muted-foreground">Notify on new device login</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                        <Label className="text-base">Force Password Reset</Label>
                        <p className="text-sm text-muted-foreground">Require all users to reset password every 90 days</p>
                    </div>
                    <Switch />
                </div>
                <div className="pt-4 border-t">
                    <SecuritySettings />
                </div>
                <div className="pt-4">
                    <Button variant="destructive">View Audit Logs</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminSettingsTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>General system preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Institute Name</Label>
                        <Input defaultValue="Digital School" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Support Email</Label>
                        <Input defaultValue="support@digitalschool.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Timezone</Label>
                        <Input defaultValue="GMT+6 (Dhaka)" />
                    </div>
                </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <Button variant="outline" className="w-full sm:w-auto">Reset</Button>
                <Button className="w-full sm:w-auto">Save Changes</Button>
            </div>
        </div>
    );
}

export function AdminAdmitCardsTab() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Admit Cards</CardTitle>
                        <CardDescription>Generate and manage student admit cards.</CardDescription>
                    </div>
                    <Button className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Bulk Download</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="grid gap-1.5 w-full">
                        <Label>Select Exam</Label>
                        <Input placeholder="Select exam..." />
                    </div>
                    <div className="grid gap-1.5 w-full">
                        <Label>Select Class</Label>
                        <Input placeholder="Select class..." />
                    </div>
                    <div className="flex items-end">
                        <Button variant="secondary" className="w-full sm:w-auto">Filter Results</Button>
                    </div>
                </div>
                <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted border-dashed">
                    Select an exam and class to view generated admit cards.
                </div>
            </CardContent>
        </Card>
    );
}
