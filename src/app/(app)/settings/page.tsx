"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Settings, Moon, Clock, Save, CalendarRange, CalendarDays, Trash2, Plus, Database, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SystemSettings {
    id: string;
    siteStartTime: string | null;
    lunchHours: number;
    ramadanLunchHours: number;
    ramadanActive: boolean;
    ramadanStart: string | null;
    ramadanEnd: string | null;
}

interface PublicHoliday {
    id: string;
    date: string;
    name: string;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const [siteStartTime, setSiteStartTime] = useState<string>("");
    const [lunchHours, setLunchHours] = useState<string>("1.0");
    const [ramadanLunchHours, setRamadanLunchHours] = useState<string>("0.5");
    const [ramadanActive, setRamadanActive] = useState(false);
    const [ramadanStart, setRamadanStart] = useState<Date | undefined>(undefined);
    const [ramadanEnd, setRamadanEnd] = useState<Date | undefined>(undefined);

    // Holidays state
    const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
    const [newHolidayName, setNewHolidayName] = useState("");
    const [isAddingHoliday, setIsAddingHoliday] = useState(false);
    const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);
    const [isHolidayCalOpen, setIsHolidayCalOpen] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await fetch("/api/holidays");
            const result = await res.json();
            if (result.success) setHolidays(result.data);
        } catch {
            toast.error("Failed to load holidays");
        }
    };

    const handleAddHoliday = async () => {
        if (!newHolidayDate || !newHolidayName.trim()) {
            toast.error("Please select a date and enter a holiday name");
            return;
        }
        setIsAddingHoliday(true);
        try {
            const res = await fetch("/api/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(newHolidayDate, "yyyy-MM-dd"),
                    name: newHolidayName.trim(),
                }),
            });
            const result = await res.json();
            if (result.success) {
                toast.success(`✅ Holiday "${newHolidayName}" added`);
                setNewHolidayDate(undefined);
                setNewHolidayName("");
                fetchHolidays();
            } else {
                toast.error(`❌ ${result.error}`);
            }
        } catch {
            toast.error("Failed to add holiday");
        } finally {
            setIsAddingHoliday(false);
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        setDeletingHolidayId(id);
        try {
            const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                toast.success("Holiday deleted");
                fetchHolidays();
            } else {
                toast.error(`❌ ${result.error}`);
            }
        } catch {
            toast.error("Failed to delete holiday");
        } finally {
            setDeletingHolidayId(null);
        }
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings");
            const result = await res.json();
            if (result.success) {
                const s: SystemSettings = result.data;
                // Normalize to string values that match Select options
                setSiteStartTime(s.siteStartTime || "");
                setLunchHours(s.lunchHours >= 2 ? "2.0" : s.lunchHours <= 0.5 ? "0.5" : "1.0");
                setRamadanLunchHours(s.ramadanLunchHours === 0 ? "0" : s.ramadanLunchHours <= 0.5 ? "0.5" : "1.0");
                setRamadanActive(s.ramadanActive);
                if (s.ramadanStart) setRamadanStart(new Date(s.ramadanStart));
                if (s.ramadanEnd) setRamadanEnd(new Date(s.ramadanEnd));
            }
        } catch {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body: any = {
                siteStartTime: siteStartTime || null,
                lunchHours: parseFloat(lunchHours),
                ramadanLunchHours: parseFloat(ramadanLunchHours),
                ramadanActive,
                ramadanStart: ramadanStart ? format(ramadanStart, "yyyy-MM-dd") : null,
                ramadanEnd: ramadanEnd ? format(ramadanEnd, "yyyy-MM-dd") : null,
            };

            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            if (result.success) {
                toast.success("✅ Settings saved successfully. Run Calculate on Attendance page to apply.");
            } else {
                toast.error(`❌ Failed to save: ${result.error}`);
            }
        } catch {
            toast.error("❌ Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleClearDatabase = async () => {
        setIsClearing(true);
        try {
            const res = await fetch("/api/settings/clear-database", { method: "POST" });
            const result = await res.json();
            if (result.success) {
                toast.success(result.message || "Database cleared successfully!");
            } else {
                toast.error(result.error || "Failed to clear database");
            }
        } catch {
            toast.error("Failed to connect to the server");
        } finally {
            setIsClearing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-foreground p-2">
                    <Settings className="h-5 w-5 text-background" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-sm text-muted-foreground">Attendance calculation configuration</p>
                </div>
            </div>

            {/* General Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">General Settings</h2>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Site Start Time</Label>
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px]">
                                Punch-ins before this time are capped. E.g., if set to 06:30, a 05:30 punch-in starts counting at 06:30. Clear to disable.
                            </p>
                        </div>
                        <Input
                            type="time"
                            value={siteStartTime}
                            onChange={(e) => setSiteStartTime(e.target.value)}
                            className="w-[160px]"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Lunch Hour Deduction</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Deducted from gross hours on all non-Sunday working days
                            </p>
                        </div>
                        <Select value={lunchHours} onValueChange={setLunchHours}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2.0">2 Hours</SelectItem>
                                <SelectItem value="1.0">1 Hour (60 min)</SelectItem>
                                <SelectItem value="0.5">30 Minutes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Ramadan Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Ramadan Period</h2>
                </div>

                <div className="space-y-6">
                    {/* Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Enable Ramadan Mode</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                +2 hours bonus applied to all days in the selected period
                            </p>
                        </div>
                        <Switch
                            checked={ramadanActive}
                            onCheckedChange={setRamadanActive}
                        />
                    </div>

                    {/* Ramadan Lunch Hours */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Ramadan Lunch Deduction</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Lunch deduction applied during the Ramadan period only
                            </p>
                        </div>
                        <Select value={ramadanLunchHours} onValueChange={setRamadanLunchHours} disabled={!ramadanActive}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1.0">1 Hour (60 min)</SelectItem>
                                <SelectItem value="0.5">30 Minutes</SelectItem>
                                <SelectItem value="0">No Deduction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Rules summary */}
                    {ramadanActive && (
                        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4 text-sm space-y-1">
                            <p className="font-semibold text-amber-800 dark:text-amber-300">Ramadan Calculation Rules</p>
                            <ul className="text-amber-700 dark:text-amber-400 list-disc ml-4 space-y-0.5 text-xs">
                                <li>Minimum guaranteed: <strong>8 Normal hours</strong> per day (regardless of actual work)</li>
                                <li>Workers: +2 hours added as <strong>Overtime (OT)</strong></li>
                                <li>Engineers/Staff: +2 hours added as <strong>Normal hours</strong></li>
                                <li>If worked 8h → counted as <strong>10h total</strong> (8N + 2OT for workers)</li>
                            </ul>
                        </div>
                    )}

                    {/* Date pickers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Ramadan Starts</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 font-normal"
                                        disabled={!ramadanActive}
                                    >
                                        <CalendarRange className="h-4 w-4" />
                                        {ramadanStart ? format(ramadanStart, "dd MMM yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={ramadanStart}
                                        onSelect={setRamadanStart}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Ramadan Ends</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 font-normal"
                                        disabled={!ramadanActive}
                                    >
                                        <CalendarRange className="h-4 w-4" />
                                        {ramadanEnd ? format(ramadanEnd, "dd MMM yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={ramadanEnd}
                                        onSelect={setRamadanEnd}
                                        disabled={ramadanStart ? { before: ramadanStart } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {ramadanActive && ramadanStart && ramadanEnd && (
                        <p className="text-xs text-muted-foreground">
                            Ramadan bonus will apply to <strong>{format(ramadanStart, "dd MMM")} – {format(ramadanEnd, "dd MMM yyyy")}</strong>
                        </p>
                    )}
                </div>
            </Card>

            {/* Public Holidays */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Public Holidays</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Workers who punch on these dates will have <strong>all hours recorded as EOT</strong>. Staff on public holidays will have <strong>no record created</strong>.
                </p>

                {/* Existing Holidays */}
                <div className="space-y-2 mb-5">
                    {holidays.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-slate-50">No public holidays configured yet.</p>
                    ) : (
                        holidays.map((h) => (
                            <div key={h.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <span className="font-medium text-sm">{h.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{format(new Date(h.date), "dd MMM yyyy")}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={deletingHolidayId === h.id}
                                    onClick={() => handleDeleteHoliday(h.id)}
                                >
                                    {deletingHolidayId === h.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add New Holiday */}
                <div className="flex gap-2 items-end">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Popover open={isHolidayCalOpen} onOpenChange={setIsHolidayCalOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[160px] justify-start gap-2 font-normal">
                                    <CalendarRange className="h-4 w-4" />
                                    {newHolidayDate ? format(newHolidayDate, "dd MMM yyyy") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={newHolidayDate}
                                    onSelect={(d) => { setNewHolidayDate(d); setIsHolidayCalOpen(false); }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Holiday Name</Label>
                        <Input
                            placeholder="e.g. Eid Al Fitr"
                            value={newHolidayName}
                            onChange={(e) => setNewHolidayName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddHoliday()}
                        />
                    </div>
                    <Button
                        onClick={handleAddHoliday}
                        disabled={isAddingHoliday}
                        className="gap-1.5 shrink-0"
                    >
                        {isAddingHoliday ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                    </Button>
                </div>
            </Card>

            {/* Database Management / Clear Memory */}
            <Card className="p-6 border-red-200 bg-red-50/30">
                <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-red-600">Calculator Memory</h2>
                </div>
                <p className="text-sm text-red-600/80 mb-6">
                    This will instantly delete all Employees, Punch Records, and Attendance data from the live database. Use this to start fresh before uploading a new calculation batch. System settings, vendors, and holidays will NOT be deleted.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2" disabled={isClearing}>
                            {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                            Clear All Calculator Memory
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete <strong>everyone's</strong> employee and attendance records from the server right now.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearDatabase} className="bg-red-600 hover:bg-red-700">
                                Yes, Clear Database
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
