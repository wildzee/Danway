"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Search, Edit, Trash2, Upload, Loader2 } from "lucide-react";

interface DesignationMapping {
    designation: string;
    network: string;
    activity: string;
    element: string;
    isEngineer: boolean;
}

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    mobile?: string;
    shift: string;
    isEngineer: boolean;
    allowOvertime: boolean;
    network: string;
    activity: string;
    element: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [designations, setDesignations] = useState<DesignationMapping[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isImportingEmployees, setIsImportingEmployees] = useState(false);
    const employeeFileInputRef = React.useRef<HTMLInputElement>(null);

    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        employeeId: "",
        name: "",
        designation: "",
        mobile: "",
        shift: "Day shift",
        isStaff: "false",
        allowOvertime: true,
    });

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/employees");
            const data = await response.json();
            if (data.success) {
                setEmployees(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    // Fetch designations (SAP code mappings for this site)
    const fetchDesignations = async () => {
        try {
            const res = await fetch("/api/designations");
            const data = await res.json();
            if (data.success) setDesignations(data.data || []);
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchDesignations();
    }, []);

    // Filter designations by selected employee type
    const getAvailableDesignations = () => {
        if (formData.isStaff === "true") return designations.filter(d => d.isEngineer);
        if (formData.isStaff === "false") return designations.filter(d => !d.isEngineer);
        return designations;
    };

    // Handle employee type change - reset designation when type changes
    const handleEmployeeTypeChange = (value: string) => {
        setFormData({
            ...formData,
            isStaff: value,
            designation: "",
            // When switching to Staff, default OT off. Workers default OT on.
            allowOvertime: value !== "true",
        });
    };

    // Open Add Dialog
    const handleAddClick = () => {
        setEditingEmployee(null);
        setFormData({
            employeeId: "",
            name: "",
            designation: "",
            mobile: "",
            shift: "Day shift",
            isStaff: "false",
            allowOvertime: true,
        });
        setIsAddDialogOpen(true);
    };

    // Open Edit Dialog
    const handleEditClick = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            employeeId: employee.employeeId,
            name: employee.name,
            designation: employee.designation,
            mobile: employee.mobile || "",
            shift: employee.shift,
            isStaff: employee.isEngineer ? "true" : "false",
            allowOvertime: employee.allowOvertime,
        });
        setIsAddDialogOpen(true);
    };

    // Open Delete Dialog
    const handleDeleteClick = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteDialogOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;
        setIsLoading(true);

        try {
            const response = await fetch(`/api/employees?id=${employeeToDelete.id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (data.success) {
                setIsDeleteDialogOpen(false);
                setEmployeeToDelete(null);
                fetchEmployees();
            } else {
                alert(data.error || "Failed to delete employee");
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Failed to delete employee");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission (Add or Edit)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const selectedDesignation = designations.find(d => d.designation === formData.designation);

            const payload = {
                employeeId: formData.employeeId,
                name: formData.name,
                designation: formData.designation,
                mobile: formData.mobile || null,
                shift: formData.shift,
                isEngineer: formData.isStaff === "true",
                allowOvertime: formData.allowOvertime,
                network: selectedDesignation?.network || "5001323",
                activity: selectedDesignation?.activity || "0132",
                element: selectedDesignation?.element || "0601",
            };

            let response;

            if (editingEmployee) {
                // Update existing employee
                response = await fetch("/api/employees", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingEmployee.id,
                        ...payload
                    }),
                });
            } else {
                // Create new employee
                response = await fetch("/api/employees", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const data = await response.json();

            if (data.success) {
                setIsAddDialogOpen(false);
                setEditingEmployee(null);
                fetchEmployees();
            } else {
                alert(data.error || "Failed to save employee");
            }
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("Failed to save employee");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle employee import from Excel
    const handleEmployeeImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingEmployees(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/employees/import", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                alert(`✅ Imported ${result.data.createdCount + result.data.updatedCount} employees!`);
                await fetchEmployees();
            } else {
                alert(`❌ Import failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Import error:", error);
            alert("❌ Failed to import employees");
        } finally {
            setIsImportingEmployees(false);
            if (employeeFileInputRef.current) {
                employeeFileInputRef.current.value = "";
            }
        }
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp =>
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Employee Management</h1>
                    <p className="text-muted-foreground">Manage your workforce and employee details</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        ref={employeeFileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleEmployeeImport}
                        className="hidden"
                    />
                    <Button
                        onClick={() => employeeFileInputRef.current?.click()}
                        disabled={isImportingEmployees}
                        variant="outline"
                        className="gap-2"
                    >
                        {isImportingEmployees ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Import Employees
                            </>
                        )}
                    </Button>
                    <Button onClick={handleAddClick} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Employees</p>
                            <p className="text-2xl font-bold">{employees.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-3">
                            <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Staff</p>
                            <p className="text-2xl font-bold">{employees.filter(e => e.isEngineer).length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-purple-100 p-3">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Workers</p>
                            <p className="text-2xl font-bold">{employees.filter(e => !e.isEngineer).length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, name, or designation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Employee List */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold w-[90px]">ID</th>
                                <th className="p-3 text-left text-xs font-semibold w-[150px]">Name</th>
                                <th className="p-3 text-left text-xs font-semibold w-[140px]">Designation</th>
                                <th className="p-3 text-left text-xs font-semibold w-[80px]">Type</th>
                                <th className="p-3 text-left text-xs font-semibold w-[70px]">OT</th>
                                <th className="p-3 text-left text-xs font-semibold w-[100px]">Shift</th>
                                <th className="p-3 text-left text-xs font-semibold w-[140px]">SAP Codes</th>
                                <th className="p-3 text-left text-xs font-semibold w-[120px]">Mobile</th>
                                <th className="p-3 text-right text-xs font-semibold w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                                        No employees found. Click "Add Employee" to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-mono text-xs">{employee.employeeId}</td>
                                        <td className="p-3 text-sm font-medium truncate max-w-[150px]" title={employee.name}>
                                            {employee.name}
                                        </td>
                                        <td className="p-3 text-xs truncate max-w-[140px]" title={employee.designation}>
                                            {employee.designation}
                                        </td>
                                        <td className="p-3">
                                            <Badge variant={employee.isEngineer ? "default" : "secondary"} className="text-xs">
                                                {employee.isEngineer ? "Staff" : "Worker"}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant={employee.allowOvertime ? "default" : "outline"} className={`text-xs ${employee.allowOvertime ? "bg-orange-100 text-orange-700 border-orange-200" : "text-muted-foreground"}`}>
                                                {employee.allowOvertime ? "OT ✓" : "No OT"}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-xs">{employee.shift}</td>
                                        <td className="p-3 font-mono text-xs text-muted-foreground">
                                            {employee.network}/{employee.activity}/{employee.element}
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground">{employee.mobile || "-"}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleEditClick(employee)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteClick(employee)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Results Summary */}
                {filteredEmployees.length > 0 && (
                    <div className="border-t px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"}
                        </div>
                    </div>
                )}
            </Card>

            {/* Add/Edit Employee Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                        <DialogDescription>
                            {editingEmployee ? "Update employee details below." : "Enter employee details below. All fields marked with * are required."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="employeeId">Employee ID *</Label>
                                <Input
                                    id="employeeId"
                                    placeholder="e.g., 1007351"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                    disabled={!!editingEmployee} // Disable ID editing if desired, or enable. Keeping enabled but could be disabled.
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="isStaff">Employee Type *</Label>
                                <Select
                                    value={formData.isStaff}
                                    onValueChange={handleEmployeeTypeChange}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee type first" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Staff</SelectItem>
                                        <SelectItem value="false">Worker</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Select employee type to see available designations
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="designation">Designation *</Label>
                                <Select
                                    value={formData.designation}
                                    onValueChange={(value) => setFormData({ ...formData, designation: value })}
                                    required
                                    disabled={getAvailableDesignations().length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select designation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getAvailableDesignations().map((des) => (
                                            <SelectItem key={des.designation} value={des.designation}>
                                                {des.designation}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.designation && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                        SAP Code: {designations.find(d => d.designation === formData.designation)?.network}/
                                        {designations.find(d => d.designation === formData.designation)?.activity}/
                                        {designations.find(d => d.designation === formData.designation)?.element}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shift">Shift *</Label>
                                <Select
                                    value={formData.shift}
                                    onValueChange={(value) => setFormData({ ...formData, shift: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Day shift">Day Shift</SelectItem>
                                        <SelectItem value="Night shift">Night Shift</SelectItem>
                                        <SelectItem value="Both shifts">Day & Night</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mobile">Mobile Number</Label>
                                <Input
                                    id="mobile"
                                    placeholder="e.g., +971501234567"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-sm font-medium">Allow Overtime (OT)</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        If OFF, employee is always capped at 8 normal hours. No OT recorded.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={formData.allowOvertime}
                                    onClick={() => setFormData({ ...formData, allowOvertime: !formData.allowOvertime })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.allowOvertime ? "bg-orange-500" : "bg-muted"
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.allowOvertime ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                </button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (editingEmployee ? "Updating..." : "Adding...") : (editingEmployee ? "Update Employee" : "Add Employee")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Employee</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{employeeToDelete?.name}</strong> ({employeeToDelete?.employeeId})? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
