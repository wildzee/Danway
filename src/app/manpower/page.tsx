"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    FileSpreadsheet,
    FileText,
    AlertCircle,
    Info,
    Download,
    Users,
    Briefcase
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// --- Sample Data ---

const manpowerData = [
    { id: 1, designation: "FOREMAN", dayShift: 5, nightShift: 0, absent: 0, total: 5 },
    { id: 2, designation: "ELECTRICIAN", dayShift: 1, nightShift: 0, absent: 0, total: 1 },
    { id: 3, designation: "PLUMBER", dayShift: 10, nightShift: 0, absent: 1, total: 11 },
    { id: 4, designation: "MASON", dayShift: 15, nightShift: 0, absent: 0, total: 15 },
    { id: 5, designation: "HELPER", dayShift: 15, nightShift: 0, absent: 1, total: 16 },
    { id: 5, designation: "STEEL FIXER", dayShift: 6, nightShift: 0, absent: 0, total: 6 },
    { id: 5, designation: "CARPENTER", dayShift: 18, nightShift: 0, absent: 1, total: 6 },
];

const absentWorkers = [
    { id: "ID-1006281", role: "Steel Fixer", status: "ABSENT", shift: "DAY" },
    { id: "ID-1008422", role: "Civil Helper", status: "ABSENT", shift: "DAY" },
    { id: "ID-1009105", role: "Carpenter", status: "ABSENT", shift: "DAY" },
    { id: "ID-1007743", role: "Mason", status: "ABSENT", shift: "DAY" },
];

const totalWorkers = 74;
const dayShiftTotal = 70;
const nightShiftTotal = 0;
const absentTotal = 4;

const shiftData = [
    { name: "Day Shift", value: 70, color: "#10b981" }, // emerald-500
    { name: "Night Shift", value: 0, color: "#64748b" }, // slate-500
    { name: "Absent", value: 4, color: "#ef4444" }, // red-500
];

const danwayCount = 70;
const hiredCount = 4;

export default function ManpowerReportPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [project] = useState("D657");

    const handleExport = (type: 'excel' | 'pdf') => {
        toast.success(`Exporting ${type === 'excel' ? 'Excel' : 'PDF'} report...`);
    };

    return (
        <div className="flex flex-col min-h-0 bg-slate-50/50">

            {/* Main Content */}
            <main className="max-w-[1600px] w-full mx-auto p-6 space-y-6">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manpower Report</h1>
                        <p className="text-muted-foreground">Workforce statistics and department breakdown for D657</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                        <Button size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Submit Report
                        </Button>
                    </div>
                </div>

                {/* Top Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalWorkers}</div>
                            <p className="text-xs text-muted-foreground">Active workforce on site</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Day Shift</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dayShiftTotal}</div>
                            <p className="text-xs text-muted-foreground">Workers present today</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Night Shift</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{nightShiftTotal}</div>
                            <p className="text-xs text-muted-foreground">Workers scheduled tonight</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Absent</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{absentTotal}</div>
                            <p className="text-xs text-muted-foreground">Workers absent without leave</p>
                        </CardContent>
                    </Card>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Workforce Table */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        <Card className="shadow-sm h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-bold">Workforce by Designation</CardTitle>
                                        <CardDescription>Detailed breakdown of workers by trade and shift</CardDescription>
                                    </div>
                                    <Tabs defaultValue="danway" className="w-[300px]">
                                        <TabsList className="grid w-full grid-cols-2 h-8">
                                            <TabsTrigger value="danway" className="text-xs">Danway</TabsTrigger>
                                            <TabsTrigger value="hired" className="text-xs">Hired</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] font-bold text-xs uppercase tracking-wider">Sr.</TableHead>
                                            <TableHead className="font-bold text-xs uppercase tracking-wider">Designation / Trade</TableHead>
                                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider w-24">Day</TableHead>
                                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider w-24">Night</TableHead>
                                            <TableHead className="text-center font-bold text-xs uppercase tracking-wider w-24">Absent</TableHead>
                                            <TableHead className="text-right font-bold text-xs uppercase tracking-wider w-24 pr-6">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {manpowerData.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="text-muted-foreground font-mono text-xs py-3">{row.id}</TableCell>
                                                <TableCell className="font-semibold text-xs py-3">{row.designation}</TableCell>
                                                <TableCell className="text-center text-blue-600 font-bold text-xs py-3">{row.dayShift || "-"}</TableCell>
                                                <TableCell className="text-center text-muted-foreground text-xs py-3">{row.nightShift || "-"}</TableCell>
                                                <TableCell className="text-center text-red-500 font-bold text-xs py-3">{row.absent || "-"}</TableCell>
                                                <TableCell className="text-right font-bold text-xs py-3 pr-6">{row.total}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Total Row */}
                                        <TableRow className="bg-slate-50/50 font-bold border-t-2">
                                            <TableCell className="text-xs uppercase tracking-wider py-4" colSpan={2}>Total</TableCell>
                                            <TableCell className="text-center text-blue-700 text-sm py-4">{dayShiftTotal}</TableCell>
                                            <TableCell className="text-center text-slate-500 text-sm py-4">0</TableCell>
                                            <TableCell className="text-center text-red-600 text-sm py-4">{absentTotal}</TableCell>
                                            <TableCell className="text-right text-slate-900 text-base py-4 pr-6">{totalWorkers}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Charts & Stats */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">

                        {/* Shift Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold">Shift Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="h-[160px] w-[160px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={shiftData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                >
                                                    {shiftData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold leading-none">{totalWorkers}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground font-medium mt-1">Total</span>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="space-y-3 flex-1 pl-4">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Day Shift</p>
                                                <p className="text-sm font-bold">{dayShiftTotal} Workers ({Math.round((dayShiftTotal / totalWorkers) * 100)}%)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Night Shift</p>
                                                <p className="text-sm font-bold">{nightShiftTotal} Workers (0%)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Absent</p>
                                                <p className="text-sm font-bold">{absentTotal} Workers ({Math.round((absentTotal / totalWorkers) * 100)}%)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danway vs Hired */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-bold">Danway vs Hired</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                                            <span>DANWAY PERSONNEL</span>
                                        </div>
                                        <span>{danwayCount} Workers</span>
                                    </div>
                                    <Progress value={(danwayCount / totalWorkers) * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>HIRED MANPOWER</span>
                                        </div>
                                        <span>{hiredCount} Workers</span>
                                    </div>
                                    <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(hiredCount / totalWorkers) * 100}%` }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Absent List */}
                        <Card className="shadow-sm border-l-4 border-l-red-500 bg-red-50/20">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <CardTitle className="text-sm font-bold text-red-700">Absent Today</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {absentWorkers.map((worker) => (
                                        <li key={worker.id} className="text-xs font-medium text-red-900 flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                            <span className="font-bold">{worker.id}</span> - {worker.role}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="link" className="text-red-700 h-auto p-0 text-xs font-bold mt-3">
                                    View Full List
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </div>

                {/* Footer / Remarks */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800 mb-1">Remarks & Notifications</h4>
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                ID - 1008405 - WORKING ON D636 TEMP., FROM D657. Attendance for D636 will be manually synchronized.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-xs font-bold whitespace-nowrap">
                        ADD REMARK
                    </Button>
                </div>

            </main>
        </div>
    );
}
