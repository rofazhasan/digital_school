"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, UserPlus, Edit, Trash2, Users, Shield, BookOpen, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  class?: string;
  section?: string;
  roll?: string;
};



const roleLabels: Record<User['role'], string> = {
  SUPER_USER: "Super User",
  ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
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
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [newClassData, setNewClassData] = useState({ name: '', section: '' });

  // Filter users by role and search
  const filteredUsers = users.filter(u =>
    (activeRole === 'ALL' || u.role === activeRole) &&
    (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
      (u.class && u.class.toLowerCase().includes(search.toLowerCase())) ||
      (u.section && u.section.toLowerCase().includes(search.toLowerCase())) ||
      (u.roll && u.roll.toLowerCase().includes(search.toLowerCase()))
    )
  );
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const sortedUsers = filteredUsers;
  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  // Reset page on search or role change
  useEffect(() => { setPage(1); }, [search, activeRole]);

  // Only allow admin/super_user (mock check)
  useEffect(() => {
    // TODO: Replace with real auth check
    const role: User['role'] = "ADMIN"; // or SUPER_USER
    if (role !== "ADMIN" && role !== "SUPER_USER") {
      window.location.href = "/dashboard";
      return;
    }
    setLoading(true);
    
    // Fetch users and classes in parallel
    Promise.all([
      fetch("/api/user?all=true").then(res => res.json()),
      fetch("/api/classes").then(res => res.json()).catch(() => ({ classes: [] }))
    ])
      .then(([usersData, classesData]) => {
        if (usersData.users) {
          setUsers(usersData.users);
        } else {
          setError(usersData.error || "Failed to fetch users");
        }
        if (classesData.classes) {
          setClasses(classesData.classes);
        }
      })
      .catch(() => setError("Failed to fetch data"))
      .finally(() => setLoading(false));
  }, []);

  // Handlers (replace with real API calls)
  const handleAddUser = async (user: Omit<User, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([user]), // API expects an array
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the users list
        const usersResponse = await fetch('/api/user?all=true');
        const usersData = await usersResponse.json();
        if (usersData.users) {
          setUsers(usersData.users);
        }
        setShowAddUser(false);
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      setError('Failed to add user');
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
        body: JSON.stringify({ ...user, id: user.id || String(Date.now()) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      // Refresh user list
      const usersRes = await fetch('/api/user?all=true');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      setEditUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      // Refresh user list
      const usersRes = await fetch('/api/user?all=true');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };
  const handleBulkAdd = (file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let usersToAdd: Omit<User, 'id'>[] = [];
        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(e.target?.result as string, { header: true });
          const filteredData = parsed.data.filter((row: unknown) => {
            const r = row as Record<string, unknown>;
            return r.Name && r.Email && r.Role;
          });
          usersToAdd = filteredData.map((row: unknown) => {
            const r = row as Record<string, unknown>;
            return {
              name: r.Name as string,
              email: r.Email as string,
              phone: r.Phone as string || undefined,
              role: r.Role as User['role'],
              class: r.Class as string || undefined,
              section: r.Section as string || undefined,
              roll: r.Roll as string || undefined,
            };
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const [header, ...rows] = json;
          const headerRow = header as string[];
          const nameIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'name');
          const emailIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'email');
          const roleIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'role');
          const phoneIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'phone');
          const classIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'class');
          const sectionIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'section');
          const rollIdx = headerRow.findIndex((h) => typeof h === 'string' && h.toLowerCase() === 'roll');
          usersToAdd = rows.filter((row: unknown) => {
            const r = row as unknown[];
            return r[nameIdx] && r[emailIdx] && r[roleIdx];
          })
            .map((row: unknown) => {
              const r = row as unknown[];
              return {
                name: r[nameIdx] as string,
                email: r[emailIdx] as string,
                phone: phoneIdx !== -1 ? r[phoneIdx] as string : undefined,
                role: r[roleIdx] as User['role'],
                class: classIdx !== -1 ? r[classIdx] as string : undefined,
                section: sectionIdx !== -1 ? r[sectionIdx] as string : undefined,
                roll: rollIdx !== -1 ? r[rollIdx] as string : undefined,
              };
            });
        } else {
          setError('Only CSV or Excel files are supported.');
          setLoading(false);
          return;
        }
        setPreviewUsers(usersToAdd.map((user, index) => ({ ...user, id: String(index) })));
        setShowPreview(true);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Bulk add failed');
        setLoading(false);
      }
    };
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleConfirmBulkAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewUsers.map((u, i) => ({ ...u, id: typeof u.id === 'string' ? u.id : String(i) }))),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk add failed');
      if (data.results) {
        const successCount = data.results.filter((r: { success: boolean }) => r.success).length;
        const failCount = data.results.length - successCount;
        setImportSummary({ success: successCount, fail: failCount });
      }
      const usersRes = await fetch('/api/user?all=true');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      setShowBulkAdd(false);
      setShowPreview(false);
      setPreviewUsers([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk add failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/60 p-4 md:p-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 drop-shadow-lg">
            <Users className="h-7 w-7 text-primary" /> User Management
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkAdd(true)} variant="outline" className="shadow-md flex items-center gap-2">
              <Upload className="h-4 w-4" /> Bulk Add
            </Button>
            <Button onClick={() => setShowAddUser(true)} className="shadow-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Add User
            </Button>
            <Button onClick={() => router.push("/")} className="shadow-md flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Home
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <Tabs value={activeRole} onValueChange={setActiveRole} className="">
            <TabsList className="bg-background/80 shadow rounded-lg">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="SUPER_USER">Super Users</TabsTrigger>
              <TabsTrigger value="ADMIN">Admins</TabsTrigger>
              <TabsTrigger value="TEACHER">Teachers</TabsTrigger>
              <TabsTrigger value="STUDENT">Students</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or class..."
            className="max-w-xs rounded shadow border"
          />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12 text-lg text-muted-foreground">
              <Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading users...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <Table className="rounded-2xl shadow-2xl bg-background/80 backdrop-blur-md border border-border">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/60 to-background/80">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: User) => (
                  <TableRow key={user.id} className="hover:scale-[1.01] hover:shadow-xl transition-transform duration-200">
                    <TableCell className="font-semibold flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${user.role === 'SUPER_USER' ? 'text-purple-500' : user.role === 'ADMIN' ? 'text-blue-500' : user.role === 'TEACHER' ? 'text-green-500' : 'text-yellow-500'}`} />
                      {user.name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className="text-xs px-2 py-1 rounded shadow" variant="outline">{roleLabels[user.role] || user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{user.role === 'STUDENT' ? user.class : '-'}</TableCell>
                    <TableCell>{user.role === 'STUDENT' ? user.section : '-'}</TableCell>
                    <TableCell>{user.role === 'STUDENT' ? user.roll : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="hover:bg-primary/10" onClick={() => setEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-red-100 hover:text-red-600" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedUsers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No users found for this search/role.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length === 0 ? 0 : (page - 1) * pageSize + 1}
              -{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex gap-2 items-center justify-center">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Prev
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add User Dialog */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogContent className="max-w-md rounded-2xl shadow-2xl border border-border bg-background/90">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={e => {
                  e.preventDefault();
                  const form = e.target as typeof e.target & { name: { value: string }; email: { value: string }; role: { value: User['role'] }; class?: { value: string }; section?: { value: string }; phone?: { value: string }; roll?: { value: string } };
                  handleAddUser({
                    name: form.name.value,
                    email: form.email.value,
                    phone: form.phone?.value || undefined,
                    role: form.role.value,
                    class: form.class?.value || undefined,
                    section: form.section?.value || undefined,
                    roll: form.roll?.value || undefined,
                  });
                }}>
                  <Input name="name" placeholder="Full Name" required className="rounded shadow" />
                  <Input name="email" placeholder="Email" type="email" required className="rounded shadow" />
                  <Input name="phone" placeholder="Phone Number" className="rounded shadow" />
                  <select name="role" className="w-full rounded shadow p-2 border" required>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_USER">Super User</option>
                  </select>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class (if student)</label>
                    <div className="flex gap-2">
                      <select 
                        name="class" 
                        className="flex-1 rounded shadow p-2 border"
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setShowClassSelector(true);
                          }
                        }}
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.name}>
                            {cls.name} - {cls.section}
                          </option>
                        ))}
                        <option value="new">+ Create New Class</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Section (if student)</label>
                    <Input name="section" placeholder="Section" className="rounded shadow" />
                  </div>
                  <Input name="roll" placeholder="Roll (if student)" className="rounded shadow" />
                  <DialogFooter>
                    <Button type="submit" className="w-full shadow-lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding User...
                        </>
                      ) : (
                        'Add User'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Dialog */}
      <AnimatePresence>
        {editUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
              <DialogContent className="max-w-md rounded-2xl shadow-2xl border border-border bg-background/90">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                {editUser && (
                  <form className="space-y-4" onSubmit={e => {
                    if (!editUser) return;
                    e.preventDefault();
                    const form = e.target as typeof e.target & { name: { value: string }; email: { value: string }; role: { value: User['role'] }; class?: { value: string }; section?: { value: string }; phone?: { value: string }; roll?: { value: string } };
                    handleEditUser({
                      ...editUser,
                      id: editUser.id || String(Date.now()),
                      name: form.name.value,
                      email: form.email.value,
                      phone: form.phone?.value || undefined,
                      role: form.role.value,
                      class: form.class?.value || undefined,
                      section: form.section?.value || undefined,
                      roll: form.roll?.value || undefined,
                    });
                  }}>
                    <Input name="name" defaultValue={editUser?.name} placeholder="Full Name" required className="rounded shadow" />
                    <Input name="email" defaultValue={editUser?.email} placeholder="Email" type="email" required className="rounded shadow" />
                    <Input name="phone" defaultValue={editUser?.phone} placeholder="Phone Number" className="rounded shadow" />
                    <select name="role" defaultValue={editUser?.role} className="w-full rounded shadow p-2 border" required>
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_USER">Super User</option>
                    </select>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Class (if student)</label>
                      <div className="flex gap-2">
                        <select 
                          name="class" 
                          defaultValue={editUser?.class}
                          className="flex-1 rounded shadow p-2 border"
                          onChange={(e) => {
                            if (e.target.value === 'new') {
                              setShowClassSelector(true);
                            }
                          }}
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.name}>
                              {cls.name} - {cls.section}
                            </option>
                          ))}
                          <option value="new">+ Create New Class</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Section (if student)</label>
                      <Input name="section" defaultValue={editUser?.section} placeholder="Section" className="rounded shadow" />
                    </div>
                    <Input name="roll" defaultValue={editUser?.roll} placeholder="Roll (if student)" className="rounded shadow" />
                    <DialogFooter>
                      <Button type="submit" className="w-full shadow-lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Selector Dialog */}
      <AnimatePresence>
        {showClassSelector && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={showClassSelector} onOpenChange={setShowClassSelector}>
              <DialogContent className="max-w-md rounded-2xl shadow-2xl border border-border bg-background/90">
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const formData = new FormData(e.currentTarget);
                    const className = formData.get('className') as string;
                    const section = formData.get('section') as string;
                    
                    const response = await fetch('/api/classes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: className, section }),
                    });
                    
                    if (response.ok) {
                      const newClass = await response.json();
                      setClasses([...classes, newClass]);
                      setShowClassSelector(false);
                      // Update the class select in the add user form
                      const classSelect = document.querySelector('select[name="class"]') as HTMLSelectElement;
                      if (classSelect) {
                        classSelect.value = className;
                      }
                    } else {
                      setError('Failed to create class');
                    }
                  } catch (error) {
                    setError('Failed to create class');
                  }
                }}>
                  <Input name="className" placeholder="Class Name (e.g., 10A)" required className="rounded shadow" />
                  <Input name="section" placeholder="Section (e.g., A)" required className="rounded shadow" />
                  <DialogFooter>
                    <Button type="submit" className="w-full shadow-lg">Create Class</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Add Dialog */}
      <AnimatePresence>
        {showBulkAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
              <DialogContent className="max-w-lg rounded-2xl shadow-2xl border border-border bg-background/90">
                <DialogHeader>
                  <DialogTitle>Bulk Add Users from CSV/Excel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="bg-muted/60 rounded p-3 text-sm">
                    <b>Instructions:</b>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Prepare a CSV or Excel file with columns: <b>Name, Email, Phone, Role, Class, Section, Roll</b> (Class/Section/Roll are only for students).</li>
                      <li>Accepted roles: STUDENT, TEACHER, ADMIN, SUPER_USER.</li>
                      <li>Example row: <code>Jane Doe, jane@email.com, STUDENT, 10A, 1</code></li>
                      <li>Upload your file below and click <b>Upload</b>.</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-2 mr-2"
                    onClick={() => router.push("/")}
                  >
                    Home
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-2"
                    onClick={() => {
                      const csv = 'Name,Email,Phone,Role,Class,Section,Roll\nJohn Doe,john@email.com,1234567890,STUDENT,10A,1,1\nJane Smith,jane@email.com,5551234567,TEACHER,,,,\nAlex Lee,alex@email.com,9876543210,STUDENT,9B,2,2\n';
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'user-bulk-template.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download CSV Template
                  </Button>
                  <input type="file" accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="block w-full" onChange={e => { if (e.target.files && e.target.files[0]) handleBulkAdd(e.target.files[0]); }} />
                  {loading && <div className="flex items-center gap-2 text-primary"><Loader2 className="animate-spin h-4 w-4" /> Uploading...</div>}
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Table */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="mb-4 bg-background/90 border rounded-xl shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Preview Users to Import</div>
              <Button size="sm" variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Roll</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewUsers.map((u, i) => (
                    <TableRow key={typeof u.id === 'string' ? u.id : String(i)}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.phone || '-'}</TableCell>
                      <TableCell>{u.class}</TableCell>
                      <TableCell>{u.section}</TableCell>
                      <TableCell>{u.roll || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmBulkAdd} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Import'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Summary Dialog */}
      <AnimatePresence>
        {importSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="bg-background rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs w-full border">
              {importSummary.fail === 0 ? (
                <CheckCircle className="h-12 w-12 text-green-500 mb-2 animate-bounce" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500 mb-2 animate-bounce" />
              )}
              <div className="text-xl font-bold mb-1">
                {importSummary.fail === 0 ? 'Import Successful!' : 'Import Completed'}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {importSummary.success} user{importSummary.success !== 1 ? 's' : ''} added.<br />
                {importSummary.fail > 0 && (
                  <span className="text-red-500">{importSummary.fail} failed.</span>
                )}
              </div>
              <Button onClick={() => setImportSummary(null)} className="w-full mt-2">Close</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
