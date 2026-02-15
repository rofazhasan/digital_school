import { useState, useEffect } from 'react';
import { Plus, Trash2, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface ExamHall {
    id: string;
    name: string;
    roomNo: string;
    rows: number;
    columns: number;
    seatsPerBench: number;
    capacity: number;
}

interface HallConfiguratorProps {
    onHallsUpdate?: () => void;
    selectedHalls?: string[];
    onSelectionChange?: (ids: string[]) => void;
    onCapacityChange?: (capacity: number) => void;
}

export default function HallConfigurator({ onHallsUpdate, selectedHalls = [], onSelectionChange, onCapacityChange }: HallConfiguratorProps) {
    const [halls, setHalls] = useState<ExamHall[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Calculate capacity whenever selectedHalls or halls changes
    useEffect(() => {
        if (onCapacityChange) {
            const selected = halls.filter(h => selectedHalls.includes(h.id));
            const total = selected.reduce((sum, h) => sum + h.capacity, 0);
            onCapacityChange(total);
        }
    }, [selectedHalls, halls, onCapacityChange]);

    // Form State
    const [newHall, setNewHall] = useState({
        name: '',
        roomNo: '',
        rows: 5,
        columns: 4,
        seatsPerBench: 2
    });

    const fetchHalls = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/exam-halls');
            const data = await res.json();
            if (data.halls) {
                setHalls(data.halls);
            }
        } catch (error) {
            toast.error("Failed to load halls");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHalls();
    }, []);

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/exam-halls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHall)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Hall created successfully!");
                setIsDialogOpen(false);
                fetchHalls();
                if (onHallsUpdate) onHallsUpdate();
            } else {
                toast.error(data.error || "Failed to create hall");
            }
        } catch (e) {
            toast.error("Error creating hall");
        }
    };

    const toggleSelection = (id: string) => {
        if (!onSelectionChange) return;
        if (selectedHalls.includes(id)) {
            onSelectionChange(selectedHalls.filter(h => h !== id));
        } else {
            onSelectionChange([...selectedHalls, id]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold">Exam Halls</h3>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Hall
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Exam Hall</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hall Name</Label>
                                    <Input
                                        placeholder="e.g. Main Hall"
                                        value={newHall.name}
                                        onChange={(e) => setNewHall({ ...newHall, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Room No</Label>
                                    <Input
                                        placeholder="e.g. 101"
                                        value={newHall.roomNo}
                                        onChange={(e) => setNewHall({ ...newHall, roomNo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Rows</Label>
                                    <Input
                                        type="number"
                                        value={newHall.rows}
                                        onChange={(e) => setNewHall({ ...newHall, rows: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Columns</Label>
                                    <Input
                                        type="number"
                                        value={newHall.columns}
                                        onChange={(e) => setNewHall({ ...newHall, columns: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Seats/Bench</Label>
                                    <Input
                                        type="number"
                                        value={newHall.seatsPerBench}
                                        onChange={(e) => setNewHall({ ...newHall, seatsPerBench: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-center text-sm font-medium text-slate-600">
                                Total Capacity: {newHall.rows * newHall.columns * newHall.seatsPerBench} students
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Save Hall</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {halls.map(hall => (
                    <div
                        key={hall.id}
                        className={`
                            border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
                            ${selectedHalls.includes(hall.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}
                        `}
                        onClick={() => toggleSelection(hall.id)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900">{hall.name}</h4>
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">Room {hall.roomNo}</span>
                        </div>
                        <div className="text-xs text-slate-500 grid grid-cols-2 gap-1 mb-2">
                            <span>Rows: {hall.rows}</span>
                            <span>Cols: {hall.columns}</span>
                            <span>Bench: {hall.seatsPerBench}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                            <span className="font-bold text-indigo-700 text-sm">Cap: {hall.capacity}</span>
                            {selectedHalls.includes(hall.id) && (
                                <span className="text-xs text-indigo-600 font-semibold">Selected</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
