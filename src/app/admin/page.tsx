"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Building2, Users, FileSpreadsheet, ArrowRight, Trash2, AlertTriangle, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";

interface Site {
  id: string;
  code: string;
  name: string;
  loginId: string;
  createdAt: string;
  plainPassword: string | null;
  _count: { employees: number; hiredEmployees: number; sapMappings: number };
}

export default function AdminPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function togglePassword(id: string) {
    setVisiblePasswords((p) => ({ ...p, [id]: !p[id] }));
  }

  function copyPassword(id: string, pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function loadSites() {
    fetch("/api/admin/sites")
      .then((r) => r.json())
      .then(setSites)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadSites(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    const r = await fetch(`/api/admin/sites/${deleteTarget.id}`, { method: "DELETE" });
    const data = await r.json();
    if (r.ok) {
      setDeleteTarget(null);
      loadSites();
    } else {
      setDeleteError(data.error ?? "Failed to delete site");
    }
    setDeleteLoading(false);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage project sites, SAP codes, and timekeeper access
          </p>
        </div>
        <Link href="/admin/sites/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Site
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sites.length}</div>
            <p className="text-sm text-muted-foreground">Total Sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sites.reduce((s, x) => s + x._count.employees, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Danway Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sites.reduce((s, x) => s + x._count.hiredEmployees, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Hired Workers</p>
          </CardContent>
        </Card>
      </div>

      {/* Sites list */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading sites...</div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No sites yet</p>
            <p className="text-sm text-muted-foreground">Create your first site to get started</p>
            <Link href="/admin/sites/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Create Site
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {site.code.slice(1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{site.code}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{site.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Login ID: <code className="font-mono bg-muted px-1 rounded">{site.loginId}</code>
                        &nbsp;·&nbsp;Created {new Date(site.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{site._count.employees}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 opacity-50" />
                      <span>{site._count.hiredEmployees}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{site._count.sapMappings}</span>
                    </div>

                    {/* Password display */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
                      <span className="text-xs text-muted-foreground mr-1 font-mono">PW:</span>
                      <span className="font-mono text-xs min-w-[80px]">
                        {site.plainPassword
                          ? (visiblePasswords[site.id] ? site.plainPassword : "••••••••••")
                          : <span className="text-muted-foreground italic">not set</span>
                        }
                      </span>
                      {site.plainPassword && (
                        <>
                          <button
                            className="text-muted-foreground hover:text-foreground p-0.5"
                            onClick={() => togglePassword(site.id)}
                            title={visiblePasswords[site.id] ? "Hide" : "Show"}
                          >
                            {visiblePasswords[site.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            className="text-muted-foreground hover:text-foreground p-0.5"
                            onClick={() => copyPassword(site.id, site.plainPassword!)}
                            title="Copy password"
                          >
                            {copiedId === site.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setDeleteError(""); setDeleteTarget(site); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/sites/${site.id}`}>
                      <Button variant="outline" size="sm">
                        Manage <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{deleteTarget?.code} — {deleteTarget?.name}</strong>.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (deleteTarget._count.employees > 0 || deleteTarget._count.hiredEmployees > 0) ? (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                This site has {deleteTarget._count.employees} employee(s) and {deleteTarget._count.hiredEmployees} hired worker(s).
                Remove all employees first.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">SAP code mappings will also be deleted.</p>
            </div>
          )}
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleteLoading ||
                (deleteTarget ? deleteTarget._count.employees > 0 || deleteTarget._count.hiredEmployees > 0 : false)
              }
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
