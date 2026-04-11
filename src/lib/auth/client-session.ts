"use client";

import { useState, useEffect } from "react";

export interface ClientSession {
  role: "admin" | "timekeeper";
  siteCode?: string;
  siteName?: string;
}

let cached: ClientSession | null | undefined = undefined;
const listeners: Array<() => void> = [];

async function fetchSession(): Promise<ClientSession | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useSession(): { session: ClientSession | null; loading: boolean } {
  const [session, setSession] = useState<ClientSession | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    if (cached !== undefined) {
      setSession(cached);
      setLoading(false);
      return;
    }

    fetchSession().then((s) => {
      cached = s;
      setSession(s);
      setLoading(false);
      listeners.forEach((fn) => fn());
    });
  }, []);

  return { session, loading };
}

// Call this after logout to clear the module-level cache
export function clearSessionCache() {
  cached = undefined;
}
