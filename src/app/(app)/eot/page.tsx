"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    Download,
    Search,
    Clock,
    Loader2,
    Calendar as CalendarIcon,
    CheckCircle2,
    CheckSquare,
    X,
    Edit,
    Check,
    Plus,
    Trash2,
    ChevronsUpDown,
    PencilLine,
    AlertTriangle,
    FileSpreadsheet,
    Calculator
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
}

interface EOTRecord {
    id: string; // The AttendanceRecord ID used for approval
    employeeId: string;
    employee: {
        employeeId: string;
        name: string;
        designation: string;
    };
    shift: string;
    hours: number;
    remarks: string | null;
    needsReview: boolean;
    date: string; // Added date field
}

export default function EOTPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [shiftFilter, setShiftFilter] = useState("all");
    
    const [records, setRecords] = useState<EOTRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Bulk Actions State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Inline Edit State
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ hours: number; remarks: string }>({ hours: 0, remarks: "" });

    // Manul Add State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    const [manualForm, setManualForm] = useState({ employeeId: "", hours: "", remarks: "", date: "" });

    // Bulk Edit State
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isSubmittingBulkEdit, setIsSubmittingBulkEdit] = useState(false);
    const [bulkEditForm, setBulkEditForm] = useState({ hours: "", remarks: "" });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (dateRange?.from) {
            fetchEOTRecords();
        }
    }, [dateRange]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/employees/import");
            const result = await response.json();
            if (response.ok && result.success) {
                setEmployees(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchEOTRecords = async () => {
        setLoading(true);
        setSelectedIds(new Set()); // Clear selection on fetch
        try {
            const startStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
            const endStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
            
            if (!startStr) return;

            const response = await fetch(`/api/eot/records?startDate=${startStr}&endDate=${endStr}`);
            const result = await response.json();
            
            if (response.ok && result.success) {
                setRecords(result.data || []);
            } else {
                toast.error("Failed to load EOT records");
            }
        } catch (error) {
            console.error("Error fetching EOT records:", error);
            toast.error("Failed to load EOT records");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveSelected = async () => {
        if (selectedIds.size === 0) return;
        setIsApproving(true);
        
        try {
            const response = await fetch('/api/eot/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordIds: Array.from(selectedIds) })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success(`✅ Successfully approved ${result.count} records`);
                fetchEOTRecords();
            } else {
                toast.error(`❌ Approval failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Failed to approve records");
        } finally {
            setIsApproving(false);
        }
    };

    const handleRejectSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to permanently delete these ${selectedIds.size} EOT records?`)) return;
        
        setIsRejecting(true);
        try {
            const response = await fetch('/api/eot/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordIds: Array.from(selectedIds) })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success(`🗑️ Successfully deleted ${result.count} rejected records`);
                fetchEOTRecords();
            } else {
                toast.error(`❌ Rejection failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Failed to reject records");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleBulkEditSubmit = async () => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one record to bulk edit.");
            return;
        }
        if (!bulkEditForm.hours && !bulkEditForm.remarks) {
            toast.error("Please provide hours or remarks to update.");
            return;
        }

        setIsSubmittingBulkEdit(true);
        try {
            const updatePayload: any = { recordIds: Array.from(selectedIds) };
            if (bulkEditForm.hours) updatePayload.hours = parseFloat(bulkEditForm.hours);
            if (bulkEditForm.remarks.trim() !== "") updatePayload.remarks = bulkEditForm.remarks;

            const response = await fetch('/api/eot/update-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success(`✏️ Successfully updated ${result.count} records`);
                setIsBulkEditDialogOpen(false);
                setBulkEditForm({ hours: "", remarks: "" });
                fetchEOTRecords();
            } else {
                toast.error(`❌ Bulk edit failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Bulk edit error:", error);
            toast.error("Failed to update records");
        } finally {
            setIsSubmittingBulkEdit(false);
        }
    };

    const handleCalculate = async () => {
        if (!dateRange?.from) return;
        setIsCalculating(true);
        try {
            const startStr = format(dateRange.from, 'yyyy-MM-dd');
            const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
            
            const body = { startDate: startStr, endDate: endStr };

            const response = await fetch('/api/attendance/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`✅ Synced punches & calculated EOT for ${result.recordsCreated} records`);
                fetchEOTRecords();
            } else {
                toast.error(`❌ Calculation failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Calculate error:", error);
            toast.error("❌ Failed to calculate records");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleDeleteRecord = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete the EOT record for ${name}?`)) return;
        
        try {
            const response = await fetch('/api/eot/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordIds: [id] })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success(`🗑️ Successfully deleted record`);
                fetchEOTRecords();
            } else {
                toast.error(`❌ Deletion failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Deletion error:", error);
            toast.error("Failed to delete record");
        }
    };

    // Edit Handlers
    const handleSaveEdit = async (recordId: string) => {
        try {
            // Optimistic update
            setRecords(prev => prev.map(rec =>
                rec.id === recordId ? { ...rec, hours: editValues.hours, remarks: editValues.remarks } : rec
            ));

            const response = await fetch('/api/eot/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordId: recordId,
                    hours: editValues.hours,
                    remarks: editValues.remarks || null
                })
            });
            
            if (response.ok) {
                toast.success("Updated EOT record successfully");
            } else {
                toast.error("Failed to save changes across database");
                fetchEOTRecords(); // Revert
            }
        } catch (error) {
            console.error("Save edit error:", error);
            toast.error("Failed to save changes");
            fetchEOTRecords(); // Revert
        } finally {
            setEditingRowId(null);
        }
    };

    // Manual Add Submit
    const handleManualSubmit = async () => {
        if (!manualForm.employeeId || !manualForm.hours) {
            toast.error("Employee and Hours are required");
            return;
        }

        setIsSubmittingManual(true);
        try {
            const response = await fetch('/api/eot/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: manualForm.employeeId,
                    date: manualForm.date || (dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
                    hours: parseFloat(manualForm.hours),
                    remarks: manualForm.remarks || null
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success("Created Manual EOT record");
                setIsAddDialogOpen(false);
                setManualForm({ employeeId: "", hours: "", remarks: "", date: "" });
                fetchEOTRecords();
            } else {
                toast.error(`Error: ${result.error || "Failed to create"}`);
            }
        } catch (error) {
            console.error("Manual add error:", error);
            toast.error("Failed to create manual entry");
        } finally {
            setIsSubmittingManual(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredRecords.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecords.map(r => r.id)));
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleExportEOT = () => {
        if (!dateRange?.from) return;
        const startStr = format(dateRange.from, 'yyyy-MM-dd');
        const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
        window.location.href = `/api/eot/export?startDate=${startStr}&endDate=${endStr}`;
    };

    // Filter logic
    const filteredRecords = records.filter((r) => {
        const matchesSearch =
            r.employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.employee.designation.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            statusFilter === "all" || 
            (statusFilter === "pending" && r.needsReview) || 
            (statusFilter === "approved" && !r.needsReview);

        const matchesShift = 
            shiftFilter === "all" || 
            r.shift.toLowerCase() === shiftFilter.toLowerCase();
            
        return matchesSearch && matchesStatus && matchesShift;
    });

    const pendingRecords = filteredRecords.filter(r => r.needsReview);
    const approvedCount = records.filter(r => !r.needsReview).length;
    const pendingCount = records.filter(r => r.needsReview).length;

    return (
        <div className="flex flex-col gap-6 p-6">
               <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-blue-600" />
                        Extra Overtime (EOT)
                    </h1>
                    <p className="text-slate-500 mt-2">Manage, approve, and export Extra Overtime records</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"
                    >
                        {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4 text-blue-600" />}
                        Calculate EOT
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleExportEOT}
                        className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                        Export to SAP
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Add EOT Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Manual EOT Entry</DialogTitle>
                                <DialogDescription>
                                    Add an extra overtime record. It will start as pending approval.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date</label>
                                    <Input 
                                        type="date" 
                                        value={manualForm.date || (dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))}
                                        onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Employee</label>
                                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isComboboxOpen}
                                                className="w-full justify-between font-normal text-muted-foreground"
                                            >
                                                {manualForm.employeeId
                                                    ? (() => {
                                                        const emp = employees.find((e) => e.employeeId === manualForm.employeeId);
                                                        return emp ? <span className="text-foreground">{emp.employeeId} - {emp.name}</span> : "Select employee...";
                                                    })()
                                                    : "Search employee by ID or Name..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[380px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search employee ID or Name..." />
                                                <CommandList>
                                                    <CommandEmpty>No employee found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {employees.map((emp) => (
                                                            <CommandItem
                                                                key={emp.employeeId}
                                                                value={`${emp.employeeId} ${emp.name}`}
                                                                onSelect={() => {
                                                                    setManualForm({ ...manualForm, employeeId: emp.employeeId });
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        manualForm.employeeId === emp.employeeId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {emp.employeeId} - {emp.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hours</label>
                                    <Input 
                                        type="number" 
                                        step="0.5" 
                                        min="0"
                                        placeholder="e.g. 2.5"
                                        value={manualForm.hours}
                                        onChange={(e) => setManualForm({...manualForm, hours: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Remarks</label>
                                    <Input 
                                        placeholder="Optional description"
                                        value={manualForm.remarks}
                                        onChange={(e) => setManualForm({...manualForm, remarks: e.target.value})}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button 
                                    onClick={handleManualSubmit}
                                    disabled={isSubmittingManual}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isSubmittingManual && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Record
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Date Range Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("gap-2", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total EOT Records</p>
                            <p className="text-2xl font-bold">{records.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                            <CheckSquare className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Approval</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {pendingCount}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Approved</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {approvedCount}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-3 flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by Employee name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={shiftFilter} onValueChange={setShiftFilter}>
                        <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Shift" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            <SelectItem value="Day shift">Day Shift</SelectItem>
                            <SelectItem value="Night shift">Night Shift</SelectItem>
                            <SelectItem value="Day&Night">Day & Night</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Actions Bar */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">EOT Records</CardTitle>
                        <CardDescription>
                            Showing {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}.
                        </CardDescription>
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        variant="outline"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                                    >
                                        <PencilLine className="h-4 w-4"/>
                                        Edit {selectedIds.size}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Bulk Edit {selectedIds.size} Records</DialogTitle>
                                        <DialogDescription>
                                            Update hours or remarks for all selected EOT records. Leave a field blank if you do not want to change it.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">New Hours <span className="text-muted-foreground font-normal">(optional)</span></label>
                                            <Input 
                                                type="number" 
                                                step="0.5" 
                                                min="0"
                                                placeholder="e.g. 4.0"
                                                value={bulkEditForm.hours}
                                                onChange={(e) => setBulkEditForm({...bulkEditForm, hours: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">New Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                                            <Input 
                                                placeholder="e.g. Approved by PM"
                                                value={bulkEditForm.remarks}
                                                onChange={(e) => setBulkEditForm({...bulkEditForm, remarks: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>Cancel</Button>
                                        <Button 
                                            onClick={handleBulkEditSubmit}
                                            disabled={isSubmittingBulkEdit}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {isSubmittingBulkEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Apply Changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button 
                                onClick={handleRejectSelected} 
                                disabled={isRejecting || isApproving}
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                            >
                                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                Reject {selectedIds.size}
                            </Button>
                            <Button 
                                onClick={handleApproveSelected} 
                                disabled={isApproving || isRejecting}
                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                            >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckSquare className="h-4 w-4"/>}
                                Approve {selectedIds.size}
                            </Button>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-0">
                    <div className="rounded-md border-0">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow>
                                    <TableHead className="w-[40px] px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Employee ID</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Shift</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Hours</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Remarks</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-48 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-500"/>
                                                Loading EOT records...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-48 text-center bg-slate-50/50">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <AlertTriangle className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <span className="text-slate-500 font-medium text-base">No EOT records found</span>
                                                <span className="text-slate-400 text-sm max-w-sm">
                                                    Try adjusting your search or filters to find what you're looking for.
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                filteredRecords.map((record) => (
                                    <TableRow key={record.id} className={selectedIds.has(record.id) ? "bg-blue-50 data-[state=selected]:bg-blue-50" : ""}>
                                        <TableCell className="px-4">
                                            <input 
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                checked={selectedIds.has(record.id)}
                                                onChange={() => handleSelectRow(record.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium tracking-tight">
                                            {format(new Date(record.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            {record.employee.employeeId}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            {record.employee.name}
                                            <div className="text-xs text-slate-500 mt-0.5">{record.employee.designation}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{record.shift}</TableCell>
                                        
                                        {/* Inline Editing for Hours */}
                                        <TableCell className="text-right">
                                            {editingRowId === record.id ? (
                                                <Input
                                                    type="number"
                                                    value={editValues.hours}
                                                    onChange={(e) => setEditValues({ ...editValues, hours: parseFloat(e.target.value) || 0 })}
                                                    className="w-20 text-right h-8 focus-visible:ring-blue-500"
                                                    step="0.5"
                                                    min="0"
                                                />
                                            ) : (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {record.hours} hrs
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Inline Editing for Remarks */}
                                        <TableCell className="max-w-[200px] truncate">
                                            {editingRowId === record.id ? (
                                                <Input
                                                    value={editValues.remarks}
                                                    onChange={(e) => setEditValues({ ...editValues, remarks: e.target.value })}
                                                    className="w-full h-8 text-sm focus-visible:ring-blue-500"
                                                    placeholder="Remarks..."
                                                />
                                            ) : (
                                                <span className="flex items-center gap-2 text-slate-600 text-sm">
                                                    {record.remarks?.includes("Manual") && (
                                                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-100 text-slate-600 border-slate-200">Manual</Badge>
                                                    )}
                                                    <span className="truncate" title={record.remarks || ""}>
                                                        {record.remarks?.replace("Manual Entry", "").trim() || "-"}
                                                    </span>
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {record.needsReview ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                                                    Pending Review
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                                    Approved
                                                </Badge>
                                            )}
                                        </TableCell>
                                        
                                        <TableCell className="text-right">
                                            {editingRowId === record.id ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleSaveEdit(record.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setEditingRowId(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-slate-100"
                                                        title="Edit EOT Record"
                                                        onClick={() => {
                                                            setEditingRowId(record.id);
                                                            setEditValues({ hours: record.hours, remarks: record.remarks || "" });
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                        title="Delete EOT Record"
                                                        onClick={() => handleDeleteRecord(record.id, record.employee.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>

                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
