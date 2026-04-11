# DanwayEME — LLM Context File

> **This file is written for an AI coding assistant (LLM), not for humans.**
> When you receive this file, read it fully before writing any code or answering questions.
> It tells you everything you need to know about this codebase: domain, data models, business rules, and gotchas.
> Do not invent rules or assumptions — if something is not covered here, ask the user.

**Last Updated**: April 11, 2026 (session 2)

---

## How to Update This File

When the user says **"update the context"** or **"update CONTEXT.md"**, do the following:

1. **Reflect what just changed** — look at the work done in the current session (new features, schema changes, API routes, business rule changes, bug fixes) and incorporate them into the relevant sections below.
2. **Edit in place** — update the existing section that the change belongs to. Do NOT append a changelog at the bottom. This file must stay concise and current, not grow into a history log.
3. **Keep it LLM-optimised** — write facts, rules, and constraints. No narrative, no "we decided to...", no history. Just the current state of truth.
4. **Update the "Last Updated" date** at the top.
5. **Remove anything that is no longer true** — stale rules are worse than no rules.
6. **Do not add new top-level sections** unless the topic genuinely doesn't fit anywhere existing. Prefer adding bullets to existing sections.

> The goal: any LLM reading this file cold should understand the full system in under 2 seconds with zero gaps.

---


## What This Is

Internal workforce management system for a UAE construction company (Danway EME). Supports multiple project sites. Manages two employee types:
- **Danway employees** — direct staff tracked for SAP payroll export
- **Hired employees** — subcontractor workers tracked on monthly timesheets per vendor

Two user roles:
- **Super Admin** (`admin`) — creates sites, uploads SAP codes per site, resets credentials. Has access to `/admin` only; does not see timekeeper pages.
- **Timekeeper** — one per site; logs in with site code as login ID; sees only their own site's data on the standard pages (`/`, `/attendance`, `/eot`, etc.).

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | SQLite (local/dev) ↔ Neon PostgreSQL (production/Vercel) — toggled by `scripts/setup-db.js` |
| ORM | Prisma |
| Charts | Recharts |
| Excel | SheetJS (`xlsx`) |
| Auth | `jose` (JWT, httpOnly cookie), `bcryptjs` (password hashing) |
| Toasts | Sonner |

> **DB switching**: `npm run dev` → SQLite. `npm run build` / Vercel → PostgreSQL. Both use the same Prisma schema; `setup-db.js` swaps the datasource before each run.
> **Critical**: `dev` script runs `prisma generate` after switching to SQLite. Without this, a prior `npm run build` leaves a stale PostgreSQL client that connects to Neon in dev.
> **Route groups**: App pages live in `src/app/(app)/` (has Sidebar + Header layout). Login is `src/app/login/`. Admin panel is `src/app/admin/`. This prevents auth pages from inheriting the main layout.
> **Proxy (middleware)**: Route protection lives in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`; export must be named `proxy`).

---

## Database Models (Prisma)

```
Site              — Project site (code e.g. "D657", name, loginId=code, passwordHash); root of multi-tenancy
Employee          — Danway staff; has siteId FK; @@unique([siteId, employeeId]) (employeeId not globally unique)
HiredEmployee     — Subcontractor workers; has siteId FK; @@unique([siteId, employeeId])
Vendor            — Subcontractor companies (global, no siteId)
PunchRecord       — Raw biometric punches (shared by both employee types; has employeeId OR hiredEmployeeId)
AttendanceRecord  — Calculated daily SAP records (0600=Normal, 0801=OT, EOT=Extra OT) for Danway employees only
HiredTimesheet    — Monthly daily-hours grid for hired employees (one row per employee per date)
ImportBatch       — Tracks each Excel/punch upload
SystemSettings    — Singleton (id="global"): lunchHours, ramadanActive, ramadanStart, ramadanEnd, ramadanLunchHours, siteStartTime
PublicHoliday     — Holiday dates; workers on holiday → all hours to EOT
SAPCodeMapping    — designation → network/activity/element mapping; has siteId; @@unique([siteId, designation])
```

**Multi-tenancy rule**: every query on Employee, HiredEmployee, AttendanceRecord, PunchRecord, EOT, and SAPCodeMapping MUST include a `siteId` (or `employee: { siteId }`) filter derived from the session. Vendor and SystemSettings are global. `attendanceRecord.deleteMany` in the calculate route is scoped to `employee: { siteId: session.siteId }` — this is critical to prevent cross-site data deletion.

**employeeId uniqueness**: `employeeId` (biometric ID) is unique per site, not globally. Always use `findFirst({ where: { employeeId, siteId } })`, never `findUnique({ where: { employeeId } })`.

---

## Business Logic (Critical)

### Attendance Calculation (`/api/attendance/calculate`)

**Input**: date range → processes `PunchRecord` for Danway employees  
**Output**: creates/replaces `AttendanceRecord` rows

**Shift determination** (from punchIn hour):
- Day shift: 05:00–16:59
- Night shift: 17:00–04:59
- Day&Night: Day-start worker punches out past midnight (< 05:00 next day)

**Hours flow**:
1. Gross hours = punchOut − punchIn (capped to siteStartTime if early)
2. Deduct lunch: Day=configurable (0.5/1h), Night=1h always, Day&Night=both, Sunday=0
3. Round net hours: 0-24min→0, 25-49min→0.5, 50-59min→1
4. Classify:
   - < 7.5h → Half day (4h Normal, 0 OT)
   - 7.5–8h → Full day (8h Normal)
   - > 8h → 8 Normal + up to 2 OT + remainder → **EOT**
   - Sunday (`allowOvertime=true`) → all hours → EOT

**Employee OT rules**:
- `allowOvertime=false` (Staff/Engineers): always 8h Normal max, no OT, no EOT, no Ramadan bonus
- `allowOvertime=true` (Workers): full OT/EOT/Ramadan rules apply

**Night-shift stitching**: If Day 1 has punchIn but no punchOut, check Day 2's record:
- "Steal" Day 2's punchIn as Day 1's punchOut ONLY if Day 2 punchIn < 12:00 AND Day 2 has no punchOut
- Mark as stitched; if gross ≥ 16h → Day&Night; split across both days

**Ramadan** (when `ramadanActive=true` and date in range):
- Lunch deduction = `ramadanLunchHours` instead of `lunchHours`
- Workers guaranteed ≥ 8h Normal + up to 2h OT regardless of actual hours
- Sundays: standard Sunday rules (no Ramadan bonus)

**Public Holidays**:
- Workers: all hours → EOT (flagged `HOLIDAY_WORK`)
- Staff: skipped entirely (no record)

### AA Types (SAP export codes)
- `0600` = Normal hours
- `0801` = Overtime
- `EOT` = Extra Overtime (internal; exported as `0801` in EOT-specific export)

---

## Pages & Routes

### Timekeeper pages (under `src/app/(app)/`, require any valid session)
| Page | Path | Purpose |
|---|---|---|
| Dashboard | `/` | Stats overview |
| Attendance | `/attendance` | View/edit AttendanceRecords, upload punch files, calculate, export to SAP |
| EOT | `/eot` | View/approve/reject EOT records, bulk edit, export EOT to SAP |
| Employees | `/employees` | Manage Danway employees |
| Hired Employees | `/hired-employees` | Manage vendors + hired workers; **bulk import via Excel/CSV** |
| Hired Timesheet | `/hired-timesheet` | Monthly grid for hired worker hours |
| Manpower | `/manpower` | Workforce distribution report |
| Settings | `/settings` | Lunch hours, Ramadan config, site start time, public holidays |

### Admin pages (under `src/app/admin/`, require `role=admin`)
| Page | Path | Purpose |
|---|---|---|
| Site list | `/admin` | All sites with employee/SAP counts |
| Create site | `/admin/sites/new` | Form → one-time credentials modal (shown once, not stored plain) |
| Site detail | `/admin/sites/[siteId]` | Stats, SAP code table, Excel upload, set/generate password, delete site |

### Auth pages (under `src/app/login/`, public)
| Page | Path | Purpose |
|---|---|---|
| Login | `/login` | Single form for both admin and timekeeper |

---

## Key API Routes

```
POST /api/punch/upload              — Upload Excel punch report; bulk-inserts PunchRecords (N+1 fixed: pre-fetches all employees + existing punches)
POST /api/attendance/calculate      — Recalculate AttendanceRecords for date range
GET  /api/attendance/export         — Export SAP Excel (excludes EOT aaType); filename includes session.siteCode
GET  /api/eot/export                — Export EOT-only SAP Excel; filename includes session.siteCode
POST /api/eot/update-bulk           — Bulk update EOT hours/remarks
POST /api/hired-employees/bulk-import — Bulk create HiredEmployees from parsed Excel rows
GET  /api/attendance/[id]           — Single record CRUD
GET  /api/designations              — Returns SAPCodeMapping rows for the session's site (replaces hardcoded arrays)

POST /api/auth/login                — Verify credentials (admin via env vars, timekeeper via Site DB); sets httpOnly session cookie (8h)
POST /api/auth/logout               — Clears session cookie
GET  /api/auth/me                   — Returns { role, siteCode, siteName, siteId } for current session

GET  /api/admin/sites               — List all sites with _count (admin only)
POST /api/admin/sites               — Create site; returns plainPassword once (not stored)
GET  /api/admin/sites/[siteId]      — Site detail
PATCH /api/admin/sites/[siteId]     — action="reset-password": generates random 10-char password, returns plainPassword once | action="set-password": sets a custom password (min 6 chars, no return value — admin already knows it)
DELETE /api/admin/sites/[siteId]    — Delete site + SAP mappings (blocked if employees or hiredEmployees exist)
POST /api/admin/sites/[siteId]/sap-upload — Parse Excel → upsert SAPCodeMapping rows; returns { created, updated, skipped }
```

---

## Auth Infrastructure

| File | Purpose |
|---|---|
| `src/proxy.ts` | Route protection (Next.js 16 proxy convention); public: `/login`, `/api/auth/*`; admin-only: `/admin/*`, `/api/admin/*` |
| `src/lib/auth/session.ts` | JWT sign/verify via `jose`; `SessionPayload = { role, siteId?, siteCode?, siteName? }`; cookie name `session`, maxAge 8h |
| `src/lib/auth/password.ts` | `hashPassword`, `verifyPassword`, `generatePassword(length=10)` via bcryptjs |
| `src/lib/auth/api-auth.ts` | `requireSession(request, roles?)` — call at top of every API route; returns `{ session }` or NextResponse 401/403 |
| `src/lib/auth/client-session.ts` | `useSession()` hook with module-level cache (avoids repeated `/api/auth/me` calls); `clearSessionCache()` for logout |

**Admin credentials**: stored in `.env` as `ADMIN_LOGIN_ID` + `ADMIN_PASSWORD_HASH` (bcrypt). Default: `admin` / `Admin@Danway2026`.  
**Timekeeper credentials**: `loginId = site code` (e.g. `D657`), password stored as bcrypt hash in `Site.passwordHash` — cannot be recovered. Admin can either generate a random 10-char password (shown once) or set a custom one (min 6 chars; admin already knows it so it's not echoed back). Both flows show the new password in a dismissable green banner with a copy button.  
**D657 initial password**: set via `D657_INITIAL_PASSWORD` env var, consumed by `prisma/seed.ts`.

---

## Important Data Rules

- **Punch upload is idempotent**: same employee+date → updates existing record (merges punchIn/punchOut), never duplicates
- **EOT is separate**: Attendance export never includes `aaType=EOT`; EOT page has its own export
- **Status is derived, not stored**: Present/Late/Half Day/Absent are computed from hours at query time
- **Date storage**: always UTC noon (`2026-03-19T12:00:00Z`) for holiday/Ramadan dates to avoid UAE UTC+4 shift
- **Hired employees share PunchRecord table** with Danway employees (`employeeId` XOR `hiredEmployeeId`)
- **AttendanceRecord is Danway-only**; hired workers use `HiredTimesheet`
- **Sunday**: no lunch deduction; if `allowOvertime=true` → all hours = EOT
- **SAP codes are dynamic per site**: fetched from `SAPCodeMapping` via `/api/designations`; no hardcoded arrays remain in the codebase
- **Export filenames** use `session.siteCode` (e.g. `D657-SAP Attendance-...xlsx`); never hardcode site code

---

## Bulk Import (Hired Employees)

Accepts `.xlsx`, `.xls`, `.csv`. Column names are normalised (lowercase, strip spaces/underscores). Supported aliases:

| Field | Column aliases |
|---|---|
| employeeId | employeeid, empid, id, employeeno, empno, staffid, badgeno |
| name | name, fullname, employeename, empname, staffname |
| designation | designation, role, position, jobtitle, trade |
| shift | shift, shifttype |
| company | company, vendor, companyname, vendorname, subcontractor, contractor |

Company matching: exact → fuzzy (strip punctuation) → partial contains.  
After upload: preview table shows raw company name from file with ✓/⚠ indicator; unmatched rows shown in red, user selects from dropdown.

---

## Upload Limit

`next.config.ts`: `experimental.serverActions.bodySizeLimit = "20mb"`
