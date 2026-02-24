'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Plus, Download, Eye, DollarSign } from 'lucide-react';

interface Invoice {
    id: string;
    invoiceNumber: string;
    student: {
        user: { name: string };
        class: { name: string; section: string };
        roll: string;
    };
    feeStructure: { name: string };
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    issueDate: string;
    dueDate: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedFeeStructure, setSelectedFeeStructure] = useState('');

    useEffect(() => {
        fetchInvoices();
        fetchClasses();
        fetchFeeStructures();
    }, [filter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'ALL') {
                params.append('status', filter);
            }

            const response = await fetch(`/api/invoices?${params}`);
            const data = await response.json();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes');
            const data = await response.json();
            setClasses(data.classes || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchFeeStructures = async () => {
        try {
            const response = await fetch('/api/fee-structures');
            const data = await response.json();
            setFeeStructures(data.feeStructures || []);
        } catch (error) {
            console.error('Error fetching fee structures:', error);
        }
    };

    const handleBulkGenerate = async () => {
        if (!selectedClass || !selectedFeeStructure) {
            toast.error('Please select class and fee structure');
            return;
        }

        try {
            // Get students from selected class
            const classResponse = await fetch(`/api/classes/${selectedClass}`);
            const classData = await classResponse.json();
            const students = classData.class?.students || [];

            if (students.length === 0) {
                toast.error('No students found in selected class');
                return;
            }

            // Calculate due date (30 days from now)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            // Generate invoices for all students
            let successCount = 0;
            for (const student of students) {
                try {
                    const response = await fetch('/api/invoices', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            studentId: student.id,
                            feeStructureId: selectedFeeStructure,
                            dueDate: dueDate.toISOString(),
                        }),
                    });

                    if (response.ok) {
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Failed to generate invoice for student ${student.id}`);
                }
            }

            toast.success(`Generated ${successCount} invoices successfully`);
            setGenerateDialogOpen(false);
            fetchInvoices();
        } catch (error) {
            console.error('Error generating invoices:', error);
            toast.error('Failed to generate invoices');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            PAID: 'default',
            PENDING: 'secondary',
            PARTIALLY_PAID: 'outline',
            OVERDUE: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'secondary'}>
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invoice Management</h1>
                    <p className="text-muted-foreground">
                        Manage student fee invoices and payments
                    </p>
                </div>
                <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Generate Invoices
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Generate Invoices</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Select Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} - {cls.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Select Fee Structure</Label>
                                <Select
                                    value={selectedFeeStructure}
                                    onValueChange={setSelectedFeeStructure}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose fee structure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {feeStructures.map((fee) => (
                                            <SelectItem key={fee.id} value={fee.id}>
                                                {fee.name} - {formatCurrency(fee.totalAmount)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleBulkGenerate} className="w-full">
                                Generate for All Students
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invoices.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                                invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(
                                invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            {/* Invoices Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Fee Type</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono text-sm">
                                            {invoice.invoiceNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{invoice.student.user.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Roll: {invoice.student.roll}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.student.class.name} - {invoice.student.class.section}
                                        </TableCell>
                                        <TableCell>{invoice.feeStructure.name}</TableCell>
                                        <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                                        <TableCell className="text-green-600">
                                            {formatCurrency(invoice.paidAmount)}
                                        </TableCell>
                                        <TableCell className="text-red-600">
                                            {formatCurrency(invoice.balanceAmount)}
                                        </TableCell>
                                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {invoice.balanceAmount > 0 && (
                                                    <Button size="sm" variant="default">
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
