"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";

interface DashboardData {
  totalManpower: number;
  currentlyPresent: number;
  lateArrivals: number;
  missingPunches: number;
  attendanceRate: number;
  date: string;
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const displayDate = data ? new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Loading...";

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening at Site D658 today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate}
          </Button>
          <Button asChild>
            <Link href="/manpower"><FileText className="mr-2 h-4 w-4" /> Daily Summary</Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Manpower</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : data?.totalManpower}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              Active workforce
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : data?.currentlyPresent}</div>
            <p className="text-xs text-muted-foreground mt-1">{loading ? "..." : `${data?.attendanceRate}%`} attendance rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : data?.lateArrivals}</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-600 font-medium">Requires verification</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Missing Punches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : data?.missingPunches}</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-600 font-medium font-medium">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/attendance">
              <Card className="hover:bg-accent transition-colors cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Attendance Manager
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </CardTitle>
                  <CardDescription>Review and mark daily attendance, sync with SAP.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/manpower">
              <Card className="hover:bg-accent transition-colors cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Manpower Analytics
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </CardTitle>
                  <CardDescription>Department breakdowns and workforce utilization reports.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from Site D657</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { time: "09:15 AM", user: "Ahmed", action: "submitted SAP sync", site: "D657" },
                  { time: "08:30 AM", user: "system", action: "imported 156 punches", site: "D657" },
                  { time: "Yesterday", user: "Manager", action: "exported daily report", site: "Global" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-slate-100 rounded-full p-2 mt-0.5">
                      <Clock className="h-3 w-3 text-slate-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-bold">{item.user}</span> {item.action} for site <span className="font-medium">{item.site}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Critical Alerts</h2>
          <div className="space-y-4">
            <Card className="bg-red-50 border-red-100">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <CardTitle className="text-sm font-bold">Unmapped Punches</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-red-600 leading-relaxed">
                  8 workers have missing punch-out data. This will affect their shift calculation if not corrected.
                </p>
                <Button variant="link" className="text-red-700 p-0 h-auto text-xs font-bold mt-2" asChild>
                  <Link href="/attendance">Resolve Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-100">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                  <CardTitle className="text-sm font-bold">Upcoming Shift Change</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Night shift rotation starts in 4 hours. Ensure all day shift data is synced to SAP before 6:00 PM.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-100 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SAP Integration</span>
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
