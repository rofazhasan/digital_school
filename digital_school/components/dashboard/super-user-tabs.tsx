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
import { CheckCircle, XCircle, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Redefine interfaces locally for simplicity
interface PendingApproval {
    id: string;
    type: 'EXAM' | 'GRADING' | 'MARK_RELEASE' | 'USER';
    title: string;
    submittedBy: string;
    submittedAt: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AIUsage {
    userId: string;
    userName: string;
    tokensUsed: number;
    requests: number;
    lastUsed: string;
}

interface ActivityLog {
    id: string;
    action: string;
    user: string;
    details: string;
    timestamp: string;
    type: 'EXAM' | 'USER' | 'SYSTEM' | 'AI';
}

export function ApprovalsTab({ approvals }: { approvals: PendingApproval[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve requests requiring your attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                    <Input placeholder="Search approvals..." className="max-w-sm" />
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {approvals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No pending approvals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            approvals.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                    <TableCell>{item.submittedBy}</TableCell>
                                    <TableCell>{item.submittedAt}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                        }>
                                            {item.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function AiUsageTab({ data }: { data: AIUsage[] }) {
    const totalTokens = data.reduce((sum, item) => sum + item.tokensUsed, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Tokens Used</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Est. Cost</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">${(totalTokens * 0.00002).toFixed(2)}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>AI Usage Details</CardTitle>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Requests</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead>Last Used</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.userName}</span>
                                            <span className="text-xs text-muted-foreground">{item.userId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.requests}</TableCell>
                                    <TableCell>{item.tokensUsed.toLocaleString()}</TableCell>
                                    <TableCell>{new Date(item.lastUsed).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export function SystemLogsTab({ logs }: { logs: ActivityLog[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Audit trail of all system activities.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                    <Input placeholder="Search logs..." className="max-w-sm" />
                    <Button variant="outline">Filter</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="text-xs text-muted-foreground">{log.timestamp}</TableCell>
                                <TableCell className="font-medium">{log.action}</TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell className="max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                                <TableCell><Badge variant="outline">{log.type}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function AnalyticsTab() {
    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Exams Taken',
                data: [12, 19, 3, 5, 2, 3, 15],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'New Users',
                data: [2, 5, 1, 0, 8, 4, 6],
                borderColor: 'rgb(53, 162, 235)',
                tension: 0.1
            }
        ]
    };

    const barData = {
        labels: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
        datasets: [
            {
                label: 'Avg Score',
                data: [78, 82, 75, 85],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
            }
        ]
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Performance by Class</CardTitle>
                </CardHeader>
                <CardContent>
                    <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
                </CardContent>
            </Card>
        </div>
    );
}

export function ProfileTab({ user }: { user: any }) {
    return (
        <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your personal account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input defaultValue={user?.name} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input defaultValue={user?.email} disabled />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Role</label>
                        <Input defaultValue={user?.role} disabled />
                    </div>
                    <Button>Update Profile</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <Input type="password" />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input type="password" />
                    </div>
                    <Button variant="outline">Change Password</Button>
                </CardContent>
            </Card>
        </div>
    );
}
