"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Shield } from "lucide-react";
import { clearSessionCache } from "@/lib/auth/client-session";

export function AdminHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearSessionCache();
    router.push("/login");
  }

  return (
    <header className="border-b bg-background px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-sm">DANWAY EME</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Super Admin</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
