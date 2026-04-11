"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, RefreshCw, Copy, Check, AlertTriangle,
  Loader2, CloudUpload, Trash2, KeyRound, Eye, EyeOff
} from "lucide-react";

interface SAPMapping {
  id: string;
  designation: string;
  network: string;
  activity: string;
  element: string;
}

interface SiteDetail {
  id: string;
  code: string;
  name: string;
  loginId: string;
  createdAt: string;
  plainPassword: string | null;
  sapMappings: SAPMapping[];
  _count: { employees: number; hiredEmployees: number };
}

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copiedPw, setCopiedPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);

  // Set custom password dialog
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [showCustomPw, setShowCustomPw] = useState(false);
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState("");

  // Delete site dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function loadSite() {
    const r = await fetch(`/api/admin/sites/${siteId}`);
    if (r.ok) setSite(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadSite(); }, [siteId]);

  async function handleFileUpload(file: File) {
    if (!file) return;
    setUploadLoading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/admin/sites/${siteId}/sap-upload`, { method: "POST", body: fd });
    const data = await r.json();
    if (r.ok) { setUploadResult(data); loadSite(); }
    setUploadLoading(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  async function handleResetPassword() {
    setResetLoading(true);
    const r = await fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password" }),
    });
    const data = await r.json();
    if (r.ok) setNewPassword(data.plainPassword);
    setResetLoading(false);
    setResetOpen(false);
  }

  async function handleSetPassword() {
    setSetPasswordError("");
    if (customPassword.length < 6) {
      setSetPasswordError("Password must be at least 6 characters");
      return;
    }
    setSetPasswordLoading(true);
    const r = await fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-password", password: customPassword }),
    });
    const data = await r.json();
    if (r.ok) {
      setSetPasswordOpen(false);
      setCustomPassword("");
      setNewPassword(customPassword);
    } else {
      setSetPasswordError(data.error ?? "Failed to set password");
    }
    setSetPasswordLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError("");
    const r = await fetch(`/api/admin/sites/${siteId}`, { method: "DELETE" });
    const data = await r.json();
    if (r.ok) {
      router.push("/admin");
    } else {
      setDeleteError(data.error ?? "Failed to delete site");
      setDeleteLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!site) return <div className="p-6 text-sm text-destructive">Site not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back + title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{site.code} — {site.name}</h1>
            <p className="text-sm text-muted-foreground">
              Login ID: <code className="font-mono bg-muted px-1 rounded">{site.loginId}</code>
              &nbsp;·&nbsp;Created {new Date(site.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { setDeleteError(""); setDeleteConfirm(""); setDeleteOpen(true); }}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Site
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{site._count.employees}</div>
            <p className="text-sm text-muted-foreground">Danway Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{site._count.hiredEmployees}</div>
            <p className="text-sm text-muted-foreground">Hired Workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{site.sapMappings.length}</div>
            <p className="text-sm text-muted-foreground">SAP Code Mappings</p>
          </CardContent>
        </Card>
      </div>

      {/* Credentials */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Timekeeper Credentials</CardTitle>
              <CardDescription>Passwords are hashed and cannot be viewed — reset or set a new one.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCustomPassword(""); setSetPasswordError(""); setSetPasswordOpen(true); }}>
                <KeyRound className="h-4 w-4 mr-1.5" /> Set Password
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Generate Random
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 p-3 bg-muted rounded-lg text-sm font-mono">
            <div><span className="text-muted-foreground font-sans text-xs">Login ID</span><br />{site.loginId}</div>
            <div className="text-muted-foreground">·</div>
            <div className="flex items-center gap-2">
              <div>
                <span className="text-muted-foreground font-sans text-xs">Password</span><br />
                {site.plainPassword
                  ? (showCurrentPw ? site.plainPassword : "••••••••••")
                  : <span className="text-muted-foreground italic text-xs">unknown — set a new one</span>
                }
              </div>
              {site.plainPassword && (
                <>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => copy(site.plainPassword!)}>
                    {copiedPw ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New password display after reset/set */}
      {newPassword && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
              Password updated — save it now!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-muted px-3 py-2 rounded-md font-mono text-sm border">
                {newPassword}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(newPassword)}>
                {copiedPw ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewPassword(null)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SAP Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">SAP Code Upload</CardTitle>
          <CardDescription>
            Upload an Excel file with columns: Designation, Network, Activity, Element.
            Existing mappings for this site will be updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            {uploadLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <CloudUpload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drop Excel file here or click to browse</p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv accepted</p>
              </div>
            )}
          </div>

          {uploadResult && (
            <div className="flex items-center gap-6 p-3 bg-muted rounded-lg text-sm">
              <span className="text-green-600 font-medium">+{uploadResult.created} created</span>
              <span className="text-blue-600 font-medium">↑{uploadResult.updated} updated</span>
              {uploadResult.skipped > 0 && (
                <span className="text-amber-600 font-medium">{uploadResult.skipped} skipped</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SAP Mappings table */}
      {site.sapMappings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SAP Code Mappings ({site.sapMappings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Designation</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Network</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Activity</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Element</th>
                  </tr>
                </thead>
                <tbody>
                  {site.sapMappings.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-2">{m.designation}</td>
                      <td className="px-4 py-2 font-mono text-xs">{m.network}</td>
                      <td className="px-4 py-2 font-mono text-xs">{m.activity}</td>
                      <td className="px-4 py-2 font-mono text-xs">{m.element}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate random password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Password</DialogTitle>
            <DialogDescription>
              This will invalidate the current password for <strong>{site.name}</strong>.
              The timekeeper will need the new password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">The new password will be shown only once.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Generate Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set custom password dialog */}
      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>
              Set a custom password for the <strong>{site.name}</strong> timekeeper account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="custom-pw">New Password</Label>
              <div className="relative">
                <Input
                  id="custom-pw"
                  type={showCustomPw ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCustomPw(!showCustomPw)}
                >
                  {showCustomPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {setPasswordError && (
              <p className="text-sm text-destructive">{setPasswordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleSetPassword} disabled={setPasswordLoading}>
              {setPasswordLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Set Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete site dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); setDeleteConfirm(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{site.code} — {site.name}</strong>. This will also delete all employees,
              punch records, attendance records, hired workers, timesheets, and SAP codes for this site.
              <strong className="text-destructive"> This cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {site._count.employees} employee(s) · {site._count.hiredEmployees} hired worker(s) · {site.sapMappings.length} SAP codes — all will be deleted.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm" className="text-sm">
              Type <strong>{site.code}</strong> to confirm
            </Label>
            <Input
              id="delete-confirm"
              placeholder={site.code}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading || deleteConfirm !== site.code}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
