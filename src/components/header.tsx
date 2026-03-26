"use client";

import { usePathname } from "next/navigation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";

export function Header() {
    const pathname = usePathname();
    const [date, setDate] = useState<Date>(new Date());

    // Derive page title from pathname
    const getPageTitle = () => {
        switch (pathname) {
            case "/": return "Dashboard Overview";
            case "/attendance": return "Attendance Management";
            case "/manpower": return "Manpower Report";
            default: return "Dashboard";
        }
    };

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
                    {/* Theme Toggle */}
                    <ModeToggle />

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* Project Display */}
                    <div className="hidden lg:flex flex-col gap-1 text-right">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Project</label>
                        <div className="text-sm font-semibold">D657 Daralhai - Civil</div>
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

                    {/* Separator */}
                    <div className="hidden md:block h-10 w-px bg-border mx-2" />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-12 gap-3 px-2 hover:bg-accent rounded-xl">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-foreground text-background font-semibold">TK</AvatarFallback>
                                </Avatar>
                                <div className="hidden lg:flex flex-col items-start leading-none gap-1">
                                    <span className="text-sm font-semibold">John Timekeeper</span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase tracking-tighter bg-accent/50">Admin</Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2">
                            <DropdownMenuLabel className="p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-slate-100 font-bold">TK</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold">John Timekeeper</p>
                                        <p className="text-xs text-muted-foreground truncate w-40">john.tk@danway.ae</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="py-2">
                                <DropdownMenuItem className="py-2.5 rounded-lg px-4 flex items-center gap-3">
                                    <User className="h-4 w-4" />
                                    <span>My Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="py-2.5 rounded-lg px-4 flex items-center gap-3">
                                    <Settings className="h-4 w-4" />
                                    <span>Account Settings</span>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="py-2.5 rounded-lg px-4 flex items-center gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <LogOut className="h-4 w-4" />
                                <span>Logout Session</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
