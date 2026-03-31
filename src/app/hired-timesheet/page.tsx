"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Package,
    Info,
    Filter,
    ShieldCheck,
    Printer,
    FileSpreadsheet,
    Send,
    Loader2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeColors = {
    navy: "#002D62",
    yellow: "#FFD700",
    absent: "#FEE2E2",
    absentText: "#991B1B",
    standard: "#F8FAFC",
    missedPunch: "#dcfce7", // Green
    missedPunchText: "#166534"
};

interface Vendor {
    id: string;
    name: string;
}

interface TimesheetRecord {
    hours: number | string | null;
    status: string; // "present", "absent", "holiday", "missed_punch"
}

interface EmployeeData {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    records: Record<number, TimesheetRecord>;
}

export default function HiredTimesheet() {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    const [employees, setEmployees] = useState<EmployeeData[]>([]);
    const [loading, setLoading] = useState(false);

    // Sort state
    type SortField = "employeeId" | "name" | "designation" | "totalHours";
    type SortDir = "asc" | "desc";
    const [sortField, setSortField] = useState<SortField>("employeeId");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Initial load
    useEffect(() => {
        fetch("/api/vendors")
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setVendors(data.data);
                    if (data.data.length > 0) {
                        setSelectedVendorId(data.data[0].id);
                    }
                }
            })
            .catch(err => toast.error("Failed to load vendors"));
    }, []);

    // Fetch timesheet data when vendor or month changes
    useEffect(() => {
        if (!selectedVendorId || !selectedMonth) return;

        const fetchTimesheet = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/hired-timesheet?vendorId=${selectedVendorId}&month=${selectedMonth}`);
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                setEmployees(data.data || []);
            } catch (error) {
                toast.error("Failed to load timesheet data");
            } finally {
                setLoading(false);
            }
        };

        fetchTimesheet();
    }, [selectedVendorId, selectedMonth]);

    const handleCellChange = async (empId: string, day: number, value: string) => {
        // Optimistic update with deep cloning for React to perfectly detect changes
        setEmployees(prev => {
            const cloned = [...prev];
            const empIndex = cloned.findIndex(e => e.id === empId);
            if (empIndex > -1) {
                cloned[empIndex] = {
                    ...cloned[empIndex],
                    records: {
                        ...cloned[empIndex].records,
                        [day]: { ...cloned[empIndex].records[day], hours: value }
                    }
                };
            }
            return cloned;
        });

        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;

        try {
            const res = await fetch("/api/hired-timesheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hiredEmployeeId: empId,
                    date: dateStr,
                    hours: value
                })
            });

            if (!res.ok) throw new Error("Save failed");

            const savedData = await res.json();
            if (savedData.data) {
                setEmployees(prev => {
                    const cloned = [...prev];
                    const eIndex = cloned.findIndex(e => e.id === empId);
                    if (eIndex > -1) {
                        const rec = savedData.data;
                        cloned[eIndex] = {
                            ...cloned[eIndex],
                            records: {
                                ...cloned[eIndex].records,
                                [day]: {
                                    hours: rec.status === "absent" ? "A" : rec.hours,
                                    status: rec.status
                                }
                            }
                        };
                    }
                    return cloned;
                });
            }

        } catch (error) {
            toast.error("Failed to save record");
        }
    };

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year || 2025, month || 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const calcTotalHours = (emp: EmployeeData) => {
        let total = 0;
        for (const [dayStr, record] of Object.entries(emp.records)) {
            if (typeof record.hours === 'number') {
                total += record.hours;
            } else if (typeof record.hours === 'string' && !isNaN(Number(record.hours)) && record.hours.trim() !== "") {
                total += Number(record.hours);
            }
        }
        return total;
    };

    // Sorted employees driven by sortField + sortDir
    const sortedEmployees = useMemo(() => {
        return [...employees].sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";
            if (sortField === "employeeId") { valA = a.employeeId; valB = b.employeeId; }
            else if (sortField === "name") { valA = a.name; valB = b.name; }
            else if (sortField === "designation") { valA = a.designation; valB = b.designation; }
            else if (sortField === "totalHours") { valA = calcTotalHours(a); valB = calcTotalHours(b); }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDir === "asc" ? valA - valB : valB - valA;
            }
            return sortDir === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }, [employees, sortField, sortDir]);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={10} className="ml-0.5 opacity-40" />;
        return sortDir === "asc" ? <ArrowUp size={10} className="ml-0.5 text-blue-600" /> : <ArrowDown size={10} className="ml-0.5 text-blue-600" />;
    };

    const grandTotal = employees.reduce((acc, emp) => acc + calcTotalHours(emp), 0);

    return (
        <div className="flex flex-col min-h-0 bg-slate-50/50 print:bg-white print:h-auto print:overflow-visible">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col space-y-1.5 border-r border-slate-200 pr-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">External Vendor</label>
                        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                            <SelectTrigger className="w-[240px] h-9">
                                <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5 border-r border-slate-200 pr-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Ref</label>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md h-9">
                            <Package size={16} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">DARALHAI 132/11kV (D657)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-2 h-9">
                        <Info size={16} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Displaying {sortedEmployees.length} Employees</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Filter size={14} />
                                Sort By
                                <ChevronDown size={12} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">Sort Column</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={sortField === "employeeId"} onCheckedChange={() => handleSort("employeeId")}>
                                Employee ID {sortField === "employeeId" && (sortDir === "asc" ? "↑" : "↓")}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={sortField === "name"} onCheckedChange={() => handleSort("name")}>
                                Name {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={sortField === "designation"} onCheckedChange={() => handleSort("designation")}>
                                Role / Designation {sortField === "designation" && (sortDir === "asc" ? "↑" : "↓")}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={sortField === "totalHours"} onCheckedChange={() => handleSort("totalHours")}>
                                Total Hours {sortField === "totalHours" && (sortDir === "asc" ? "↑" : "↓")}
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <main className="flex-1 overflow-auto relative p-6 space-y-6 flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Data Grid Card */}
                        <Card className="shadow-sm overflow-hidden flex flex-col flex-1">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] relative">
                                {/* We use standard HTML table elements here to retain exact control over sticky columns and highly custom borders
                                which can be tricky with the abstracted generic `<Table>` wrapper in terms of z-indexes and infinite scrolling grids. */}
                                <table className="w-full border-collapse text-sm">
                                    <thead className="sticky top-0 z-40 bg-slate-100 text-left">
                                        <tr className="h-10 text-slate-600 uppercase font-bold tracking-wider">
                                            <th
                                                className="sticky left-0 z-40 bg-slate-100 min-w-[60px] px-3 border border-slate-200 text-[11px] leading-tight shadow-[2px_0_0_#e2e8f0] cursor-pointer hover:bg-slate-200 select-none"
                                                onClick={() => handleSort("employeeId")}
                                            >
                                                <span className="flex items-center">No <SortIcon field="employeeId" /></span>
                                            </th>
                                            <th
                                                className="sticky left-[60px] z-40 bg-slate-100 min-w-[200px] px-3 border border-slate-200 text-[11px] leading-tight shadow-[2px_0_0_#e2e8f0] cursor-pointer hover:bg-slate-200 select-none"
                                                onClick={() => handleSort("name")}
                                            >
                                                <span className="flex items-center">Employee Name <SortIcon field="name" /></span>
                                            </th>
                                            <th
                                                className="sticky left-[260px] z-40 bg-slate-100 min-w-[120px] px-3 border-r-2 border-slate-300 border-l border-y border-slate-200 text-[11px] leading-tight cursor-pointer hover:bg-slate-200 select-none"
                                                onClick={() => handleSort("designation")}
                                            >
                                                <span className="flex items-center">Role <SortIcon field="designation" /></span>
                                            </th>

                                            {daysArray.map((day) => {
                                                const currentDate = new Date(year, month - 1, day);
                                                const isWeekend = currentDate.getDay() === 0; // Sunday

                                                return (
                                                    <th
                                                        key={day}
                                                        className="w-9 min-w-[36px] text-center border border-slate-200 text-[11px] leading-tight"
                                                        style={isWeekend ? { backgroundColor: themeColors.yellow, color: '#000' } : {}}
                                                    >
                                                        {day}
                                                    </th>
                                                );
                                            })}
                                            <th
                                                className="min-w-[80px] bg-slate-200 text-center border-l-2 border-slate-400 border-y border-slate-200 border-r text-[11px] leading-tight"
                                                style={{ color: themeColors.navy }}
                                            >
                                                Total Hours
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={daysArray.length + 4} className="text-center py-12 text-slate-400">
                                                    No employees found for this vendor.
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedEmployees.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="sticky left-0 z-20 bg-white font-mono text-slate-500 px-3 py-2 border border-slate-200 text-[11px] shadow-[2px_0_0_#e2e8f0]">{emp.employeeId}</td>
                                                    <td className="sticky left-[60px] z-20 bg-white font-bold text-slate-800 px-3 py-2 border border-slate-200 text-[11px] truncate shadow-[2px_0_0_#e2e8f0]">{emp.name}</td>
                                                    <td className="sticky left-[260px] z-20 bg-white text-slate-600 px-3 py-2 border-r-2 border-slate-200 border-l border-y text-[11px] italic">{emp.designation}</td>

                                                    {daysArray.map((day) => {
                                                        const currentDate = new Date(year, month - 1, day);
                                                        const isWeekend = currentDate.getDay() === 0; // Sunday
                                                        const record = emp.records[day] || { hours: "", status: "present" };

                                                        let cellStyle: React.CSSProperties = { backgroundColor: themeColors.standard };

                                                        if (record.status === "absent") {
                                                            cellStyle = { backgroundColor: themeColors.absent, color: themeColors.absentText };
                                                        } else if (isWeekend || record.status === "holiday") {
                                                            cellStyle = { backgroundColor: themeColors.yellow, color: '#000' };
                                                        } else if (record.status === "missed_punch") {
                                                            cellStyle = { backgroundColor: themeColors.missedPunch, color: themeColors.missedPunchText };
                                                        }

                                                        return (
                                                            <td
                                                                key={day}
                                                                className="border border-slate-200 text-[11px] leading-tight p-0 transition-colors relative group"
                                                                style={cellStyle}
                                                            >
                                                                <input
                                                                    className="w-full h-8 text-center border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none p-0 bg-transparent uppercase font-medium hover:bg-black/5"
                                                                    value={record.hours === null ? "" : record.hours}
                                                                    onChange={(e) => {
                                                                        // We just update local state instantly, save on blur to avoid spamming
                                                                        const newEmployees = [...employees];
                                                                        const eIndex = newEmployees.findIndex(x => x.id === emp.id);
                                                                        newEmployees[eIndex].records[day] = { ...record, hours: e.target.value };
                                                                        setEmployees(newEmployees);
                                                                    }}
                                                                    onBlur={(e) => handleCellChange(emp.id, day, e.target.value)}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td
                                                        className="bg-slate-50 text-center font-bold border-l-2 border-slate-300 border-y border-slate-200 text-[11px]"
                                                        style={{ color: themeColors.navy }}
                                                    >
                                                        {calcTotalHours(emp)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="sticky bottom-0 z-40 bg-slate-200 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                                        <tr className="font-bold text-slate-700 h-10 uppercase tracking-tighter">
                                            <td
                                                colSpan={3}
                                                className="sticky left-0 z-40 bg-slate-200 text-right pr-6 border-r-2 border-slate-400 border-y border-slate-200 text-[11px]"
                                            >
                                                Grand Total Hours
                                            </td>
                                            {daysArray.map((day) => {
                                                let dailyTotal = 0;
                                                employees.forEach(emp => {
                                                    const rec = emp.records[day];
                                                    if (rec && typeof rec.hours === 'number') dailyTotal += rec.hours;
                                                    else if (rec && typeof rec.hours === 'string' && !isNaN(Number(rec.hours)) && rec.hours.trim() !== "") dailyTotal += Number(rec.hours);
                                                });
                                                return (
                                                    <td key={day} className="text-center bg-slate-200 border border-slate-200 text-[11px]">
                                                        {dailyTotal > 0 ? dailyTotal : ""}
                                                    </td>
                                                );
                                            })}
                                            <td
                                                className="text-white text-center border-l-2 border-slate-500 border-y border-slate-200 border-r text-[11px]"
                                                style={{ backgroundColor: themeColors.navy }}
                                            >
                                                {grandTotal}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>

                        {/* Signatures */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                            <Card className="shadow-sm border-l-4" style={{ borderLeftColor: "#94a3b8" }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prepared By</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">MD AFJAL KHAN</span>
                                        <span className="text-xs text-slate-500 mt-1">Designation: Timekeeper</span>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[11px] font-mono text-slate-400">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</span>
                                            <div className="h-6 w-20 bg-slate-50 border border-dashed border-slate-200 rounded-sm"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4" style={{ borderLeftColor: themeColors.navy }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Civil Engineer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">Prasanna Rajasekaran</span>
                                        <span className="text-xs text-slate-500 mt-1">Site-In-Charge</span>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[11px] font-mono text-slate-400">Date: {new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</span>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] py-0">VERIFIED</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-l-4" style={{ borderLeftColor: themeColors.yellow }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Checked By</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">Shafic Ahmad</span>
                                        <span className="text-xs text-slate-500 mt-1">Project Manager</span>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[11px] font-mono text-slate-400">Date: {new Date(Date.now() + 172800000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</span>
                                            <div className="h-6 w-20 bg-slate-50 border border-dashed border-slate-200 rounded-sm"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </main>

            {/* Float Action Bar */}
            <div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 z-[60] print:hidden"
                style={{ backgroundColor: themeColors.navy, border: "1px solid rgba(255,255,255,0.1)" }}
            >
                <div className="flex items-center gap-2 border-r pr-4" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                    <ShieldCheck size={20} style={{ color: themeColors.yellow }} />
                    <div className="flex flex-col mr-2">
                        <span className="text-[9px] uppercase font-bold text-blue-300 tracking-wider">Form Status</span>
                        <span className="text-xs font-semibold">Ready for Approval</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white rounded-full h-8 gap-2">
                        <Printer size={16} />
                        Print
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white rounded-full h-8 gap-2">
                        <FileSpreadsheet size={16} />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        className="rounded-full h-8 px-5 gap-2 font-bold shadow-sm"
                        style={{ backgroundColor: themeColors.yellow, color: themeColors.navy }}
                    >
                        <Send size={16} />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Legend Map */}
            <div className="fixed bottom-8 right-6 flex flex-col gap-2 bg-white/90 backdrop-blur p-4 border border-slate-200 rounded-lg shadow-lg z-40 print:hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Legend</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-slate-300 rounded-[2px]" style={{ backgroundColor: themeColors.standard }}></div>
                    <span className="text-xs font-medium text-slate-600">Standard Hours</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: themeColors.missedPunch }}></div>
                    <span className="text-xs font-medium text-slate-600">Missed Punch (5 H)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: themeColors.yellow }}></div>
                    <span className="text-xs font-medium text-slate-600">Holiday / Weekend</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-red-200 rounded-[2px]" style={{ backgroundColor: themeColors.absent }}></div>
                    <span className="text-xs font-medium text-slate-600">A: Absent</span>
                </div>
            </div>
        </div>
    );
}
