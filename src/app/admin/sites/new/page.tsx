"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Copy, Check, AlertTriangle } from "lucide-react";

export default function NewSitePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ loginId: string; password: string; siteId: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create site");
        return;
      }
      setCredentials({ loginId: data.loginId, password: data.plainPassword, siteId: data.id });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: "id" | "pw") {
    navigator.clipboard.writeText(text);
    if (which === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPw(true);
      setTimeout(() => setCopiedPw(false), 2000);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Create New Site</h1>
          <p className="text-sm text-muted-foreground">Add a project site and its timekeeper login</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site Details</CardTitle>
          <CardDescription>
            A login ID and password will be auto-generated for the timekeeper.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Site Code</Label>
              <Input
                id="code"
                placeholder="e.g. D687"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                pattern="[A-Za-z]\d{3,4}"
                title="Format: letter followed by 3-4 digits (e.g. D687)"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">This becomes the timekeeper&apos;s login ID</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                placeholder="e.g. Site Al Nahda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create Site
              </Button>
              <Link href="/admin">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Credentials modal */}
      <Dialog open={!!credentials} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Site Created Successfully</DialogTitle>
            <DialogDescription>
              Save these credentials now — the password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This password is shown only once. Save it before closing.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Login ID</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                    {credentials?.loginId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(credentials!.loginId, "id")}
                  >
                    {copiedId ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                    {credentials?.password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(credentials!.password, "pw")}
                  >
                    {copiedPw ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={() => router.push(`/admin/sites/${credentials?.siteId}`)}
              >
                Upload SAP Codes
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
