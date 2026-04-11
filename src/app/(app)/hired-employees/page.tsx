"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Users, Building2, Pencil, Trash2, Search, Upload, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Vendor {
    id: string;
    name: string;
}

interface HiredEmployee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    vendorId: string;
    vendor: Vendor;
}

interface ImportRow {
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    vendorId: string;     // resolved vendor id
    rawCompany: string;   // company name as-read from file (for display)
}

interface ImportResult {
    row: number;
    employeeId: string;
    name: string;
    status: "created" | "skipped" | "error";
    reason?: string;
}

export default function HiredEmployeesPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [employees, setEmployees] = useState<HiredEmployee[]>([]);
    const [loading, setLoading] = useState(true);

    // Vendor modal state
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    // Vendor Delete modal state 
    const [isVendorDeleteDialogOpen, setIsVendorDeleteDialogOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

    // Employee modal state
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<HiredEmployee | null>(null);

    // Employee Delete modal state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<HiredEmployee | null>(null);

    // Bulk import state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState<ImportRow[]>([]);
    const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [venRes, empRes] = await Promise.all([
                fetch("/api/vendors"),
                fetch("/api/hired-employees")
            ]);
            const venData = await venRes.json();
            const empData = await empRes.json();

            setVendors(venData.data || []);
            setEmployees(empData.data || []);
        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const openAddVendorModal = () => {
        setEditingVendor(null);
        setIsVendorModalOpen(true);
    };

    const openEditVendorModal = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setIsVendorModalOpen(true);
    };

    const confirmDeleteVendor = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsVendorDeleteDialogOpen(true);
    };

    // Vendor Form Save
    const handleSaveVendor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        try {
            const isEditing = !!editingVendor;
            const url = isEditing ? `/api/vendors/${editingVendor.id}` : "/api/vendors";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || result.details || "Failed to save company");
            }

            toast.success(`Company ${isEditing ? 'updated' : 'added'} successfully`);
            setIsVendorModalOpen(false);
            setEditingVendor(null);
            fetchData(); // Reload
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${editingVendor ? 'update' : 'add'} company`);
        }
    };

    // Vendor Form Delete
    const handleDeleteVendor = async () => {
        if (!vendorToDelete) return;

        try {
            const res = await fetch(`/api/vendors/${vendorToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || result.details || "Failed to delete company");
            }

            toast.success("Company deleted successfully");
            setIsVendorDeleteDialogOpen(false);
            setVendorToDelete(null);
            fetchData(); // Reload
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete company");
        }
    };

    const openAddEmployeeModal = () => {
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
    };

    const openEditEmployeeModal = (employee: HiredEmployee) => {
        setEditingEmployee(employee);
        setIsEmployeeModalOpen(true);
    };

    const confirmDeleteEmployee = (employee: HiredEmployee) => {
        setEmployeeToDelete(employee);
        setIsDeleteDialogOpen(true);
    };

    // Employee Form (Create / Edit)
    const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            vendorId: formData.get("vendorId") as string,
            employeeId: formData.get("employeeId") as string,
            name: formData.get("name") as string,
            designation: formData.get("designation") as string,
            shift: formData.get("shift") as string,
        };

        if (!data.vendorId) {
            toast.error("Please select a company");
            return;
        }

        try {
            const isEditing = !!editingEmployee;
            const url = isEditing ? `/api/hired-employees/${editingEmployee.id}` : "/api/hired-employees";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || result.details || "Failed to save employee");
            }

            toast.success(`Employee ${isEditing ? 'updated' : 'added'} successfully`);
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
            fetchData(); // Reload
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${editingEmployee ? 'update' : 'add'} employee`);
        }
    };

    // Delete Employee
    const handleDeleteEmployee = async () => {
        if (!employeeToDelete) return;

        try {
            const res = await fetch(`/api/hired-employees/${employeeToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || result.details || "Failed to delete employee");
            }

            toast.success("Employee deleted successfully");
            setIsDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            fetchData(); // Reload
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete employee");
        }
    };

    // ------- BULK IMPORT HELPERS -------
    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                // Read the first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to array of objects (header row becomes keys)
                const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
                    defval: '',
                    raw: false, // return formatted strings
                });

                if (jsonRows.length === 0) {
                    toast.error('File is empty or has no data rows');
                    return;
                }

                // Build two lookup maps for vendor matching:
                // 1. Exact lowercase match
                // 2. Stripped match (remove all spaces, dots, dashes, commas) for fuzzy
                const vendorExact = new Map<string, string>();
                const vendorStripped = new Map<string, string>();
                const strip = (s: string) => s.toLowerCase().replace(/[\s.,\-\/\\()&'"]/g, '');
                vendors.forEach(v => {
                    vendorExact.set(v.name.toLowerCase().trim(), v.id);
                    vendorStripped.set(strip(v.name), v.id);
                });

                // Normalise keys: lowercase + strip spaces/underscores so any column naming works
                const normalise = (obj: Record<string, any>) => {
                    const out: Record<string, string> = {};
                    for (const k of Object.keys(obj)) {
                        out[k.toLowerCase().replace(/[\s_]/g, '')] = String(obj[k] ?? '').trim();
                    }
                    return out;
                };

                const resolveVendor = (name: string): string => {
                    if (!name) return '';
                    // 1. Exact match
                    const exact = vendorExact.get(name.toLowerCase().trim());
                    if (exact) return exact;
                    // 2. Fuzzy match — strip all punctuation/spaces
                    const fuzzy = vendorStripped.get(strip(name));
                    if (fuzzy) return fuzzy;
                    // 3. Partial contains match — if vendor name contains search term or vice versa
                    const lowerName = name.toLowerCase().trim();
                    for (const [vendorName, vendorId] of vendorExact.entries()) {
                        if (vendorName.includes(lowerName) || lowerName.includes(vendorName)) {
                            return vendorId;
                        }
                    }
                    return '';
                };

                const rows: ImportRow[] = jsonRows.map(raw => {
                    const r = normalise(raw);
                    const get = (...keys: string[]) => keys.map(k => r[k] || '').find(v => v) || '';

                    const rawCompany = get('company', 'vendor', 'companyname', 'vendorname', 'subcontractor', 'contractor');
                    const resolvedVendorId = resolveVendor(rawCompany);

                    return {
                        employeeId: get('employeeid', 'empid', 'id', 'employeeno', 'empno', 'staffid', 'badgeno'),
                        name: get('name', 'fullname', 'employeename', 'empname', 'staffname'),
                        designation: get('designation', 'role', 'position', 'jobtitle', 'trade'),
                        shift: get('shift', 'shifttype') || 'Day shift',
                        vendorId: resolvedVendorId,
                        rawCompany,
                    };
                }).filter(r => r.employeeId || r.name); // skip truly blank rows

                if (rows.length === 0) {
                    toast.error('No valid rows found. Check that your columns match the template.');
                    return;
                }

                setImportPreview(rows);
                setImportResults(null);
            } catch (err) {
                toast.error('Could not read file. Make sure it is a valid Excel or CSV file.');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) parseFile(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    const updatePreviewRow = (index: number, field: keyof ImportRow, value: string) => {
        setImportPreview(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };

    const handleBulkImport = async () => {
        const invalid = importPreview.filter(r => !r.vendorId || !r.employeeId || !r.name);
        if (invalid.length > 0) {
            toast.error(`${invalid.length} row(s) are missing required fields or company assignment`);
            return;
        }
        setImportLoading(true);
        try {
            const res = await fetch("/api/hired-employees/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records: importPreview }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Import failed");
            setImportResults(result.results);
            toast.success(`Import complete: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
            setImportLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Include a real vendor name example so users know the format
        const exampleCompany = vendors[0]?.name || 'SANDS L.L.C.';
        const csv = `employeeId,name,designation,shift,company\n666701,John Doe,Mason,Day shift,${exampleCompany}\n666702,Jane Smith,Carpenter,Night shift,${exampleCompany}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hired_employees_template.csv';
        a.click();
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hired Employees</h1>
                    <p className="text-muted-foreground">Manage vendors and external manpower</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={openAddVendorModal}>
                        <Building2 className="h-4 w-4" />
                        Add Company
                    </Button>

                    <Button variant="outline" className="gap-2" onClick={() => { setImportPreview([]); setImportResults(null); setIsImportModalOpen(true); }}>
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>

                    <Button onClick={openAddEmployeeModal} className="gap-2 bg-[#002D62] hover:bg-[#002D62]/90 text-white">
                        <Plus className="h-4 w-4 text-[#FFD700]" />
                        Add Employee
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-[300px_1fr] gap-6">
                {/* Vendors Summary */}
                <Card className="h-[fit-content]">
                    <CardHeader>
                        <CardTitle className="text-sm">Companies ({vendors.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            {vendors.length === 0 ? (
                                <p className="text-muted-foreground text-xs italic">No companies added yet.</p>
                            ) : (
                                vendors.map(v => (
                                    <div key={v.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                        <span className="font-medium mr-2 truncate">{v.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground text-[10px] bg-slate-100 px-2 py-0.5 rounded-full mr-1 group-hover:hidden">
                                                {employees.filter(e => e.vendorId === v.id).length} Emp
                                            </span>
                                            {/* Action buttons appear on hover */}
                                            <div className="hidden group-hover:flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditVendorModal(v)}
                                                    className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-[#002D62] transition-colors"
                                                    title="Edit Company"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => confirmDeleteVendor(v)}
                                                    className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-red-600 transition-colors"
                                                    title="Delete Company"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Employees Table */}
                <Card>
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Hired Personnel</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search employee..." className="pl-8 h-9 text-sm" />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 uppercase text-xs font-bold tracking-wider">
                                <TableHead>No</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        No hired employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map(emp => (
                                    <TableRow key={emp.id} className="text-sm border-b transition-colors hover:bg-slate-50">
                                        <TableCell className="font-mono text-slate-500">{emp.employeeId}</TableCell>
                                        <TableCell className="font-medium text-[#002D62]">{emp.vendor?.name}</TableCell>
                                        <TableCell className="font-bold">{emp.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{emp.designation}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${emp.shift.includes('Day') ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                                                {emp.shift}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditEmployeeModal(emp)} className="h-8 w-8 text-slate-400 hover:text-[#002D62]">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteEmployee(emp)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Add / Edit Vendor Modal */}
            <Dialog open={isVendorModalOpen} onOpenChange={(open) => {
                setIsVendorModalOpen(open);
                if (!open) setEditingVendor(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingVendor ? 'Edit Company' : 'Add New Company (Vendor)'}</DialogTitle>
                    </DialogHeader>
                    <form key={editingVendor?.id || 'new_vendor'} onSubmit={handleSaveVendor} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input id="name" name="name" defaultValue={editingVendor?.name || ""} placeholder="e.g. SANDS L.L.C." required />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit">{editingVendor ? 'Update Company' : 'Save Company'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Vendor Confirmation Alert Dialog */}
            <AlertDialog open={isVendorDeleteDialogOpen} onOpenChange={setIsVendorDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Company</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-bold">{vendorToDelete?.name}</span>?
                            This action cannot be undone. You cannot delete a company if there are employees assigned to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVendor} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add / Edit Employee Modal */}
            <Dialog open={isEmployeeModalOpen} onOpenChange={(open) => {
                setIsEmployeeModalOpen(open);
                if (!open) setEditingEmployee(null);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit Hired Employee' : 'Add Hired Employee'}</DialogTitle>
                    </DialogHeader>
                    <form key={editingEmployee?.id || 'new'} onSubmit={handleSaveEmployee} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="vendorId">Company / Vendor</Label>
                            <Select name="vendorId" defaultValue={editingEmployee?.vendorId || ""} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID / No</Label>
                            <Input id="employeeId" name="employeeId" defaultValue={editingEmployee?.employeeId || ""} placeholder="e.g. 666702" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" defaultValue={editingEmployee?.name || ""} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input id="designation" name="designation" defaultValue={editingEmployee?.designation || ""} placeholder="e.g. MASON" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shift">Shift</Label>
                                <Select name="shift" defaultValue={editingEmployee?.shift || "Day shift"} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Day shift">Day Shift</SelectItem>
                                        <SelectItem value="Night shift">Night Shift</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" className="bg-[#002D62] hover:bg-[#002D62]/90">
                                {editingEmployee ? 'Update Employee' : 'Save Employee'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Employee Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the external employee <span className="font-bold">{employeeToDelete?.name}</span> from our system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ===== BULK IMPORT DIALOG ===== */}
            <Dialog open={isImportModalOpen} onOpenChange={(open) => {
                setIsImportModalOpen(open);
                if (!open) { setImportPreview([]); setImportResults(null); }
            }}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-[#002D62]" />
                            Bulk Import Hired Employees
                        </DialogTitle>
                    </DialogHeader>

                    {/* Results view */}
                    {importResults ? (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-green-700 font-medium">Created</p>
                                        <p className="text-xl font-bold text-green-800">{importResults.filter(r => r.status === 'created').length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="text-xs text-amber-700 font-medium">Skipped (duplicate)</p>
                                        <p className="text-xl font-bold text-amber-800">{importResults.filter(r => r.status === 'skipped').length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <p className="text-xs text-red-700 font-medium">Errors</p>
                                        <p className="text-xl font-bold text-red-800">{importResults.filter(r => r.status === 'error').length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Row</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">ID</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importResults.map(r => (
                                            <tr key={r.row} className="border-t">
                                                <td className="px-3 py-2 text-slate-400">{r.row}</td>
                                                <td className="px-3 py-2 font-mono">{r.employeeId}</td>
                                                <td className="px-3 py-2">{r.name}</td>
                                                <td className="px-3 py-2">
                                                    {r.status === 'created' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Created</span>}
                                                    {r.status === 'skipped' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Skipped</span>}
                                                    {r.status === 'error' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Error</span>}
                                                </td>
                                                <td className="px-3 py-2 text-slate-500 text-xs">{r.reason || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setImportPreview([]); setImportResults(null); }}>Import Another File</Button>
                                <Button className="bg-[#002D62] hover:bg-[#002D62]/90 text-white" onClick={() => setIsImportModalOpen(false)}>Done</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {/* Drop zone */}
                            {importPreview.length === 0 && (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                                        dragOver ? 'border-[#002D62] bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    <Upload className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                                    <p className="font-semibold text-slate-700">Drop your Excel or CSV file here</p>
                                    <p className="text-sm text-slate-500 mt-1">.xlsx, .xls, or .csv — click to browse</p>
                                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                                </div>
                            )}

                            {/* Template download & format hint */}
                            {importPreview.length === 0 && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border text-sm">
                                    <span className="text-slate-600">Need a template? Download the sample CSV with the correct column headers.</span>
                                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={downloadTemplate}>
                                        <Download className="h-3.5 w-3.5" />
                                        Download Template
                                    </Button>
                                </div>
                            )}

                            {/* Preview table */}
                            {importPreview.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{importPreview.length} rows parsed.</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {importPreview.filter(r => r.vendorId).length} of {importPreview.length} companies auto-matched from file.
                                                {importPreview.filter(r => !r.vendorId).length > 0 && <span className="text-red-600 font-medium"> {importPreview.filter(r => !r.vendorId).length} row(s) need a company assigned.</span>}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => { setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>Clear</Button>
                                    </div>
                                    <div className="border rounded-lg overflow-auto max-h-96">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Emp ID</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Designation</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Shift</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Company *</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.map((row, i) => (
                                                    <tr key={i} className="border-t hover:bg-slate-50">
                                                        <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                                                        <td className="px-3 py-1.5">
                                                            <input
                                                                className="w-24 border rounded px-1.5 py-0.5 text-xs font-mono"
                                                                value={row.employeeId}
                                                                onChange={e => updatePreviewRow(i, 'employeeId', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input
                                                                className="w-44 border rounded px-1.5 py-0.5 text-xs"
                                                                value={row.name}
                                                                onChange={e => updatePreviewRow(i, 'name', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input
                                                                className="w-32 border rounded px-1.5 py-0.5 text-xs"
                                                                value={row.designation}
                                                                onChange={e => updatePreviewRow(i, 'designation', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <select
                                                                className="border rounded px-1.5 py-0.5 text-xs"
                                                                value={row.shift}
                                                                onChange={e => updatePreviewRow(i, 'shift', e.target.value)}
                                                            >
                                                                <option value="Day shift">Day shift</option>
                                                                <option value="Night shift">Night shift</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <div className="flex flex-col gap-0.5">
                                                                {row.rawCompany && !row.vendorId && (
                                                                    <span className="text-[10px] text-red-500 font-medium leading-tight" title="Name read from file — not matched to any company">
                                                                        ⚠ "{row.rawCompany}"
                                                                    </span>
                                                                )}
                                                                {row.rawCompany && row.vendorId && (
                                                                    <span className="text-[10px] text-green-600 leading-tight">
                                                                        ✓ "{row.rawCompany}"
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    {row.vendorId
                                                                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                                        : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                                                    }
                                                                    <select
                                                                        className={`flex-1 border rounded px-1.5 py-0.5 text-xs ${!row.vendorId ? 'border-red-400 bg-red-50' : 'border-green-300 bg-green-50'}`}
                                                                        value={row.vendorId}
                                                                        onChange={e => updatePreviewRow(i, 'vendorId', e.target.value)}
                                                                    >
                                                                        <option value="">— Select —</option>
                                                                        {vendors.map(v => (
                                                                            <option key={v.id} value={v.id}>{v.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Bulk assign vendor shortcut */}
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <span className="text-xs text-blue-700 font-medium shrink-0">Assign all rows to one company:</span>
                                        <select
                                            className="border rounded px-2 py-1 text-xs flex-1"
                                            onChange={e => {
                                                if (e.target.value) setImportPreview(prev => prev.map(r => ({ ...r, vendorId: e.target.value })));
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="">— pick to apply to all —</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                                        <Button
                                            disabled={importLoading}
                                            onClick={handleBulkImport}
                                            className="bg-[#002D62] hover:bg-[#002D62]/90 text-white gap-2"
                                        >
                                            {importLoading ? 'Importing...' : `Import ${importPreview.length} Records`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
