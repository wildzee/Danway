"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Upload, Search, Download,
    Edit, Flag
} from "lucide-react";

// Sample data
const generateSampleData = () => {
    const departments = ["Civil", "MEP", "Finishing", "Structure", "Safety"];
    const designations = ["Foreman", "Mason", "Carpenter", "Electrician", "Plumber", "Helper", "Welder", "Painter"];
    const shifts = ["Day Shift", "Night Shift"];

    return Array.from({ length: 156 }, (_, i) => ({
        id: `EMP${String(i + 1001).padStart(4, '0')}`,
        name: `Worker ${i + 1}`,
        designation: designations[Math.floor(Math.random() * designations.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        project: "D657",
        shift: shifts[Math.floor(Math.random() * shifts.length)],
        punchIn: i < 145 ? `0${6 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
        punchOut: i < 145 ? `1${6 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
        workHours: i < 145 ? `${8 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 6)}` : "0.0",
        status: i < 145 ? (i < 142 ? "Present" : "Late") : "Absent",
        hasIssue: !Boolean(i < 145 && Math.random() > 0.1),
    }));
};

export default function AttendancePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedShift, setSelectedShift] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [data] = useState(generateSampleData());
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    // Filter data
    const filteredData = data.filter(row => {
        const matchesSearch = searchQuery === "" ||
            row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.designation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDepartment === "all" || row.department === selectedDepartment;
        const matchesShift = selectedShift === "all" || row.shift === selectedShift;
        const matchesStatus = selectedStatus === "all" || row.status === selectedStatus;
        return matchesSearch && matchesDept && matchesShift && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Status counts
    const presentCount = data.filter(d => d.status === "Present").length;
    const absentCount = data.filter(d => d.status === "Absent").length;
    const lateCount = data.filter(d => d.status === "Late").length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(new Set(paginatedData.map(row => row.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedRows);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedRows(newSelected);
    };

    const handleExport = () => {
        toast.success("Report exported successfully");
    };

    const handleSubmitToSAP = () => {
        toast.success("Data submitted to SAP");
    };

    return (
        <div className="flex flex-col min-h-0">
            {/* Action Toolbar */}
            <div className="bg-background border-b px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by ID, Name, or Designation"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                <SelectItem value="Civil">Civil</SelectItem>
                                <SelectItem value="MEP">MEP</SelectItem>
                                <SelectItem value="Finishing">Finishing</SelectItem>
                                <SelectItem value="Structure">Structure</SelectItem>
                                <SelectItem value="Safety">Safety</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedShift} onValueChange={setSelectedShift}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Shifts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Shifts</SelectItem>
                                <SelectItem value="Day Shift">Day Shift</SelectItem>
                                <SelectItem value="Night Shift">Night Shift</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Late">Late</SelectItem>
                                <SelectItem value="Half Day">Half Day</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-sm px-3 py-1">Present: {presentCount}</Badge>
                        <Badge variant="secondary" className="text-sm px-3 py-1">Absent: {absentCount}</Badge>
                        <Badge variant="secondary" className="text-sm px-3 py-1">Late: {lateCount}</Badge>

                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>

                        <Button onClick={handleSubmitToSAP}>
                            <Upload className="mr-2 h-4 w-4" />
                            Sync SAP
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="p-6">
                <div className="rounded-lg border bg-background overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id))}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-24">ID</TableHead>
                                    <TableHead className="w-44">Name</TableHead>
                                    <TableHead className="w-36">Designation</TableHead>
                                    <TableHead className="w-32">Department</TableHead>
                                    <TableHead className="w-24">Project</TableHead>
                                    <TableHead className="w-32">Shift</TableHead>
                                    <TableHead className="w-28">Punch In</TableHead>
                                    <TableHead className="w-28">Punch Out</TableHead>
                                    <TableHead className="w-24">Work Hours</TableHead>
                                    <TableHead className="w-28">Status</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={`${selectedRows.has(row.id) ? 'border-l-4 border-l-primary bg-accent/50' : ''} ${!row.punchIn ? 'border-l-4 border-l-yellow-500' : ''}`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedRows.has(row.id)}
                                                onCheckedChange={(checked) => handleSelectRow(row.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{row.id}</TableCell>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs uppercase">
                                                {row.designation}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{row.department}</TableCell>
                                        <TableCell>{row.project}</TableCell>
                                        <TableCell>
                                            <Badge variant={row.shift === "Day Shift" ? "default" : "secondary"}>
                                                {row.shift}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{row.punchIn || "-"}</TableCell>
                                        <TableCell className="font-mono text-sm">{row.punchOut || "-"}</TableCell>
                                        <TableCell className="font-semibold">{row.workHours}</TableCell>
                                        <TableCell>
                                            <Select defaultValue={row.status}>
                                                <SelectTrigger className="w-28 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Present">Present</SelectItem>
                                                    <SelectItem value="Absent">Absent</SelectItem>
                                                    <SelectItem value="Late">Late</SelectItem>
                                                    <SelectItem value="Half Day">Half Day</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {!row.punchIn && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600">
                                                        <Flag className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
                <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {selectedRows.size > 0 && (
                            <>
                                <span className="text-sm text-muted-foreground">
                                    {selectedRows.size} items selected
                                </span>
                                <Button variant="outline" size="sm">
                                    Mark as Absent
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            First
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm px-4">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Last
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
