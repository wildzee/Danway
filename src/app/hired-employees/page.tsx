"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Building2, Pencil, Trash2, Search } from "lucide-react";
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

        </div>
    );
}
