"use client";

import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    User,
    LogOut,
    Settings,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";
import { useSession, clearSessionCache } from "@/lib/auth/client-session";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [date, setDate] = useState<Date>(new Date());
    const { session } = useSession();

    const getPageTitle = () => {
        switch (pathname) {
            case "/": return "Dashboard Overview";
            case "/attendance": return "Attendance Management";
            case "/manpower": return "Manpower Report";
            default: return "Dashboard";
        }
    };

    const siteLabel = session?.siteName
        ? `${session.siteCode} — ${session.siteName}`
        : session?.siteCode ?? "Loading...";

    const initials = session?.siteCode
        ? session.siteCode.slice(0, 2).toUpperCase()
        : session?.role === "admin" ? "SA" : "TK";

    const displayName = session?.role === "admin"
        ? "Super Admin"
        : (session?.siteName ?? session?.siteCode ?? "Timekeeper");

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        clearSessionCache();
        router.push("/login");
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm print:hidden">
            <div className="flex h-20 items-center px-8">
                {/* Left Section - Title */}
                <div className="flex items-center gap-6 flex-1">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{getPageTitle()}</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">DANWAY EME Workforce System</p>
                    </div>
                </div>

                {/* Right Section - Controls */}
                <div className="flex items-center gap-6">
                    <ModeToggle />

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* Site Display */}
                    <div className="hidden lg:flex flex-col gap-1 text-right">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Project</label>
                        <div className="text-sm font-semibold">{siteLabel}</div>
                    </div>

                    {/* Date Picker */}
                    <div className="hidden md:flex flex-col gap-1 text-right">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Report Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-56 h-8 text-xs justify-end font-normal">
                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                    {format(date, "EEEE, MMMM d, yyyy")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="hidden md:block h-10 w-px bg-border mx-2" />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-12 gap-3 px-2 hover:bg-accent rounded-xl">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-foreground text-background font-semibold">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="hidden lg:flex flex-col items-start leading-none gap-1">
                                    <span className="text-sm font-semibold">{displayName}</span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase tracking-tighter bg-accent/50">
                                        {session?.role === "admin" ? "Admin" : "Timekeeper"}
                                    </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2">
                            <DropdownMenuLabel className="p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-slate-100 font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold">{displayName}</p>
                                        <p className="text-xs text-muted-foreground">{session?.role === "admin" ? "Super Administrator" : `Site: ${session?.siteCode ?? "—"}`}</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="py-2.5 rounded-lg px-4 flex items-center gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
