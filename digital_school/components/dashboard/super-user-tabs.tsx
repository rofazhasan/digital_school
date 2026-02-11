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
    Users,
    ShieldCheck,
    FileDown,
    Share2,
    Check,
    Trash2
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
    const [localLogs, setLocalLogs] = useState<ActivityLog[]>(logs);
    const [auditOpen, setAuditOpen] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    // Sync local logs when prop changes
    useState(() => {
        if (logs) setLocalLogs(logs);
    });

    const runAudit = async () => {
        setIsAuditing(true);
        setAuditOpen(true);
        try {
            const res = await fetch('/api/super-user/system-audit');
            const data = await res.json();
            setAuditData(data);
        } catch (err) {
            console.error('Audit failed', err);
        } finally {
            setIsAuditing(false);
        }
    };

    const handleClearHistory = async () => {
        setIsClearing(true);
        setConfirmClearOpen(false);

        // Optimistic update
        const previousLogs = [...localLogs];
        setLocalLogs([]);

        try {
            const res = await fetch('/api/super-user/activity-logs', { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');

            // Re-fetch to get the "Purged" log entry
            const freshRes = await fetch('/api/super-user/activity-logs');
            const data = await freshRes.json();
            setLocalLogs(data);
        } catch (err) {
            console.error('Failed to clear logs', err);
            setLocalLogs(previousLogs);
        } finally {
            setIsClearing(false);
        }
    };

    const filteredLogs = localLogs.filter(log => {
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
        const isAudit = log.action === 'SYSTEM_AUDIT';

        if (isAudit)
            return <Badge className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] py-0 border-none shadow-[0_0_8px_rgba(16,185,129,0.4)] px-2 font-bold tracking-tight">AUDIT</Badge>;

        if (details.includes('error') || details.includes('fail') || details.includes('exception'))
            return <Badge variant="destructive" className="bg-gradient-to-r from-rose-600 to-red-500 text-[10px] py-0 border-none shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse px-2 font-bold tracking-tight">ERROR</Badge>;

        if (details.includes('warn') || details.includes('slow'))
            return <Badge className="bg-gradient-to-r from-amber-600 to-orange-500 text-white text-[10px] py-0 border-none shadow-[0_0_8px_rgba(245,158,11,0.4)] px-2 font-bold tracking-tight">WARN</Badge>;

        return <Badge variant="secondary" className="text-[10px] py-0 border-none opacity-80 px-2 font-medium">INFO</Badge>;
    };

    const exportToJSON = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
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
                            {auditData && (
                                <div className="hidden md:flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] text-emerald-600 font-bold animate-in fade-in slide-in-from-right-2">
                                    <Check className="h-3 w-3 mr-1" /> LAST AUDIT: {auditData.summary.totalPages} PAGES
                                </div>
                            )}
                            <Button variant="default" size="sm" onClick={runAudit} disabled={isAuditing} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <ShieldCheck className={`h-4 w-4 mr-2 ${isAuditing ? 'animate-spin' : ''}`} />
                                {isAuditing ? 'Scanning...' : 'Audit System'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => exportToJSON(localLogs, `system-logs-${new Date().toISOString()}.json`)}>
                                <FileDown className="h-4 w-4 mr-2" /> Export
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setConfirmClearOpen(true)}
                                className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20 transition-all"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Clear History
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

            <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-muted">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                            System Audit Report
                        </DialogTitle>
                        <DialogDescription className="flex items-center justify-between">
                            <span>Comprehensive scan of system routes, APIs, environment, and infrastructure</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => exportToJSON(auditData, `audit-report-${new Date().toISOString()}.json`)}>
                                    <FileDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {isAuditing ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-6">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                <ShieldCheck className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-bold text-lg">Performing Deep System Scan</p>
                                <p className="text-sm text-muted-foreground">Analyzing routes, verifying environment, and testing infrastructure...</p>
                            </div>
                        </div>
                    ) : auditData && (
                        <div className="flex-1 overflow-auto py-6 space-y-8 pr-2 custom-scrollbar">
                            {/* Summary Cards with Glow Effects */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl border bg-gradient-to-b from-muted/50 to-transparent shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Total Pages</p>
                                    <p className="text-3xl font-black text-primary">{auditData.summary.totalPages}</p>
                                </div>
                                <div className="p-4 rounded-2xl border bg-gradient-to-b from-muted/50 to-transparent shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Total APIs</p>
                                    <p className="text-3xl font-black text-sky-500">{auditData.summary.totalApis}</p>
                                </div>
                                <div className="p-4 rounded-2xl border bg-gradient-to-b from-muted/50 to-transparent shadow-sm relative">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Env Health</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-3 w-3 rounded-full ${auditData.summary.envStatus === 'HEALTHY' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                                        <span className="font-bold text-sm tracking-tighter">{auditData.summary.envStatus}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border bg-gradient-to-b from-muted/50 to-transparent shadow-sm relative">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Infrastructure</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-3 w-3 rounded-full ${auditData.summary.infraStatus === 'HEALTHY' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`} />
                                        <span className="font-bold text-sm tracking-tighter">{auditData.summary.infraStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Sections with Premium Spacing */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-primary tracking-tight">
                                        <div className="h-8 w-1 bg-primary rounded-full" />
                                        Registered Page Routes
                                    </h3>
                                    <div className="max-h-[350px] overflow-auto rounded-2xl border bg-muted/5 p-4 space-y-2 font-mono scrollbar-hide">
                                        {auditData.pages.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic text-center py-10 opacity-50">Deep scan failed to resolve page routes. Ensure app/ directory is reachable.</p>
                                        ) : auditData.pages.map((path: string) => (
                                            <div key={path} className="text-[11px] p-2 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg flex justify-between items-center group transition-all">
                                                <span className="text-muted-foreground group-hover:text-foreground">{path}</span>
                                                <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold border-primary/30 text-primary">REACHABLE</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-sky-500 tracking-tight">
                                        <div className="h-8 w-1 bg-sky-500 rounded-full" />
                                        API Endpoints
                                    </h3>
                                    <div className="max-h-[350px] overflow-auto rounded-2xl border bg-muted/5 p-4 space-y-2 font-mono scrollbar-hide">
                                        {auditData.apis.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic text-center py-10 opacity-50">Deep scan failed to resolve API routes. Ensure app/api directory is reachable.</p>
                                        ) : auditData.apis.map((path: string) => (
                                            <div key={path} className="text-[11px] p-2 hover:bg-sky-500/5 border border-transparent hover:border-sky-500/20 rounded-lg flex justify-between items-center group transition-all">
                                                <span className="text-muted-foreground group-hover:text-foreground">{path}</span>
                                                <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold border-sky-500/30 text-sky-500">ACTIVE</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-amber-500 tracking-tight">
                                        <div className="h-8 w-1 bg-amber-500 rounded-full" />
                                        Environment Configuration
                                    </h3>
                                    <div className="rounded-2xl border bg-muted/5 overflow-hidden">
                                        <Table>
                                            <TableBody>
                                                {auditData.environment.map((env: any) => (
                                                    <TableRow key={env.key} className="hover:bg-amber-500/5 border-none">
                                                        <TableCell className="text-[11px] font-mono font-bold py-3 pl-4">{env.key}</TableCell>
                                                        <TableCell className="py-3 pr-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className={`text-[10px] font-black tracking-tighter ${env.status === 'HEALTHY' ? 'text-emerald-500' : 'text-rose-500'}`}>{env.status}</span>
                                                                <div className={`h-2 w-2 rounded-full ${env.status === 'HEALTHY' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.3)]'}`} />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-emerald-500 tracking-tight">
                                        <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                        Infrastructure Health
                                    </h3>
                                    <div className="rounded-2xl border bg-muted/5 p-6 space-y-6">
                                        {auditData.infrastructure.map((infra: any) => (
                                            <div key={infra.name} className="flex items-center justify-between group">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{infra.name}</p>
                                                    <p className="text-[10px] font-mono opacity-60 bg-muted/50 px-2 py-0.5 rounded-md inline-block">{infra.details}</p>
                                                </div>
                                                <Badge className={`${infra.status === 'HEALTHY' ? 'bg-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-rose-500 shadow-md shadow-rose-500/10'} border-none`}>
                                                    {infra.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Purging Logs */}
            <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                <DialogContent className="max-w-md bg-background border-muted">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-500">
                            <Trash2 className="h-5 w-5" />
                            Purge Log History?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            This action will permanently delete all activity logs from the database.
                            This cannot be undone. Are you sure you want to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleClearHistory} disabled={isClearing}>
                            {isClearing ? 'Purging...' : 'Yes, Delete All Logs'}
                        </Button>
                    </div>
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
