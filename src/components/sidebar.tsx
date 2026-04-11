"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileBox,
    BarChart3,
    Settings,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    UserPlus,
    Clock
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/client-session";

const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: UserCheck },
    { name: "Extra Overtime", href: "/eot", icon: Clock },
    { name: "Manpower Report", href: "/manpower", icon: BarChart3 },
    { name: "Employee Management", href: "/employees", icon: Users },
    { name: "Hired Employees", href: "/hired-employees", icon: UserPlus },
    { name: "Hired Timesheet", href: "/hired-timesheet", icon: ClipboardList },
    { name: "Project Documents", href: "#", icon: FileBox },
];

const secondaryItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help & Support", href: "#", icon: HelpCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { session } = useSession();

    return (
        <div className={cn(
            "flex flex-col border-r bg-background transition-all duration-300 ease-in-out print:hidden",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className="flex h-20 items-center justify-between px-4 border-b">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                            <span className="text-background font-bold text-base">D</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">DANWAY</span>
                    </div>
                )}
                {collapsed && (
                    <div className="mx-auto">
                        <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                            <span className="text-background font-bold text-base">D</span>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-foreground" : "text-muted-foreground")} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    ))}
                </div>

                <div className="space-y-1">
                    <div className={cn("px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider", collapsed && "hidden")}>
                        Support
                    </div>
                    {secondaryItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t">
                {!collapsed ? (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Active Project</p>
                        <p className="text-sm font-bold text-foreground">{session?.siteCode ?? "—"} — {session?.siteName ?? "Loading..."}</p>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="h-2 w-2 rounded-full bg-green-500" title={session?.siteCode ? `Active Project ${session.siteCode}` : "Active Project"} />
                    </div>
                )}
            </div>
        </div>
    );
}
