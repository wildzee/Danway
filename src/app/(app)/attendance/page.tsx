"use client";

import React, { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Upload,
    Download,
    Search,
    Edit,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    UserX,
    Clock,
    Loader2,
    Calendar as CalendarIcon,
    Calculator,
    AlertTriangle,
    Check,
    X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    project: string;
    network: string;
    activity: string;
    element: string;
    status: string;
}

interface AttendanceData {
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    punchIn: string | null;
    punchOut: string | null;
    hours: number;
    ot: number;
    status: string;
    needsReview?: boolean;
    remarks?: string | null;
}

export default function AttendancePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedShift, setSelectedShift] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [punchData, setPunchData] = useState<AttendanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isImportingPunch, setIsImportingPunch] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isCalculating, setIsCalculating] = useState(false);
    const punchFileInputRef = useRef<HTMLInputElement>(null);

    const itemsPerPage = 10;

    // Edit Mode State
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ hours: number; ot: number }>({ hours: 0, ot: 0 });

    // Fetch employees on mount
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Fetch attendance data when date changes
    useEffect(() => {
        fetchAttendanceData();
    }, [selectedDate]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/employees/import");
            const result = await response.json();
            if (response.ok && result.success) {
                setEmployees(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    // Fetch attendance data for selected date
    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            // Fetch all employees first
            const employeesResponse = await fetch("/api/employees/import");
            const employeesResult = await employeesResponse.json();
            const allEmployees = employeesResult.data || [];

            // Fetch punch records for selected date
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const punchResponse = await fetch(
                `/api/punch/records?date=${formattedDate}`
            );
            const punchResult = await punchResponse.json();
            const punchRecords = punchResult.data || [];

            // Fetch attendance records for selected date
            const attendanceResponse = await fetch(
                `/api/attendance/records?date=${formattedDate}`
            );
            const attendanceResult = await attendanceResponse.json();
            const attendanceRecords = attendanceResult?.data || [];

            // ... (rest of mapping logic) ...

            // Combine data for display
            const combinedData: AttendanceData[] = allEmployees.map((emp: Employee) => {
                const punch = punchRecords.find((p: { employee?: { employeeId: string } }) => p.employee?.employeeId === emp.employeeId);

                // Find attendance records for this employee
                const normalRecord = attendanceRecords.find(
                    (a: { employee?: { employeeId: string }; aaType: string }) => a.employee?.employeeId === emp.employeeId && a.aaType === "0600"
                );
                const otRecord = attendanceRecords.find(
                    (a: { employee?: { employeeId: string }; aaType: string }) => a.employee?.employeeId === emp.employeeId && a.aaType === "0801"
                );

                let status = "Absent";

                // If there is ANY punch or hours, they are NOT Absent
                if (punch || normalRecord?.hours > 0) {
                    const hours = normalRecord?.hours || 0;
                    const punchInHour = punch?.punchIn ? parseInt(punch.punchIn.split(':')[0]) : -1;
                    const punchInMinute = punch?.punchIn ? parseInt(punch.punchIn.split(':')[1]) : 0;

                    // Check logic for specific statuses (Late/Half Day are subsets of Present, NOT Absent)
                    if (hours > 0 && hours < 5) {
                        status = "Half Day";
                    } else if (punch?.punchIn) {
                        // Late calculated if punched in after 8:00 AM for Day Shift
                        // OR after 8:00 PM (20:00) for Night Shift
                        const isDayShift = punchInHour >= 5 && punchInHour < 17;

                        if (isDayShift && (punchInHour > 8 || (punchInHour === 8 && punchInMinute > 15))) {
                            status = "Late";
                        } else if (!isDayShift && (punchInHour > 20 || (punchInHour === 20 && punchInMinute > 15))) {
                            status = "Late";
                        } else {
                            status = "Present";
                        }
                    } else {
                        status = "Present";
                    }
                }
                // Else remains "Absent" only if NO punch and NO hours

                return {
                    employeeId: emp.employeeId,
                    name: emp.name,
                    designation: emp.designation,
                    shift: normalRecord?.shift || punch?.employee?.shift || emp.shift,
                    punchIn: punch?.punchIn || null,
                    punchOut: punch?.punchOut || null,
                    hours: normalRecord?.hours || 0,
                    ot: otRecord?.hours || 0,
                    status: status,
                    needsReview: normalRecord?.needsReview || false,
                    remarks: normalRecord?.remarks || null,
                };
            });

            setPunchData(combinedData);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast.error("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    };

    // Show import result toast and trigger calculation
    const handleImportResult = async (result: { data?: { processedCount?: number; skippedEmployees?: number; skippedEmployeeIds?: string[]; dateRange?: { start: string; end: string }; metrics?: { totalRowsInFile: number; validRowsParsed: number; invalidRowsSkipped: number } } }) => {
        const skippedCount = result.data?.skippedEmployees || 0;
        const skippedIds = result.data?.skippedEmployeeIds || [];

        if (skippedCount > 0) {
            const displayIds = skippedIds.slice(0, 5).join(', ');
            const remaining = skippedCount > 5 ? ` and ${skippedCount - 5} more` : '';
            toast.warning(
                `⚠️ Imported ${result.data?.processedCount || 0} punch records. ${skippedCount} employees not yet in master data (will link when added): ${displayIds}${remaining}`
            );
        } else {
            const dateRange = result.data?.dateRange;
            const metrics = result.data?.metrics;
            const rangeStr = dateRange?.start && dateRange?.end ? ` (${dateRange.start} to ${dateRange.end})` : '';
            const metricStr = metrics
                ? `\n📊 File: ${metrics.totalRowsInFile} rows. Parsed: ${metrics.validRowsParsed}. Skipped/Invalid: ${metrics.invalidRowsSkipped}.`
                : '';
            toast.success(`✅ Imported ${result.data?.processedCount || 0} punch records!${rangeStr}${metricStr}`);
        }

        if (result.data?.dateRange?.start && result.data?.dateRange?.end) {
            await handleCalculate({ start: result.data.dateRange.start, end: result.data.dateRange.end });
        }
    };

    // Handle punch data import — tries Vercel Blob (production), falls back to direct upload (local)
    const handlePunchImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingPunch(true);

        try {
            type ImportResult = { data?: { processedCount?: number; skippedEmployees?: number; skippedEmployeeIds?: string[]; dateRange?: { start: string; end: string }; metrics?: { totalRowsInFile: number; validRowsParsed: number; invalidRowsSkipped: number } } };
            let result: ImportResult | null = null;

            const isLocal = typeof window !== "undefined" &&
                (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

            if (!isLocal) {
                // Production: use Vercel Blob to bypass 4.5 MB serverless limit
                const blob = await upload(file.name, file, {
                    access: "public",
                    handleUploadUrl: "/api/punch/blob-token",
                    multipart: true,
                });

                const response = await fetch("/api/punch/process", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ blobUrl: blob.url, fileName: file.name }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    let errorMsg = "Import failed";
                    try { errorMsg = JSON.parse(text).error || errorMsg; } catch { /* ignore */ }
                    toast.error(`❌ ${errorMsg}`);
                    return;
                }
                result = await response.json();
            } else {
                // Local: direct upload — no size limit, no Vercel Blob needed
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/punch/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const text = await response.text();
                    let errorMsg = "Import failed";
                    try { errorMsg = JSON.parse(text).error || errorMsg; } catch { /* ignore */ }
                    toast.error(`❌ ${errorMsg}`);
                    return;
                }
                result = await response.json();
            }

            if (result) await handleImportResult(result);
        } catch (error) {
            console.error("Import error:", error);
            toast.error("❌ Failed to import punch data");
        } finally {
            setIsImportingPunch(false);
            if (punchFileInputRef.current) {
                punchFileInputRef.current.value = "";
            }
        }
    };

    // Handle attendance calculation
    const handleCalculate = async (dateRange?: { start: string, end: string }) => {
        setIsCalculating(true);
        try {
            const body = dateRange
                ? { startDate: dateRange.start, endDate: dateRange.end }
                : { date: format(selectedDate, 'yyyy-MM-dd') };

            const response = await fetch('/api/attendance/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`✅ Calculated attendance for ${result.recordsCreated} records`);
                await fetchAttendanceData(); // Refresh attendance data
            } else {
                toast.error(`❌ Calculation failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Calculation error:", error);
            toast.error("❌ Failed to calculate attendance");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditValues({ hours: 0, ot: 0 });
    };

    const handleSaveEdit = async (employeeId: string) => {
        try {
            // Optimistic update
            setPunchData(prev => prev.map(rec =>
                rec.employeeId === employeeId ? { ...rec, hours: editValues.hours, ot: editValues.ot } : rec
            ));

            // Update Hours
            await fetch('/api/attendance/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    type: 'hours',
                    value: editValues.hours
                })
            });

            // Update OT
            await fetch('/api/attendance/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    type: 'ot',
                    value: editValues.ot
                })
            });

            toast.success("Updated successfully");
            setEditingRowId(null);
        } catch (error) {
            console.error("Save edit error:", error);
            toast.error("Failed to save changes");
            fetchAttendanceData(); // Revert
        }
    };

    // Filter data - use punchData for attendance view
    const filteredData = punchData.filter((data) => {
        const matchesSearch =
            data.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.designation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesShift = selectedShift === "all" || data.shift.toLowerCase() === selectedShift.toLowerCase();
        const matchesStatus = selectedStatus === "all" || data.status.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesShift && matchesStatus;
    });

    // Calculate statistics from punchData
    const stats = {
        total: punchData.length,
        // Present includes everyone who is NOT absent (Present + Late + Half Day)
        present: punchData.filter((d) => d.status !== "Absent").length,
        absent: punchData.filter((d) => d.status === "Absent").length,
        late: punchData.filter((d) => d.status === "Late").length,
    };

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Attendance Management</h1>
                    <p className="text-sm text-muted-foreground">D657 Daralhai - Civil</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {format(selectedDate, "MMM dd, yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Calculate Button */}
                    <Button
                        onClick={() => handleCalculate()}
                        disabled={isCalculating}
                        className="gap-2"
                    >
                        {isCalculating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                        ) : (
                            <>
                                <Calculator className="h-4 w-4" />
                                Calculate
                            </>
                        )}
                    </Button>

                    <input
                        ref={punchFileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handlePunchImport}
                        className="hidden"
                    />
                    <Button
                        onClick={() => punchFileInputRef.current?.click()}
                        disabled={isImportingPunch}
                        variant="outline"
                    >
                        {isImportingPunch ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Punch Data
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={() => {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                        window.location.href = `/api/attendance/export?date=${dateStr}`;
                    }}>
                        <Download className="mr-2 h-4 w-4" />
                        Export SAP Format
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Employees</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Present</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.present}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                            <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Absent</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Late</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {stats.late}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID, Name, or Designation"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Shifts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            <SelectItem value="Day shift">Day Shift</SelectItem>
                            <SelectItem value="Night shift">Night Shift</SelectItem>
                            <SelectItem value="Day&Night">Day & Night</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="half day">Half Day</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[90px]">ID</TableHead>
                                <TableHead className="w-[150px]">Name</TableHead>
                                <TableHead className="w-[130px]">Designation</TableHead>
                                <TableHead className="w-[140px]">Shift</TableHead>
                                <TableHead className="w-[90px]">Punch In</TableHead>
                                <TableHead className="w-[90px]">Punch Out</TableHead>
                                <TableHead className="w-[70px]">Hours</TableHead>
                                <TableHead className="w-[70px]">OT</TableHead>
                                <TableHead className="w-[110px]">Status</TableHead>
                                <TableHead className="w-[60px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground mt-2">Loading employees...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        {employees.length === 0
                                            ? "No employees found. Import employees to get started."
                                            : "No employees match your search criteria."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((data, index) => (
                                    <TableRow key={`${data.employeeId}-${index}`}>
                                        <TableCell className="font-mono text-xs">{data.employeeId}</TableCell>
                                        <TableCell className="font-medium text-sm truncate max-w-[150px]">{data.name}</TableCell>
                                        <TableCell className="text-xs truncate max-w-[130px]" title={data.designation}>{data.designation}</TableCell>
                                        <TableCell>
                                            <Select defaultValue={data.shift || "Day shift"}>
                                                <SelectTrigger className="h-8 w-[110px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Day shift">Day Shift</SelectItem>
                                                    <SelectItem value="Night shift">Night Shift</SelectItem>
                                                    <SelectItem value="Day&Night">Day & Night</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{data.punchIn || "--:--"}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {data.punchOut ? (
                                                data.punchOut
                                            ) : data.punchIn ? (
                                                <div className="flex items-center gap-1 text-orange-600">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>Missing</span>
                                                </div>
                                            ) : (
                                                "--:--"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingRowId === data.employeeId ? (
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={editValues.hours}
                                                    onChange={(e) => setEditValues({ ...editValues, hours: parseFloat(e.target.value) || 0 })}
                                                    className="h-8 w-16 px-1 py-0 text-xs font-mono text-center border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-mono text-xs font-semibold">{data.hours > 0 ? data.hours : "--"}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingRowId === data.employeeId ? (
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={editValues.ot}
                                                    onChange={(e) => setEditValues({ ...editValues, ot: parseFloat(e.target.value) || 0 })}
                                                    className="h-8 w-16 px-1 py-0 text-xs font-mono text-center text-orange-600 border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                                                />
                                            ) : (
                                                <span className="font-mono text-xs font-semibold text-orange-600">{data.ot > 0 ? data.ot : "--"}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${data.status === "Present" ? "bg-green-600" :
                                                    data.status === "Absent" ? "bg-red-600" :
                                                        data.status === "Late" ? "bg-orange-600" :
                                                            data.status === "Half Day" ? "bg-yellow-600" : "bg-gray-600"
                                                    }`} />
                                                <span className={`text-xs font-medium ${data.status === "Present" ? "text-green-700" :
                                                    data.status === "Absent" ? "text-red-700" :
                                                        data.status === "Late" ? "text-orange-700" :
                                                            data.status === "Half Day" ? "text-yellow-700" : "text-gray-700"
                                                    }`}>
                                                    {data.status}
                                                </span>
                                            </div>

                                        </TableCell>
                                        <TableCell className="text-right">
                                            {editingRowId === data.employeeId ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleSaveEdit(data.employeeId)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-slate-100"
                                                    onClick={() => {
                                                        setEditingRowId(data.employeeId);
                                                        setEditValues({ hours: data.hours, ot: data.ot });
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table >
                </div >

                {/* Results Summary */}
                {
                    !loading && filteredData.length > 0 && (
                        <div className="border-t px-4 py-3">
                            <div className="text-sm text-muted-foreground">
                                Showing {filteredData.length} {filteredData.length === 1 ? "employee" : "employees"}
                            </div>
                        </div>
                    )
                }
            </Card >
        </div >
    );
}
