"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export function CreateExamsTab() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create New Exam</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                    <CardDescription>Set up the basic information for the exam.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="title">Exam Title</Label>
                            <Input placeholder="e.g. Physics Mid-Term 2025" />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="physics">Physics</SelectItem>
                                    <SelectItem value="math">Mathematics</SelectItem>
                                    <SelectItem value="chemistry">Chemistry</SelectItem>
                                    <SelectItem value="english">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="class">Class</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="11">Class 11</SelectItem>
                                    <SelectItem value="12">Class 12</SelectItem>
                                    <SelectItem value="10">Class 10</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date</Label>
                            <div className="relative">
                                <Input type="date" />
                            </div>
                        </div>
                        <div>
                            <Label>Time</Label>
                            <Input type="time" />
                        </div>
                        <div>
                            <Label>Duration (minutes)</Label>
                            <Input type="number" placeholder="90" />
                        </div>
                        <div>
                            <Label>Total Marks</Label>
                            <Input type="number" placeholder="100" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button size="lg">Next: Add Questions</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
