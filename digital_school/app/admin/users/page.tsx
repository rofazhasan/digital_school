"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, UserPlus, Edit, Trash2, Users, Shield, Loader2, CheckCircle, XCircle, LayoutDashboard, MoreHorizontal, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
    class?: string;
    section?: string;
    roll?: string;
    avatar?: string;
};

const roleLabels: Record<User['role'], string> = {
    SUPER_USER: "Super User",
    ADMIN: "Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
};

const roleColors: Record<User['role'], string> = {
    SUPER_USER: "bg-purple-100 text-purple-700 border-purple-200",
    ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
    TEACHER: "bg-green-100 text-green-700 border-green-200",
    STUDENT: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [activeRole, setActiveRole] = useState<string>("ALL");
    const [showAddUser, setShowAddUser] = useState(false);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [previewUsers, setPreviewUsers] = useState<User[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const router = useRouter();
    const [importSummary, setImportSummary] = useState<{ success: number; fail: number } | null>(null);
    const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
    const [activeUserRole, setActiveUserRole] = useState<'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | null>(null);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Form States for Add/Edit to handle conditional rendering
    const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<User['role']>('STUDENT');
    const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<User['role']>('STUDENT');

    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);

    // Permissions
    const canDelete = (targetUser: User) => {
        if (activeUserRole === 'SUPER_USER') return targetUser.id !== users.find(u => u.role === 'SUPER_USER')?.id;
        if (activeUserRole === 'ADMIN') return targetUser.role !== 'ADMIN' && targetUser.role !== 'SUPER_USER';
        return false;
    };

    const canEdit = (targetUser: User) => {
        if (activeUserRole === 'SUPER_USER') return true;
        if (activeUserRole === 'ADMIN') return targetUser.role !== 'ADMIN' && targetUser.role !== 'SUPER_USER';
        return false;
    };

    // Route Protection
    useEffect(() => {
        const checkAuth = async () => {
            // Let the existing fetch handle role loading, this is just a guard
            if (!loading && activeUserRole && activeUserRole !== 'ADMIN' && activeUserRole !== 'SUPER_USER') {
                router.push('/dashboard');
            }
        };
        checkAuth();
    }, [activeUserRole, loading, router]);

    const filteredUsers = users.filter(u =>
        (activeRole === 'ALL' || u.role === activeRole) &&
        (
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
            (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
            (u.class && u.class.toLowerCase().includes(search.toLowerCase())) ||
            (u.section && u.section.toLowerCase().includes(search.toLowerCase())) ||
            (u.roll && u.roll.toLowerCase().includes(search.toLowerCase()))
        )
    );

    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [search, activeRole]);

    useEffect(() => {
        setLoading(true);
        // Fetch Current User Role & Data
        fetch("/api/user").then(res => res.json()).then(data => {
            if (data.user) setActiveUserRole(data.user.role);
        });

        Promise.all([
            fetch("/api/user?all=true").then(res => res.json()),
            fetch("/api/classes").then(res => res.json()).catch(() => ({ classes: [] }))
        ])
            .then(([usersData, classesData]) => {
                // Handle various response structures for users
                let fetchedUsers = [];
                if (usersData.users) fetchedUsers = usersData.users;
                else if (usersData.data?.users) fetchedUsers = usersData.data.users;
                else if (Array.isArray(usersData.data)) fetchedUsers = usersData.data;
                else if (Array.isArray(usersData)) fetchedUsers = usersData;

                setUsers(fetchedUsers);

                if (!fetchedUsers.length && usersData.error) {
                    setError(usersData.error);
                }
                if (classesData.classes) {
                    setClasses(classesData.classes);
                }
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to fetch data");
            })
            .finally(() => setLoading(false));
    }, []);

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const usersResponse = await fetch('/api/user?all=true');
            const usersData = await usersResponse.json();

            let fetchedUsers = [];
            if (usersData.users) fetchedUsers = usersData.users;
            else if (usersData.data?.users) fetchedUsers = usersData.data.users;
            else if (Array.isArray(usersData.data)) fetchedUsers = usersData.data;
            else if (Array.isArray(usersData)) fetchedUsers = usersData;

            setUsers(fetchedUsers);
            setSelectedIds(new Set());
        } catch (e) {
            console.error("Failed to refresh users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelectKey = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAllPage = () => {
        if (selectedIds.size === paginatedUsers.length) {
            setSelectedIds(new Set());
        } else {
            const newSelected = new Set(selectedIds);
            paginatedUsers.forEach(u => newSelected.add(u.id));
            setSelectedIds(newSelected);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`)) return;

        setLoading(true);
        setError(null);
        try {
            const ids = Array.from(selectedIds);
            const res = await fetch(`/api/user?ids=${ids.join(',')}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Bulk delete failed');

            await refreshUsers();
        } catch (err: any) {
            setError(err.message || 'Bulk delete failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (user: any) => {
        try {
            setLoading(true);
            setError(null);
            // Ensure API expects an array
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([user]),
            });
            const data = await response.json();
            if (response.ok) {
                await refreshUsers();
                setShowAddUser(false);
                // Reset defaults
                setSelectedRoleForAdd('STUDENT');
                setShowPassword(false);
            } else {
                setError(data.error || (data.results && data.results[0]?.error) || 'Failed to add user');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to add user');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = async (user: User) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, id: user.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update user');
            await refreshUsers();
            setEditUser(null);
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/user?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete user');
            await refreshUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    // Bulk Import Logic
    const handleBulkAdd = (file: File) => {
        setLoading(true);
        setError(null);
        const reader = new FileReader();

        const processData = (data: any[]) => {
            try {
                // Normalize keys to lowercase
                const normalizedData = data.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        newRow[key.trim().toLowerCase()] = row[key];
                    });
                    return newRow;
                });

                const usersToAdd = normalizedData.filter(r => r.name && r.role && (r.email || r.phone)).map((r) => ({
                    name: r.name,
                    email: r.email,
                    phone: r.phone,
                    role: r.role.toUpperCase(), // Normalize role to match DB Enum
                    class: r.class,
                    section: r.section,
                    roll: r.roll,
                    password: r.password // Allow password import if present
                }));

                if (usersToAdd.length === 0) {
                    setError("No valid records found. Ensure columns: Name, Role, Email (or Phone).");
                    setLoading(false);
                    return;
                }

                setPreviewUsers(usersToAdd.map((u, i) => ({ ...u, id: String(i) })));
                setShowPreview(true);
            } catch (err) {
                console.error(err);
                setError("Failed to process data.");
            } finally {
                setLoading(false);
            }
        };

        reader.onload = async (e) => {
            try {
                if (file.name.endsWith('.csv')) {
                    Papa.parse(e.target?.result as string, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => processData(results.data)
                    });
                } else if (file.name.match(/\.(xlsx|xls)$/)) {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    processData(json);
                } else {
                    setError("Unsupported file format. Use CSV or Excel.");
                    setLoading(false);
                }
            } catch (e) {
                setError("Failed to read file");
                setLoading(false);
            }
        }

        if (file.name.match(/\.(xlsx|xls)$/)) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    const handleConfirmBulkAdd = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user', {
                method: 'POST',
                body: JSON.stringify(previewUsers),
            });
            const data = await res.json();
            setImportSummary({ success: data.results?.filter((r: any) => r.success).length || 0, fail: data.results?.filter((r: any) => !r.success).length || 0 });
            await refreshUsers();
            setShowBulkAdd(false);
            setShowPreview(false);
        } catch (e) { setError("Bulk add failed"); }
        setLoading(false);
    };

    // Determine Dashboard Link
    const getDashboardLink = () => {
        if (activeUserRole === 'SUPER_USER') return '/super-user/dashboard';
        if (activeUserRole === 'ADMIN') return '/admin/dashboard';
        // Fallback
        return '/dashboard';
    };

    const downloadSampleCSV = () => {
        const headers = ["Name", "Role", "Email", "Phone", "Class", "Section", "Roll", "Password"];
        const rows = [
            ["John Doe", "STUDENT", "john@example.com", "", "10", "A", "1", "Pass123!"],
            ["Jane Smith", "TEACHER", "jane@example.com", "1234567890", "", "", "", "Pass456!"],
            ["Admin User", "ADMIN", "admin@example.com", "", "", "", "", "AdminPass789!"]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "user_import_sample.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl 2xl:max-w-[95vw] space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                        <p className="text-gray-500">Manage students, teachers, admins and their permissions.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => router.push(getDashboardLink())} variant="outline" className="gap-2">
                            <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
                        </Button>
                        <Button onClick={() => setShowBulkAdd(true)} variant="secondary" className="gap-2">
                            <Upload className="h-4 w-4" /> Import
                        </Button>
                        <Button onClick={() => setShowAddUser(true)} className="gap-2 bg-primary hover:bg-primary/90">
                            <UserPlus className="h-4 w-4" /> Add User
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                    <Tabs value={activeRole} onValueChange={setActiveRole}>
                        <TabsList>
                            <TabsTrigger value="ALL">All Users</TabsTrigger>
                            <TabsTrigger value="SUPER_USER">Super Users</TabsTrigger>
                            <TabsTrigger value="ADMIN">Admins</TabsTrigger>
                            <TabsTrigger value="TEACHER">Teachers</TabsTrigger>
                            <TabsTrigger value="STUDENT">Students</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {selectedIds.size > 0 && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="animate-in fade-in zoom-in duration-200">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedIds.size})
                            </Button>
                        )}
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="max-w-[300px]"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                                        onCheckedChange={handleSelectAllPage}
                                    />
                                </TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(user.id)}
                                                onCheckedChange={() => handleToggleSelectKey(user.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{user.name}</span>
                                                    <span className="text-xs text-gray-500">{user.email || 'No email provided'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${roleColors[user.role]} border-0 capitalize`}>
                                                {roleLabels[user.role]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                {user.email && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="h-3.5 w-3.5 opacity-70" /> {user.email}
                                                    </div>
                                                )}
                                                {user.phone && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="h-3.5 w-3.5 opacity-70" /> {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {user.role === 'STUDENT' ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">Class {user.class} - {user.section}</span>
                                                    <span className="text-xs text-gray-400">Roll: {user.roll}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
                                                    onClick={() => { setEditUser(user); setSelectedRoleForEdit(user.role); }}
                                                    disabled={!canEdit(user)}
                                                    title={!canEdit(user) ? "You cannot edit this user" : "Edit Details"}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-500"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={!canDelete(user)}
                                                    title={!canDelete(user) ? "You cannot delete this user" : "Delete User"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Edit User Dialog */}
            <AnimatePresence>
                {editUser && (
                    <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit User Details</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const email = formData.get('email') as string;
                                const phone = formData.get('phone') as string;

                                if (!email && !phone) {
                                    alert("Please provide either an Email or a Phone number.");
                                    return;
                                }

                                handleEditUser({
                                    ...editUser,
                                    name: formData.get('name') as string,
                                    email: email,
                                    phone: phone,
                                    role: formData.get('role') as User['role'],
                                    class: formData.get('class')?.toString().split('-')[0],
                                    section: formData.get('class')?.toString().split('-')[1],
                                    roll: formData.get('roll') as string
                                });
                            }} className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input name="name" defaultValue={editUser.name} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email (Optional)</label>
                                        <Input name="email" defaultValue={editUser.email} type="email" placeholder="john@example.com" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Phone (Optional)</label>
                                        <Input name="phone" defaultValue={editUser.phone} placeholder="+1234567890" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        name="role"
                                        defaultValue={editUser.role}
                                        onChange={(e) => setSelectedRoleForEdit(e.target.value as User['role'])}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_USER">Super User</option>
                                    </select>
                                </div>

                                {/* Conditional Fields for Student */}
                                {selectedRoleForEdit === 'STUDENT' && (
                                    <>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Class & Section</label>
                                            <select
                                                name="class"
                                                defaultValue={editUser.class ? `${editUser.class}-${editUser.section}` : ''}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="">None</option>
                                                {classes.map(c => <option key={c.id} value={`${c.name}-${c.section}`}>{c.name} - {c.section}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Roll Number</label>
                                            <Input name="roll" defaultValue={editUser.roll} placeholder="RollNo" />
                                        </div>
                                    </>
                                )}

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Add User Dialog */}
            <AnimatePresence>
                {showAddUser && (
                    <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const email = formData.get('email') as string;
                                const phone = formData.get('phone') as string;

                                if (!email && !phone) {
                                    alert("Please provide either an Email or a Phone number.");
                                    return;
                                }

                                handleAddUser({
                                    name: formData.get('name') as string,
                                    email: email,
                                    phone: phone,
                                    role: formData.get('role') as User['role'],
                                    password: formData.get('password') as string,
                                    class: formData.get('class')?.toString().split('-')[0],
                                    section: formData.get('class')?.toString().split('-')[1],
                                    roll: formData.get('roll') as string
                                });
                            }} className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input name="name" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email (Optional)</label>
                                        <Input name="email" type="email" placeholder="john@example.com" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Phone (Optional)</label>
                                        <Input name="phone" placeholder="+1234567890" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Default Password</label>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            defaultValue="TempPass123!"
                                            placeholder="Enter password"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Default: TempPass123!</p>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        name="role"
                                        value={selectedRoleForAdd}
                                        onChange={(e) => setSelectedRoleForAdd(e.target.value as User['role'])}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_USER">Super User</option>
                                    </select>
                                </div>

                                {/* Conditional Fields for Student */}
                                {selectedRoleForAdd === 'STUDENT' && (
                                    <>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Class & Section</label>
                                            <select name="class" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">Select Class</option>
                                                {classes.map(c => <option key={c.id} value={`${c.name}-${c.section}`}>{c.name} - {c.section}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Roll Number</label>
                                            <Input name="roll" placeholder="RollNo" />
                                        </div>
                                    </>
                                )}

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
                                    <Button type="submit">Create User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {importSummary && (
                <Dialog open={!!importSummary} onOpenChange={() => setImportSummary(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <div className="flex flex-col items-center justify-center p-4">
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <h2 className="text-lg font-semibold text-center">Import Complete</h2>
                            <p className="text-center text-gray-500">
                                {importSummary.success} users added successfully.
                                {importSummary.fail > 0 && <span className="block text-red-500">{importSummary.fail} failed.</span>}
                            </p>
                            <Button className="mt-4" onClick={() => setImportSummary(null)}>Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Bulk Import Dialog */}
            <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Import Users</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 text-center p-6 border-2 border-dashed rounded-lg bg-gray-50/50">
                        <Upload className="h-10 w-10 mx-auto text-gray-400" />
                        <div className="space-y-1">
                            <h3 className="font-medium text-sm">Upload CSV or Excel File</h3>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: .csv, .xlsx, .xls
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="max-w-xs mx-auto text-xs"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    handleBulkAdd(e.target.files[0]);
                                }
                            }}
                        />
                        <div className="text-xs text-left space-y-2 mt-4 bg-blue-50 p-3 rounded text-blue-800">
                            <p className="font-semibold">Expected Columns:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Name</strong> (Required)</li>
                                <li><strong>Role</strong> (Required: Student, Teacher, Admin)</li>
                                <li><strong>Email</strong> or <strong>Phone</strong> (At least one required)</li>
                                <li><strong>Class</strong> & <strong>Section</strong> (For Students)</li>
                                <li><strong>Roll</strong> (For Students)</li>
                                <li><strong>Password</strong> (Optional)</li>
                            </ul>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadSampleCSV}
                                className="text-xs gap-2"
                            >
                                <Upload className="h-3 w-3 rotate-180" /> Download Sample CSV
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Preview Import Data ({previewUsers.length} users)</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email/Phone</TableHead>
                                    <TableHead>Class Info</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewUsers.map((u, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{u.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                {u.email && <div>{u.email}</div>}
                                                {u.phone && <div>{u.phone}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {u.role === 'STUDENT' ? (
                                                <span className="text-xs">
                                                    {u.class}-{u.section} (Roll: {u.roll})
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
                        <Button onClick={handleConfirmBulkAdd} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
