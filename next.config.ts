import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT set output: 'export' - Electron needs live server-side API routes for Prisma/SQLite.
  // The app is served from a local Node.js server spawned by the Electron main process.
  reactStrictMode: true,
};

export default nextConfig;
