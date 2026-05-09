"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search, Trash2 } from "lucide-react";

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    shift: string;
    type: "Danway" | "Hired";
}

function PrintSheet({ employees }: { employees: Employee[] }) {
    return (
        <section className="print-section">
            <style jsx>{`
                .print-section { font-family: Arial, sans-serif; color: #000; background: #fff; }
                .sheet-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
                .company { font-size: 17px; font-weight: 800; letter-spacing: 1px; }
                .sheet-title { font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: right; }
                .meta { display: flex; gap: 40px; margin-bottom: 10px; font-size: 11px; }
                .meta-field { display: flex; align-items: center; gap: 6px; font-weight: 600; }
                .blank-line { display: inline-block; border-bottom: 1px solid #000; }
                .att-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                .att-table th { border: 1px solid #000; padding: 5px 6px; text-align: left; font-weight: 700; background: #e8e8e8; text-transform: uppercase; font-size: 10px; }
                .att-table td { border: 1px solid #000; padding: 4px 6px; height: 22px; font-size: 11px; }
                .col-no { width: 28px; text-align: center; }
                .col-id { width: 90px; }
                .col-name { width: 30%; }
                .col-desig { width: 25%; }
                .col-sig { width: auto; }
                .footer { margin-top: 14px; display: flex; justify-content: flex-end; font-size: 11px; font-weight: 600; gap: 8px; align-items: center; }
                .sig-line { display: inline-block; width: 220px; border-bottom: 1px solid #000; }
            `}</style>

            <div className="sheet-top">
                <div className="company">DANWAY EME</div>
                <div className="sheet-title">Attendance Sign-In Sheet</div>
            </div>

            <div className="meta">
                <div className="meta-field">Date: <span className="blank-line" style={{ width: 120 }} /></div>
                <div className="meta-field">Foreman / Gang: <span className="blank-line" style={{ width: 160 }} /></div>
                <div className="meta-field">Site: <span className="blank-line" style={{ width: 70 }} /></div>
            </div>

            <table className="att-table">
                <thead>
                    <tr>
                        <th className="col-no">#</th>
                        <th className="col-id">Employee ID</th>
                        <th className="col-name">Name</th>
                        <th className="col-desig">Designation</th>
                        <th className="col-sig">Signature</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, i) => (
                        <tr key={emp.id}>
                            <td className="col-no" style={{ textAlign: "center", fontSize: 10, color: "#555" }}>{i + 1}</td>
                            <td className="col-id">{emp.employeeId}</td>
                            <td className="col-name">{emp.name}</td>
                            <td className="col-desig">{emp.designation}</td>
                            <td className="col-sig" />
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="footer">
                Supervisor Signature: <span className="sig-line" />
            </div>
        </section>
    );
}

export default function AttendanceToolboxPage() {
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [selected, setSelected] = useState<Employee[]>([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"All" | "Danway" | "Hired">("All");
    const [shiftFilter, setShiftFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    // Bulk selection state
    const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set());
    const [rightChecked, setRightChecked] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function load() {
            const [dRes, hRes] = await Promise.all([
                fetch("/api/employees"),
                fetch("/api/hired-employees"),
            ]);
            const dData = await dRes.json();
            const hData = await hRes.json();

            const danway: Employee[] = (dData.data ?? []).map((e: any) => ({
                id: `d-${e.id}`,
                employeeId: e.employeeId,
                name: e.name,
                designation: e.designation,
                shift: e.shift,
                type: "Danway" as const,
            }));

            const hired: Employee[] = (hData.data ?? []).map((e: any) => ({
                id: `h-${e.id}`,
                employeeId: e.employeeId,
                name: e.name,
                designation: e.designation,
                shift: e.shift,
                type: "Hired" as const,
            }));

            setAllEmployees([...danway, ...hired]);
            setLoading(false);
        }
        load();
    }, []);

    const shifts = useMemo(() => {
        const s = new Set(allEmployees.map((e) => e.shift).filter(Boolean));
        return ["All", ...Array.from(s)];
    }, [allEmployees]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return allEmployees.filter((e) => {
            if (typeFilter !== "All" && e.type !== typeFilter) return false;
            if (shiftFilter !== "All" && e.shift !== shiftFilter) return false;
            if (q && !e.name.toLowerCase().includes(q) && !e.employeeId.toLowerCase().includes(q) && !e.designation.toLowerCase().includes(q)) return false;
            if (selected.some((s) => s.id === e.id)) return false;
            return true;
        });
    }, [allEmployees, typeFilter, shiftFilter, search, selected]);

    // Left panel: toggle checkbox
    function toggleLeft(id: string) {
        setLeftChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAllLeft() {
        if (leftChecked.size === filtered.length && filtered.length > 0) {
            setLeftChecked(new Set());
        } else {
            setLeftChecked(new Set(filtered.map((e) => e.id)));
        }
    }

    function addChecked() {
        const toAdd = filtered.filter((e) => leftChecked.has(e.id));
        setSelected((prev) => [...prev, ...toAdd]);
        setLeftChecked(new Set());
    }

    // Right panel: toggle checkbox
    function toggleRight(id: string) {
        setRightChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAllRight() {
        if (rightChecked.size === selected.length && selected.length > 0) {
            setRightChecked(new Set());
        } else {
            setRightChecked(new Set(selected.map((e) => e.id)));
        }
    }

    function removeChecked() {
        setSelected((prev) => prev.filter((e) => !rightChecked.has(e.id)));
        setRightChecked(new Set());
    }

    const allLeftChecked = filtered.length > 0 && leftChecked.size === filtered.length;
    const someLeftChecked = leftChecked.size > 0 && !allLeftChecked;
    const allRightChecked = selected.length > 0 && rightChecked.size === selected.length;

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; size: A4 portrait; }
                    * { box-sizing: border-box; }
                    body, html { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .print-section { page-break-after: always; padding: 0; }
                    .print-section:last-child { page-break-after: avoid; }
                    nav, header, aside { display: none !important; }
                    .print-wrapper { display: block !important; margin: 0; padding: 0; }
                }
            `}</style>

            {/* Header controls */}
            <div className="no-print p-6 border-b bg-background">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Attendance Sign-In Sheet</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Select employees — they sign on the printed sheet</p>
                    </div>
                    <Button onClick={() => window.print()} disabled={selected.length === 0}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Sheet ({selected.length})
                    </Button>
                </div>
            </div>

            <div className="no-print flex h-[calc(100vh-120px)]">
                {/* LEFT: picker */}
                <div className="w-[420px] border-r flex flex-col">
                    {/* Filters */}
                    <div className="p-4 border-b space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search name, ID, designation…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {(["All", "Danway", "Hired"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${typeFilter === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
                                >
                                    {t}
                                </button>
                            ))}
                            <select
                                value={shiftFilter}
                                onChange={(e) => setShiftFilter(e.target.value)}
                                className="ml-auto text-xs border rounded px-2 py-1 bg-background"
                            >
                                {shifts.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Bulk-add toolbar */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
                        <input
                            type="checkbox"
                            checked={allLeftChecked}
                            ref={(el) => { if (el) el.indeterminate = someLeftChecked; }}
                            onChange={toggleAllLeft}
                            className="h-4 w-4 rounded border-border cursor-pointer"
                            disabled={filtered.length === 0}
                        />
                        <span className="text-xs text-muted-foreground flex-1">
                            {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
                            {leftChecked.size > 0 && ` · ${leftChecked.size} selected`}
                        </span>
                        {leftChecked.size > 0 && (
                            <Button size="sm" variant="default" onClick={addChecked} className="h-7 text-xs px-3">
                                Add {leftChecked.size}
                            </Button>
                        )}
                    </div>

                    {/* Employee list */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
                        ) : filtered.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">No employees match</p>
                        ) : (
                            filtered.map((emp) => (
                                <label
                                    key={emp.id}
                                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-accent cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={leftChecked.has(emp.id)}
                                        onChange={() => toggleLeft(emp.id)}
                                        className="h-4 w-4 rounded border-border cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{emp.name}</div>
                                        <div className="text-xs text-muted-foreground">{emp.employeeId} · {emp.designation}</div>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${emp.type === "Danway" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                                        {emp.type}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: selected */}
                <div className="flex-1 flex flex-col">
                    {/* Bulk-delete toolbar */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
                        <input
                            type="checkbox"
                            checked={allRightChecked}
                            ref={(el) => {
                                if (el) el.indeterminate = rightChecked.size > 0 && !allRightChecked;
                            }}
                            onChange={toggleAllRight}
                            className="h-4 w-4 rounded border-border cursor-pointer"
                            disabled={selected.length === 0}
                        />
                        <span className="text-xs text-muted-foreground flex-1">
                            {selected.length} selected
                            {rightChecked.size > 0 && ` · ${rightChecked.size} marked`}
                        </span>
                        {rightChecked.size > 0 && (
                            <Button size="sm" variant="destructive" onClick={removeChecked} className="h-7 text-xs px-3 gap-1.5">
                                <Trash2 className="h-3 w-3" />
                                Remove {rightChecked.size}
                            </Button>
                        )}
                    </div>

                    {/* Selected list */}
                    <div className="flex-1 overflow-y-auto">
                        {selected.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                Check employees on the left and click Add
                            </div>
                        ) : (
                            selected.map((emp, i) => (
                                <label
                                    key={emp.id}
                                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-accent cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={rightChecked.has(emp.id)}
                                        onChange={() => toggleRight(emp.id)}
                                        className="h-4 w-4 rounded border-border cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{emp.name}</div>
                                        <div className="text-xs text-muted-foreground">{emp.employeeId} · {emp.designation}</div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Print target */}
            <div className="print-wrapper hidden print:block p-0">
                {selected.length > 0 && <PrintSheet employees={selected} />}
            </div>
        </>
    );
}
