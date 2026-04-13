# DanwayEME — Project Context

**Updated**: 2026-04-13 (session 2)

UAE construction workforce management system. Two employee types: **Danway** (direct staff, SAP payroll) and **Hired** (subcontractors, monthly timesheets per vendor). Multi-site: each site has one timekeeper login; one super-admin manages all sites.

---

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma · SheetJS (`xlsx`) · `jose` (JWT) · `bcryptjs` · `@vercel/blob` · Sonner · Recharts

**DB**: SQLite (dev) ↔ Neon PostgreSQL (prod). `scripts/setup-db.js` swaps the Prisma datasource before each run. `npm run dev` → SQLite + `prisma generate`. `npm run build` → PostgreSQL.

**Route groups**: `src/app/(app)/` = timekeeper pages (Sidebar+Header layout) · `src/app/admin/` = admin panel · `src/app/login/` = public auth  
**Middleware**: `src/proxy.ts` (Next.js 16; export must be named `proxy`, not `middleware`)

---

## Database Models

| Model | Key facts |
|---|---|
| `Site` | code (e.g. D657), loginId=code, passwordHash, encryptedPassword; root of multi-tenancy |
| `Employee` | Danway staff; `siteId` FK; `@@unique([siteId, employeeId])` |
| `HiredEmployee` | Subcontractor workers; `siteId` FK; `@@unique([siteId, employeeId])` |
| `Vendor` | Subcontractor companies; global (no siteId) |
| `PunchRecord` | Raw biometric punches; `employeeId` XOR `hiredEmployeeId`; `rawUserId` stores original external ID for deferred linking |
| `AttendanceRecord` | Calculated SAP rows for Danway only (0600=Normal, 0801=OT, EOT=Extra OT) |
| `HiredTimesheet` | Daily hours grid per hired employee per date |
| `SAPCodeMapping` | designation→network/activity/element; `siteId`; `isEngineer Boolean` (default false); `@@unique([siteId, designation])` |
| `SystemSettings` | Singleton (id="global"): lunchHours, ramadanActive/Start/End, ramadanLunchHours, siteStartTime |
| `PublicHoliday` | Stored at UTC noon to avoid UAE UTC+4 shift |
| `ImportBatch` | Tracks each Excel upload |

**Multi-tenancy**: every query on Employee, HiredEmployee, AttendanceRecord, PunchRecord, EOT, SAPCodeMapping MUST include `siteId` (or `employee: { siteId }`) from the session. Vendor and SystemSettings are global.  
**employeeId is not globally unique** — always `findFirst({ where: { employeeId, siteId } })`, never `findUnique({ where: { employeeId } })`.

---

## Attendance Calculation (`POST /api/attendance/calculate`)

Processes `PunchRecord` → creates/replaces `AttendanceRecord` for Danway employees.

**Shift** (from punchIn hour): Day 05:00–16:59 · Night 17:00–04:59 · Day&Night if Day worker punches out past midnight  
**Hours**: gross = punchOut−punchIn (capped at siteStartTime if early) → deduct lunch (Day=config 0.5/1h, Night=1h, Day&Night=both, Sunday=0) → round (0-24min→0, 25-49→0.5, 50-59→1)  
**Classify**: <7.5h → Half day (4h Normal) · 7.5–8h → Full day (8h Normal) · >8h → 8 Normal + ≤2 OT + rest EOT · Sunday (`allowOvertime=true`) → all hours EOT  
**`allowOvertime=false`** (Engineers/Staff): max 8h Normal, no OT/EOT/Ramadan bonus  
**Night-shift stitch**: Day 1 has punchIn but no punchOut → steal Day 2 punchIn as Day 1 punchOut IF Day 2 punchIn <12:00 AND Day 2 has no punchOut  
**Ramadan** (when active + date in range): lunch = `ramadanLunchHours`; workers guaranteed ≥8h Normal + ≤2h OT  
**Public holidays**: workers → all hours EOT; staff → skipped  
**`attendanceRecord.deleteMany`** is scoped to `employee: { siteId }` — critical, prevents cross-site deletion

---

## Auth

**Roles**: `admin` (env-var creds, `/admin` only) · `timekeeper` (site DB creds, all other pages, site-scoped data)  
**Session**: JWT in httpOnly cookie `session`, 8h, payload `{ role, siteId?, siteCode?, siteName? }`  
**Admin login**: `ADMIN_LOGIN_ID` + `ADMIN_PASSWORD` (plain text in env — bcrypt hashes corrupt via dotenv `$` expansion). Do NOT use `ADMIN_PASSWORD_HASH` — that variable is ignored.  
**Timekeeper login**: `loginId = siteCode`, `passwordHash` (bcrypt) in `Site`. `encryptedPassword` (AES-256-CBC, key=JWT_SECRET) stored alongside so admin can view/copy plain password from sites list.  
**Key files**: `src/proxy.ts` (route guard) · `src/lib/auth/api-auth.ts` (`requireSession(req, roles?)`) · `src/lib/auth/session.ts` · `src/lib/auth/client-session.ts` (`useSession()` with module-level cache)

---

## Key API Routes

```
# Punch upload — dual path (client decides based on hostname)
#   localhost → POST /api/punch/upload (direct FormData, no size limit locally)
#   production → Vercel Blob flow (bypasses 4.5 MB serverless limit)
POST /api/punch/upload          → direct FormData upload; parses Excel, upserts PunchRecords (local dev)
POST /api/punch/blob-token      → returns signed upload token; browser uploads directly to Vercel Blob (≤50 MB)
POST /api/punch/process         → { blobUrl, fileName } → downloads blob, parses Excel, upserts PunchRecords, deletes blob

# Attendance
POST /api/attendance/calculate  → recalculate AttendanceRecords for date range
GET  /api/attendance/export     → SAP Excel (excludes EOT); filename uses session.siteCode
GET  /api/eot/export            → EOT-only SAP Excel; filename uses session.siteCode
POST /api/eot/update-bulk       → bulk update EOT hours/remarks

# Employees
GET/POST /api/employees         → list / create Danway employees (site-scoped)
POST /api/employees/import      → bulk import from Excel
POST /api/hired-employees/bulk-import → bulk create HiredEmployees
GET  /api/designations          → SAPCodeMapping rows for session's site; accepts ?isEngineer=true/false filter

# Auth
POST /api/auth/login            → sets session cookie
POST /api/auth/logout           → clears cookie
GET  /api/auth/me               → { role, siteCode, siteName, siteId }

# Admin (role=admin only)
GET/POST  /api/admin/sites                      → list sites / create site (returns plainPassword once)
PATCH     /api/admin/sites/[siteId]             → action=reset-password | set-password
DELETE    /api/admin/sites/[siteId]             → cascade delete: attendanceRecords→punchRecords→hiredTimesheets→employees→hiredEmployees→SAPMappings→site
POST      /api/admin/sites/[siteId]/sap-upload  → upsert SAPCodeMapping from Excel; reads optional `type`/`isstaff` column → isEngineer; returns { created, updated, skipped }
```

---

## Key Rules

- **Punch upload idempotent**: same employee+date → merges punchIn/punchOut, never duplicates
- **Deferred punch linking**: if an employee doesn't exist at upload time, their punch rows are saved with `employeeId=null` + `rawUserId` set. When the employee is later created (`POST /api/employees` or `POST /api/hired-employees`), an `updateMany` auto-links those orphan rows — no re-upload required.
- **EOT**: never in attendance export; has its own export route
- **Status** (Present/Late/Half Day/Absent): computed at query time, not stored
- **Dates**: store at UTC noon for holidays/Ramadan
- **Export filenames**: always use `session.siteCode`, never hardcode
- **Blob store**: `store_bYOjYI806842k5gv` (danway-punch-uploads, iad1); `BLOB_READ_WRITE_TOKEN` required in env

---

## Hired Employee Bulk Import

Accepts `.xlsx`, `.xls`, `.csv`. Normalises column names (lowercase, strip spaces/underscores).  
Aliases: `employeeId` (empid/badgeno/…) · `name` · `designation` (role/trade/…) · `shift` · `company` (vendor/subcontractor/…)  
Company matching: exact → fuzzy (strip punctuation) → partial. Unmatched rows shown in red with dropdown fallback.
