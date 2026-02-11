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

import {
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Download,
    AlertCircle,
    Info,
    Activity,
    Cpu,
    Database as DatabaseIcon,
    Zap,
    Clock,
    Terminal,
    Eye,
    ChevronRight,
    ChevronDown,
    Users
} from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

// ... existing interfaces ...

export function SystemLogsTab({ logs }: { logs: ActivityLog[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [filterType, setFilterType] = useState<'ALL' | 'EXAM' | 'USER' | 'SYSTEM' | 'AI'>('ALL');

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || log.type === filterType;
        return matchesSearch && matchesType;
    });

    const getLogColor = (log: ActivityLog) => {
        const details = log.details.toLowerCase();
        if (details.includes('error') || details.includes('fail') || details.includes('exception'))
            return 'border-l-4 border-l-destructive bg-destructive/5';
        if (details.includes('warn') || details.includes('slow'))
            return 'border-l-4 border-l-amber-500 bg-amber-500/5';
        return 'border-l-4 border-l-primary bg-primary/5';
    };

    const getLevelBadge = (log: ActivityLog) => {
        const details = log.details.toLowerCase();
        if (details.includes('error') || details.includes('fail') || details.includes('exception'))
            return <Badge variant="destructive" className="text-[10px] py-0">ERROR</Badge>;
        if (details.includes('warn') || details.includes('slow'))
            return <Badge className="bg-amber-500 text-white text-[10px] py-0">WARN</Badge>;
        return <Badge variant="secondary" className="text-[10px] py-0">INFO</Badge>;
    };

    return (
        <div className="space-y-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/30">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-primary" />
                                System Console
                            </CardTitle>
                            <CardDescription>Real-time audit trail and error tracking</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <Download className="h-4 w-4 mr-2" /> Export Logs
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by action, user, or payload..."
                                className="pl-9 bg-background/50 border-muted"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'SYSTEM', 'AI', 'EXAM', 'USER'] as const).map(type => (
                                <Button
                                    key={type}
                                    variant={filterType === type ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType(type)}
                                    className="text-xs"
                                >
                                    {type}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border bg-background/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[100px]">Level</TableHead>
                                    <TableHead>Activity</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="h-8 w-8 opacity-20" />
                                                <p>No system logs matching your filters</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className={`group cursor-pointer hover:bg-muted/30 transition-colors ${getLogColor(log)}`}
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <TableCell className="text-[11px] font-mono text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getLevelBadge(log)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-semibold text-foreground">{log.action}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[300px] font-mono opacity-70">
                                                        {log.details}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                        {log.user[0]}
                                                    </div>
                                                    <span className="text-xs font-medium">{log.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl bg-zinc-950 text-zinc-100 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-mono">
                            <Terminal className="h-5 w-5" />
                            Log Inspector: {selectedLog?.id.slice(0, 8)}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Detailed system event payload and context
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm font-mono p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Action</p>
                                    <p className="text-emerald-400">{selectedLog.action}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Category</p>
                                    <p className="text-sky-400">{selectedLog.type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold">User</p>
                                    <p>{selectedLog.user}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Timestamp</p>
                                    <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-zinc-500 text-xs font-bold uppercase">Raw Context Payload</p>
                                <pre className="p-4 rounded-lg bg-black/50 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-auto max-h-[300px]">
                                    {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function AnalyticsTab({
    systemStats
}: {
    systemStats?: {
        latency: number;
        errorRate: number;
        activeConnections: number;
        status: string;
        uptime: string;
    }
}) {
    const latencyData = {
        labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
        datasets: [{
            label: 'API Latency (ms)',
            data: [210, 245, systemStats?.latency || 250, 190, systemStats?.latency || 230],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const errorData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'System Errors',
            data: [2, 5, 1, 0, 8, systemStats?.errorRate ? Math.ceil(systemStats.errorRate) : 4, 2],
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
        }]
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-600 flex items-center gap-2">
                            <Activity className="h-3 w-3" /> System Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{systemStats?.status || 'Operational'}</div>
                        <p className="text-[10px] text-emerald-600/70 mt-1">Uptime: {systemStats?.uptime || '99.9%'}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-blue-600 flex items-center gap-2">
                            <Zap className="h-3 w-3" /> Avg Latency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{systemStats?.latency || 250}ms</div>
                        <p className="text-[10px] text-blue-600/70 mt-1">P95 Response Time</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-500/5 border-rose-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> Error Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-700">{systemStats?.errorRate || 0}%</div>
                        <p className="text-[10px] text-rose-600/70 mt-1">Last 24 hours</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-purple-600 flex items-center gap-2">
                            <Users className="h-3 w-3" /> Active Sockets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">{systemStats?.activeConnections || 12}</div>
                        <p className="text-[10px] text-purple-600/70 mt-1">Live connected users</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" /> Latency Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <Line data={latencyData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: false } }
                        }} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-500" /> Failure Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <Bar data={errorData} options={{
                            responsive: true,
                            maintainAspectRatio: false
                        }} />
                    </CardContent>
                </Card>
            </div>
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
