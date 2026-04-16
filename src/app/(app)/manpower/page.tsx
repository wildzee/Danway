"use client";

import { useState, useEffect } from "react";
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
    Briefcase,
    Calendar as CalendarIcon,
    Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    project: string;
    status: string;
}

interface PunchRecord {
    employeeId: string;
    punchIn: string | null;
    punchOut: string | null;
    date: string;
}

interface DesignationStats {
    designation: string;
    dayShift: number;
    nightShift: number;
    absent: number;
    total: number;
}

const COLORS = ["#10b981", "#64748b", "#ef4444"]; // Emerald, Slate, Red

export default function ManpowerReportPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [punches, setPunches] = useState<PunchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("danway");
    const [danwayStats, setDanwayStats] = useState<DesignationStats[]>([]);
    const [hiredStats, setHiredStats] = useState<DesignationStats[]>([]);
    const [danwaySummary, setDanwaySummary] = useState({ total: 0, day: 0, night: 0, absent: 0 });
    const [hiredSummary, setHiredSummary] = useState({ total: 0, day: 0, night: 0, absent: 0 });
    const [danwayAbsentList, setDanwayAbsentList] = useState<Employee[]>([]);
    const [hiredAbsentList, setHiredAbsentList] = useState<Employee[]>([]);
    
    // Derived state based on active tab
    const stats = activeTab === "danway" ? danwayStats : hiredStats;
    const summary = activeTab === "danway" ? danwaySummary : hiredSummary;
    const absentList = activeTab === "danway" ? danwayAbsentList : hiredAbsentList;

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Employees
            const empRes = await fetch("/api/employees/import");
            const empData = await empRes.json();
            const danwayEmployees: Employee[] = (empData.data || []).map((e: any) => ({ ...e, type: 'Danway' }));

            // Fetch Hired Employees
            const hiredRes = await fetch("/api/hired-employees");
            const hiredData = await hiredRes.json();
            const hiredEmployees: Employee[] = (hiredData.data || []).map((e: any) => ({ ...e, type: 'Hired' }));

            const allEmployees = [...danwayEmployees, ...hiredEmployees];

            // 2. Fetch Punches for selected date AND previous day (so night
            // shifts starting on D-1 evening can be attributed to D).
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const prevDateStr = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
            const [punchRes, prevPunchRes] = await Promise.all([
                fetch(`/api/punch/records?date=${dateStr}`, { cache: 'no-store' }),
                fetch(`/api/punch/records?date=${prevDateStr}`, { cache: 'no-store' }),
            ]);
            const [punchData, prevPunchData] = await Promise.all([
                punchRes.json(),
                prevPunchRes.json(),
            ]);
            const allPunches: PunchRecord[] = [
                ...(punchData.data || []),
                ...(prevPunchData.data || []),
            ];

            setEmployees(allEmployees);
            setPunches(allPunches);

            processStats(allEmployees, allPunches);

        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const processStats = (emps: Employee[], punches: PunchRecord[]) => {
        const dMap = new Map<string, DesignationStats>();
        const hMap = new Map<string, DesignationStats>();
        
        const dSum = { total: 0, day: 0, night: 0, absent: 0 };
        const hSum = { total: 0, day: 0, night: 0, absent: 0 };
        
        const dAbsents: Employee[] = [];
        const hAbsents: Employee[] = [];

        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const prevDateStr = format(subDays(selectedDate, 1), 'yyyy-MM-dd');

        emps.forEach(emp => {
            if (emp.status !== 'active') return;

            // All punches for this person across the selected date and
            // the previous day (night-shift overflow window).
            const empPunches = punches.filter(
                (p: any) => p.employeeId === emp.id || p.hiredEmployeeId === emp.id
            );

            const isNightEmployee = emp.shift?.toLowerCase().startsWith('night');
            let shiftType: 'Day' | 'Night' | 'Absent' = 'Absent';

            for (const p of empPunches) {
                if (!p.punchIn) continue;
                const hour = parseInt(p.punchIn.split(':')[0]);
                // PunchRecord.date arrives as an ISO string; compare its YYYY-MM-DD prefix.
                const punchDateStr = typeof p.date === 'string'
                    ? p.date.slice(0, 10)
                    : format(new Date(p.date), 'yyyy-MM-dd');

                // Night shift attributed to selected date D:
                //   - punch on D-1 with punchIn 17:00-23:59, OR
                //   - punch on D   with punchIn 00:00-04:59
                // Requires employee is stored as Night shift (stricter match).
                if (isNightEmployee) {
                    const prevEveningNight =
                        punchDateStr === prevDateStr && hour >= 17;
                    const earlyMorningNight =
                        punchDateStr === selectedDateStr && hour < 5;
                    if (prevEveningNight || earlyMorningNight) {
                        shiftType = 'Night';
                        break;
                    }
                }

                // Day shift: punch on D with punchIn 05:00-16:59.
                if (
                    punchDateStr === selectedDateStr &&
                    hour >= 5 && hour < 17 &&
                    shiftType === 'Absent'
                ) {
                    shiftType = 'Day';
                }

                // Punches on D with hour >= 17 belong to D+1 — dropped here.
            }

            const isHired = (emp as any).type === 'Hired';
            const sum = isHired ? hSum : dSum;
            const mapToUse = isHired ? hMap : dMap;
            const absentArr = isHired ? hAbsents : dAbsents;

            sum.total++;
            if (shiftType === 'Day') sum.day++;
            else if (shiftType === 'Night') sum.night++;
            else {
                sum.absent++;
                absentArr.push(emp);
            }

            const desig = emp.designation || 'Unknown';
            if (!mapToUse.has(desig)) {
                mapToUse.set(desig, { designation: desig, dayShift: 0, nightShift: 0, absent: 0, total: 0 });
            }
            const group = mapToUse.get(desig)!;

            if (shiftType === 'Day') group.dayShift++;
            else if (shiftType === 'Night') group.nightShift++;
            else group.absent++;

            group.total++;
        });

        setDanwayStats(Array.from(dMap.values()).sort((a, b) => b.total - a.total));
        setHiredStats(Array.from(hMap.values()).sort((a, b) => b.total - a.total));
        
        setDanwaySummary(dSum);
        setHiredSummary(hSum);
        
        setDanwayAbsentList(dAbsents);
        setHiredAbsentList(hAbsents);
    };

    const chartData = [
        { name: "Day Shift", value: summary.day, color: "#10b981" },
        { name: "Night Shift", value: summary.night, color: "#64748b" },
        { name: "Absent", value: summary.absent, color: "#ef4444" },
    ];

    const handleExport = (type: 'excel' | 'pdf') => {
        if (type === 'pdf') {
            window.print();
        } else {
            toast.success(`Exporting ${type === 'excel' ? 'Excel' : 'PDF'} report...`);
            // TODO: Implement Excel export logic
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-0 bg-slate-50/50 print:bg-white print:h-auto print:overflow-visible">
            <style jsx global>{`
                @media print {
                    @page { margin: 10mm; size: landscape; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                    .overflow-y-auto, .h-screen, .flex-1, html, body { overflow: visible !important; height: auto !important; }
                    ::-webkit-scrollbar { display: none; }
                    .no-print, nav, header, aside, .print-hidden { display: none !important; }
                    /* Force background colors */
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-emerald-500 { background-color: #10b981 !important; }
                    .bg-slate-500 { background-color: #64748b !important; }
                    .bg-red-500 { background-color: #ef4444 !important; }
                }
            `}</style>

            {/* Print Header */}
            <div className="hidden print:block p-8 pb-4 border-b-2 border-slate-900 mb-6 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl">D</div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">DANWAY EME</h1>
                            <p className="text-sm text-slate-600 font-bold uppercase tracking-widest mt-0.5">Industrial & Energy Division</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Daily Manpower Report</h2>
                        <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                                <span>Project:</span>
                                <span className="font-bold text-slate-900">D657 Daralhai - Civil</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                                <span>Date:</span>
                                <span className="font-bold text-slate-900">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1600px] w-full mx-auto p-6 space-y-6">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manpower Report</h1>
                        <p className="text-muted-foreground">Workforce statistics and department breakdown for D657</p>
                    </div>
                    <div className="flex items-center gap-2">
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

                        <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
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
                            <div className="text-2xl font-bold">{summary.total}</div>
                            <p className="text-xs text-muted-foreground">Active workforce on site</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Day Shift</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.day}</div>
                            <p className="text-xs text-muted-foreground">Workers present today</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Night Shift</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.night}</div>
                            <p className="text-xs text-muted-foreground">Workers scheduled tonight</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Absent</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.absent}</div>
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
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
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
                                        {stats.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No data available for this date.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stats.map((row, index) => (
                                                <TableRow key={row.designation}>
                                                    <TableCell className="text-muted-foreground font-mono text-xs py-3">{index + 1}</TableCell>
                                                    <TableCell className="font-semibold text-xs py-3">{row.designation}</TableCell>
                                                    <TableCell className="text-center text-blue-600 font-bold text-xs py-3">{row.dayShift || "-"}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground text-xs py-3">{row.nightShift || "-"}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-bold text-xs py-3">{row.absent || "-"}</TableCell>
                                                    <TableCell className="text-right font-bold text-xs py-3 pr-6">{row.total}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        {/* Total Row */}
                                        <TableRow className="bg-slate-50/50 font-bold border-t-2">
                                            <TableCell className="text-xs uppercase tracking-wider py-4" colSpan={2}>Total</TableCell>
                                            <TableCell className="text-center text-blue-700 text-sm py-4">{summary.day}</TableCell>
                                            <TableCell className="text-center text-slate-500 text-sm py-4">{summary.night}</TableCell>
                                            <TableCell className="text-center text-red-600 text-sm py-4">{summary.absent}</TableCell>
                                            <TableCell className="text-right text-slate-900 text-base py-4 pr-6">{summary.total}</TableCell>
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
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold leading-none">{summary.total}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground font-medium mt-1">Total</span>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="space-y-3 flex-1 pl-4">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Day Shift</p>
                                                <p className="text-sm font-bold">{summary.day} Workers ({summary.total > 0 ? Math.round((summary.day / summary.total) * 100) : 0}%)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Night Shift</p>
                                                <p className="text-sm font-bold">{summary.night} Workers ({summary.total > 0 ? Math.round((summary.night / summary.total) * 100) : 0}%)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Absent</p>
                                                <p className="text-sm font-bold">{summary.absent} Workers ({summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0}%)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Absent List */}
                        <Card className="shadow-sm border-l-4 border-l-red-500 bg-red-50/20 max-h-[400px] overflow-y-auto">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <CardTitle className="text-sm font-bold text-red-700">Absent Today ({absentList.length})</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {absentList.length === 0 ? (
                                        <li className="text-xs text-muted-foreground">No absent workers</li>
                                    ) : (
                                        absentList.map((worker) => (
                                            <li key={worker.id} className="text-xs font-medium text-red-900 flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                                <span className="font-bold">{worker.employeeId}</span> - {worker.name} ({worker.designation})
                                            </li>
                                        ))
                                    )}
                                </ul>
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
                                Manpower report generated automatically based on daily punch records.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-xs font-bold whitespace-nowrap print:hidden">
                        ADD REMARK
                    </Button>
                </div>

            </main>
        </div>
    );
}
