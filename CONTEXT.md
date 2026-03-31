# DanwayEME - Project Context & Documentation

## 📖 Project Overview

**Project Name**: DanwayEME  
**Type**: Employee Management & Reporting Dashboard  
**Status**: ✅ Live in Production  
**Created**: February 2026  
**Last Updated**: March 28, 2026

### Purpose
DanwayEME is a web-based employee management system designed to streamline attendance tracking and manpower reporting for organizations. The application provides real-time insights into workforce data through an intuitive, modern interface.

## 🎯 Business Goals

1. **Simplify Attendance Management** - Provide an easy-to-use interface for tracking employee attendance
2. **Workforce Analytics** - Enable data-driven decisions through comprehensive manpower reports
3. **Accessibility** - Ensure the system is accessible from any device, anywhere
4. **Scalability** - Build on a modern tech stack that can grow with business needs

## 🏗️ Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router
- **Rendering**: Server-Side Rendering (SSR) and Static Site Generation (SSG)
- **State Management**: React hooks and context (no external state library needed yet)
- **Styling**: Tailwind CSS 4 with utility-first approach
- **Component Library**: shadcn/ui for consistent, accessible components

### Project Structure Details

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard home (/)
│   ├── attendance/
│   │   └── page.tsx             # Attendance tracking (/attendance)
│   ├── manpower/
│   │   └── page.tsx             # Manpower reports (/manpower)
│   ├── layout.tsx               # Root layout with metadata
│   └── globals.css              # Global styles and Tailwind directives
│
├── components/
│   ├── header.tsx               # Top navigation bar
│   ├── sidebar.tsx              # Side navigation menu
│   └── ui/                      # shadcn/ui components (50+ components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── chart.tsx
│       └── ... (and many more)
│
└── lib/
    └── utils.ts                 # Utility functions (cn, etc.)
```

## 🔑 Key Features

### 1. Dashboard Home Page
- **Location**: `/` (src/app/page.tsx)
- **Features**:
  - Welcome screen
  - Quick navigation to main features
  - Overview statistics (if implemented)
  - Recent activity feed (if implemented)

### 2. Attendance Page
- **Location**: `/attendance` (src/app/attendance/page.tsx)
- **Features**:
  - Employee attendance tracking
  - Date range filtering
  - Attendance status indicators
  - Export functionality
  - Visual charts and graphs

### 3. Manpower Page
- **Location**: `/manpower` (src/app/manpower/page.tsx)
- **Features**:
  - Workforce distribution analysis
  - Department-wise reports
  - Role-based filtering
  - Interactive data visualization
  - Report generation

### 4. Navigation System
- **Header Component**: Top navigation with branding and user actions
- **Sidebar Component**: Left navigation menu with page links
- **Responsive**: Collapses to hamburger menu on mobile devices

## 🎨 Design System

### Color Palette
The application uses Tailwind CSS default colors with customizations:
- **Primary**: Blue shades for main actions
- **Secondary**: Gray shades for secondary elements
- **Success**: Green for positive states
- **Warning**: Yellow for caution states
- **Error**: Red for error states

### Typography
- **Font Family**: Geist (Vercel's font) for modern, clean typography
- **Headings**: Bold weights for hierarchy
- **Body**: Regular weight for readability

### Components
All UI components follow the shadcn/ui design system:
- Accessible by default (ARIA attributes)
- Keyboard navigable
- Consistent spacing and sizing
- Dark mode compatible

## 🔌 Dependencies

### Core Dependencies
```json
{
  "next": "16.1.6",                    // React framework
  "react": "19.2.3",                   // UI library
  "react-dom": "19.2.3",               // React DOM renderer
  "typescript": "^5"                   // Type safety
}
```

### UI & Styling
```json
{
  "tailwindcss": "^4",                 // CSS framework
  "tailwind-merge": "^3.4.0",          // Merge Tailwind classes
  "class-variance-authority": "^0.7.1", // Component variants
  "lucide-react": "^0.563.0",          // Icons
  "next-themes": "^0.4.6"              // Dark mode support
}
```

### Data & Forms
```json
{
  "react-hook-form": "^7.71.1",        // Form handling
  "zod": "^4.3.6",                     // Schema validation
  "date-fns": "^4.1.0",                // Date utilities
  "recharts": "^2.15.4"                // Charts and graphs
}
```

### UI Components (Radix UI)
```json
{
  "radix-ui": "^1.4.3",                // Headless UI primitives
  "react-day-picker": "^9.13.0",       // Date picker
  "cmdk": "^1.1.1",                    // Command menu
  "sonner": "^2.0.7",                  // Toast notifications
  "vaul": "^1.1.2"                     // Drawer component
}
```

## 🚀 Deployment Information

### Production Environment
- **Platform**: Vercel
- **URL**: https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app
- **Project Name**: danway-eme
- **Account**: mdafjalkhan29@gmail.com

### Deployment Details
- **Build Time**: ~6 minutes
- **Build Command**: `next build`
- **Output Directory**: `.next` (Next.js default)
- **Node Version**: 20.x (Vercel default)
- **Auto-Deploy**: Enabled (on git push)

### Vercel Configuration
The project uses Vercel's automatic Next.js detection:
- No custom `vercel.json` needed
- Automatic environment detection
- Edge network distribution
- Automatic HTTPS
- CDN caching for static assets

## 📊 Performance Considerations

### Optimization Strategies
1. **Server Components**: Using React Server Components by default for better performance
2. **Code Splitting**: Automatic code splitting by Next.js
3. **Image Optimization**: Next.js Image component for optimized images
4. **Font Optimization**: Using `next/font` for automatic font optimization
5. **CSS Optimization**: Tailwind CSS purges unused styles in production

### Best Practices Implemented
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Responsive design
- ✅ Accessible components
- ✅ SEO-friendly metadata
- ✅ Fast page loads

## 🔐 Security Considerations

### Current Security Measures
- HTTPS enforced by Vercel
- No sensitive data in client-side code
- Environment variables for configuration
- TypeScript for type safety

### Future Security Enhancements
- [ ] Authentication system (NextAuth.js recommended)
- [ ] Authorization and role-based access control
- [ ] API route protection
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input sanitization

## 🛣️ Development Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Project setup with Next.js
- [x] UI component library integration
- [x] Basic page structure
- [x] Navigation system
- [x] Deployment to Vercel

### Phase 2: Core Features (In Progress)
- [ ] Implement attendance tracking logic
- [ ] Add manpower reporting functionality
- [ ] Integrate with backend API
- [ ] Add data persistence
- [ ] Implement search and filtering

### Phase 3: Enhancement (Planned)
- [ ] User authentication
- [ ] Role-based permissions
- [ ] Advanced analytics
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Phase 4: Optimization (Future)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] A/B testing
- [ ] Progressive Web App (PWA)

## 🧪 Testing Strategy

### Current State
- No automated tests yet

### Recommended Testing Approach
1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Testing Library
3. **E2E Tests**: Playwright or Cypress
4. **Visual Tests**: Chromatic or Percy

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint rules
- Use functional components with hooks
- Prefer server components unless client interactivity is needed
- Keep components small and focused

### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Git Workflow
- Main branch: `main`
- Feature branches: `feature/feature-name`
- Bug fixes: `bugfix/bug-description`
- Commit messages: Descriptive and clear

## 🔄 Version History

### v0.1.0 (February 8, 2026)
- Initial project setup
- Dashboard home page
- Attendance page structure
- Manpower page structure
- Navigation components (header, sidebar)
- shadcn/ui component library integration
- Deployed to Vercel

## 📞 Contact & Support

### Project Owner
- **Name**: Md Afjal Khan
- **Email**: mdafjalkhan29@gmail.com
- **Vercel Account**: mdafjalkhan29-gmailcoms-projects

### Resources
- **Production URL**: https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/mdafjalkhan29-gmailcoms-projects/danway-eme
- **Repository**: (Add your Git repository URL here)

## 🎓 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

### Tailwind CSS
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### shadcn/ui
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Component Examples](https://ui.shadcn.com/examples)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## 📅 Recent Updates (Feb 14-15, 2026)

### Attendance System Enhancements
- **Timezone Fix**: Implemented strict UTC date handling across Excel parser and all API endpoints to prevent date mismatches
- **UI Improvements**:
  - Restored Shift dropdown selector (Day/Night/Day&Night)
  - Restored Edit action button in attendance table
  - Fixed "Missing" punch-out warning display
- **Data Flow Optimization**: Removed duplicate attendance calculation from punch upload to ensure consistency
- **Enhanced Diagnostics**:
  - Added detailed file parsing metrics (total rows, valid rows, invalid rows)
  - Implemented date range feedback in upload messages
  - Created diagnostic tools for troubleshooting data issues

### Business Rules Implementation
- **Missing Punch-Out**: Records flagged for review with assumed hours (8 hours normal, 4 hours if late arrival ≥12 PM)
- **Missing Punch-In**: Records ignored (no attendance created)
- **Late Arrival Detection**: Automatic half-day marking for arrivals ≥12 PM
- **Review System**: Added `needsReview`, `reviewReason`, `reviewedBy`, and `reviewedAt` fields to AttendanceRecord model

### Database Schema Updates
- Added review-related fields to `AttendanceRecord` model
- Implemented strict date storage in UTC format
- Enhanced import batch tracking

### Attendance Logic Specifications (New - Feb 16)
- **Shift Determination**: 
  - Day Shift: 05:00 - 16:59
  - Night Shift: 17:00 - 04:59
- **Lunch Deduction**: 
  - Standard: -1 hour from gross hours
  - Exception: No deduction on Sundays
- **Overtime Rules**:
  - **Staff/Engineers**: No Overtime (Fixed salary)
  - **Workers**: 
    - Normal Days: Hours > 8 are OT
    - Sundays: All hours are OT
- **Continuous Work**:
  - Detected when Punch Out is missing AND next day Punch In < 07:00
  - Action: auto-generates 10h shift (8N + 2OT) for both days
  - Status: Flagged for Review
  - **Day & Night Detection**:
    - Automatically assigns "Day&Night" shift if work span crosses significant boundaries (e.g., start in Day, end past 20:00)
    - Prioritized in UI display over Employee Master shift data

### Global Application State (New - Feb 16)
- **DateContext**: 
  - Single source of truth for `selectedDate` application-wide
  - Provides `useDate()` hook consumed by Header (Setter) and Page components (Getters)
  - Eliminates prop drilling and inconsistent state between views

### Export Integration (New - Feb 16)
- **SAP Attendance Format**:
  - Implemented backend API `/api/attendance/export` using `xlsx`
  - Generates binary Excel stream with strictly ordered columns
  - Maps internal schema (AttendanceRecord) to legacy SAP requirements
  - Supports dynamic date filtering per export request

### Attendance Status Architecture (Fixed - Feb 16)
- **Status is Derived**: 
  - **Present**: Default if punch exists or hours > 0.
  - **Late**: Punch In > 08:15 (Day) or > 20:15 (Night).
  - **Half Day**: Worked Hours < 5.
  - **Absent**: No punch and 0 hours.
  - It is **NOT** a stored field that can be directly toggled.
- **UI Implication**:
  - The "Status" column in Attendance Page is **Read-Only**.
  - Users affect status by editing **Hours** (e.g., adding 8h manually makes status "Present").
  - Dropdowns for status selection were removed to prevent user confusion.

### Attendance Logic Refinements (Feb 17)
- **Continuous Work Threshold**: 
  - Changed cut-off from 07:00 AM to **05:00 AM**.
  - Prevents normal early arrivals (e.g. 06:25 AM) from triggering "Overnight Shift" logic if previous punch-out is missing.
- **Stats Calculation**:
  - "Present" count now includes **Late** and **Half Day** employees (Active workforce).
  - "Absent" strictly counts those with NO records.
  - "Late" is tracked separately but considered a subset of Present.

### Reporting Features (Feb 17)
- **Manpower Report PDF**:
  - Implemented high-fidelity **Print-to-PDF** using native browser engine.
  - Custom print styling hides Sidebar, Navigation, and interactive elements.
  - Adds a professional "Report Header" (Logo, Project, Date) only visible on print.
  - Landscape orientation enforced via CSS `@page`.

### February 22, 2026 - Hired Timesheet Integration

#### 1. Hired Employee Timesheet Module
- **Hired Timesheet Interface**: Designed and integrated a comprehensive monthly timesheet table specifically for Vendor "Hired Employees".
- **Biometric Punch Integration**: Extended facepunch import logic to associate orphan punch records with Hired Employees dynamically.
- **Dynamic Hour Calculation**:
  - Automatically translates raw `.dat` punch records into daily hours for hired workers.
  - **Missed Punch Rule**: If a worker has a punch-in but no punch-out (or vice versa), the system auto-assigns **5 hours** and flags the cell green.
- **Interactive UI**:
  - Implemented optimistic updates for lightning-fast manual hour editing by Timekeepers.
  - Supports quick status inputs like 'A' (Absent) and 'H' (Holiday).
  
#### 2. Backend API & Database
- **Schema Updates**: Added the `HiredTimesheet` model and updated relations for `PunchRecord` to conditionally map `hiredEmployeeId`.
- **Timezone Offset Fix**: Secured the database's date rendering by switching `toISOString` conversions to manual local-date string building, preventing dates from "shifting" backwards by a day across the stack.

#### 3. Bug Fixes & Stability
- **Attendance Calculation Crash**: Fixed a critical server crash in the attendance calculation engine caused by processing "Hired Employee" punch data alongside regular Danway staff. Added strict null-checks and filtering to logically isolate the two systems despite sharing the biometric punch table.

---

### February 23, 2026 - Settings Page, Ramadan & OT Control

#### 1. Settings Page (`/settings`)
- **New dedicated Settings page** linked from Sidebar.
- **Lunch Hour Deduction** (General):
  - Selectable: **2 Hours / 1 Hour / 30 Minutes**
  - Applied globally on all non-Sunday working days.
- **Ramadan Period Configuration**:
  - Enable/Disable toggle with animated switch.
  - Configurable **Ramadan Start** and **Ramadan End** dates via calendar pickers.
  - Separate **Ramadan Lunch Deduction**: 1 Hour / 30 Min / No Deduction (independent of normal lunch).
  - Visual rules summary shown when Ramadan mode is active.
- **Persistent storage** via `SystemSettings` singleton in the database.

#### 2. Ramadan Calculation Rules (Engine)
- **Weekdays during Ramadan** (employees with OT allowed):
  - Minimum **8 Normal hours** guaranteed regardless of actual hours worked.
  - +**2 OT hours** added on top (Workers only).
- **Weekdays during Ramadan** (employees with OT disabled):
  - Only the **8h floor** is guaranteed, no OT bonus.
- **Sundays during Ramadan**: No Ramadan bonus. Standard Sunday rules apply (all hours = OT, no lunch deduction).

#### 3. Per-Employee OT Control
- **New `allowOvertime` field** added to `Employee` model (DB schema updated).
- **Add/Edit Employee dialog** now includes an **Allow Overtime** toggle:
  - Selecting **Staff** type auto-defaults OT to **OFF**.
  - Selecting **Worker** type auto-defaults OT to **ON**.
  - Can be overridden per individual employee.
- **Employee table** shows **OT ✓ / No OT** badge for each employee at a glance.
- **Calculation engine** now uses `allowOvertime` instead of `isEngineer`:
  - `allowOvertime = false` → always capped at **8 Normal hours**, no OT ever, no Ramadan OT bonus.
  - `allowOvertime = true` → standard OT rules apply (hours > 8 split as OT, Sunday all-OT, Ramadan bonus).

#### 4. Schema Changes
- Added `SystemSettings` model (singleton, `id = "global"`): `lunchHours`, `ramadanLunchHours`, `ramadanActive`, `ramadanStart`, `ramadanEnd`.
- Added `allowOvertime Boolean @default(true)` to `Employee` model.

---

### March 9, 2026 - Database Maintenance Scripts

#### 1. Data Clearing Utilities
- **`clear-punch-records.ts`**: Script to bulk-delete raw biometric punch imports (`PunchRecord` table).
- **`clear-attendance-records.ts`**: Script to bulk-delete processed daily attendance records (`AttendanceRecord`) and manual vendor timesheets (`HiredTimesheet`).
- Both scripts can be safely executed using `npx tsx <script-name>.ts` to clean imported/calculated data without wiping the main database setup (Employees, Settings).

---

### March 26, 2026 - Extra Overtime (EOT) Implementation

#### 1. EOT Calculation Separation
- **2-Hour Cap**: Standard Overtime (`OT`) is strictly capped at **2 hours** per day.
- **EOT Bucket**: Any work hours beyond the 8-hour normal floor and 2-hour OT cap are automatically split into a new bucket internal marked as `aaType: "EOT"`.
- **Sunday Rule**: If an OT-eligible employee works on a Sunday, 100% of their hours are directed entirely to EOT (0 normal, 0 OT).
- **Ramadan Rule**: Ramadan bonuses are applied ONLY to the standard OT bucket. The EOT calculation applies solely to actual hours worked beyond 10 hours.

#### 2. EOT Approval Workflow & UI (`/eot`)
- **Dedicated Page**: A new Extra Overtime page tracks all EOT records.
- **Auto-Pending**: System-calculated EOT Records defaults to `needsReview: true` so Timekeepers can oversee all exceptional hours.
- **Bulk & Single Reject**: EOT records can be permanently deleted from the database using single-row Trash icons or bulk-rejected via checkboxes.
- **Bulk Approve**: Approving sets `needsReview` to false, clearing them from the pending query.

#### 3. Manual Add & Inline Editing
- **Smart Combobox**: Added a Shadcn `Command` dropdown for searching Employee IDs/Names instantly when manually injecting EOT.
- **Inline Editing**: Double-click or hit the pencil icon to edit `hours` and `remarks` for any EOT record directly inside the table.
- **Audit Badges**: Manually created EOT records are tagged with a `Manual` badge in the remarks so it remains transparent how the hours entered the system.

#### 4. EOT SAP Export
- **Dedicated Export**: Instead of mingling with regular attendance, approved EOT can be exported individually to Excel (`/api/eot/export`).
- **SAP Compliance**: The system stores EOT internally as `aaType: "EOT"`, but maps it back to the SAP-required legacy code `0801` when the Excel is instantiated. Only mathematically "Approved" (needsReview: false) records make their way into the Excel packet.

---

### March 26, 2026 (Session 2) — EOT & Calculation Engine Refinements

#### 1. Overnight Punch Stitching Fixes
- **Smarter Stitching Guard**: The night-shift stitching engine now only "steals" the next day's early punch-in if that next day record **has no punch-out of its own**. This prevents an employee who forgot to punch out (e.g., March 23) from causing the system to absorb the start of their next normal day shift (March 24) as an overnight extension, generating phantom EOT.
- **24-Hour Gross Hours**: Fixed a bug where a stitched shift (Day 1 punch-in → Day 2 punch-in) calculated ~16 minutes instead of 24+ hours. The `calculateHours` utility now correctly adds 24h when the out-time is earlier than the in-time on a stitched overnight record.

#### 2. Day&Night Shift Classification Fix
- **Tightened Threshold**: `determineShift()` previously classified any Day-shift worker leaving after **8 PM** as `Day&Night`. This caused employees working afternoon → evening (e.g., 11:34 AM – 9:30 PM) to receive a double lunch deduction (Day 0.5h + Night 1.0h) and have all hours incorrectly routed to EOT.
- **New Rule**: `Day&Night` is only assigned when a Day-shift worker extends **past midnight** (out time `< 05:00`). Normal late-day OT stays classified as `Day shift`.

#### 3. Late Arrival Rule Removed
- Removed the rule that forced anyone punching in after 12 PM into a Half Day regardless of hours worked. Status is now determined purely from net worked time:
  - **< 7.5 Net Hours** → Half Day (4h)
  - **≥ 7.5 Net Hours** → Full Day (8h + OT/EOT as applicable)

#### 4. EOT Page — Date Range Picker
- Replaced the single-date picker with a **two-month range calendar**.
- All operations (View, Calculate EOT, Export to SAP) are now **range-aware**.
- **Calculate EOT button** added directly on the EOT page — no need to navigate to the Attendance page first.

#### 5. EOT Data Table — Date Column Added
- **Date** column added as the first column in the EOT records table, showing `MMM DD, YYYY`.

#### 6. EOT SAP Excel Export — Column Changes
- **Date moved to Column A** (far left).
- **Removed**: `Day shift / Night Shift` and `Mobile no.` columns.
- **Filename format** for range exports: `D657-SAP EOT-YYYY-MM-DD_to_YYYY-MM-DD.xlsx`.

#### 7. Ramadan Timezone Fix
- Ramadan start/end are saved at **12:00 PM UTC**, preventing the dates from shifting forward by one day for UAE (UTC+4) users.

#### 8. Bulk Editing on EOT Page
- **Bulk Edit dialog**: Select multiple EOT records and update Hours and/or Remarks in one action.

---

### March 26, 2026 (Session 3) — Public Holiday Management & Vercel Support

#### 1. Public Holiday Management System
- **Holiday Database**: New `PublicHoliday` model added to track specific dates (e.g., Eid, National Day).
- **Settings UI**: Added a "Public Holidays" management card in the Settings page for adding/deleting holiday dates with names.
- **Automatic Detection**: The calculation engine now automatically checks for holidays:
  - **Workers (`allowOvertime: true`)**: All hours worked on a holiday are routed to **EOT** (labelled with the holiday name, flagged as `HOLIDAY_WORK`).
  - **Staff (`allowOvertime: false`)**: Attendance records are **skipped** for holiday work (0 hours recorded).
- **Seed Data**: March 19, 20, and 21 (2026) were seeded as "Eid Al Fitr" holidays.

#### 2. Vercel Deployment & Logic Refinements
- **Build Script fix**: Updated `package.json` build command to `prisma generate && next build`. This ensures Vercel environments always have the latest Prisma client types, preventing "Property not found" errors during deployment.
- **Null Guards**: Added strict TypeScript null-checks for `punch.employee` in the calculation engine to ensure zero runtime crashes.
- **Vercel CLI**: Upgraded to latest version to support the new OAuth 2.0 login flow.

#### 3. Database Migration (Neon Postgres)
- **Database Engine**: Migrated the application from local `SQLite` to **Neon Serverless Postgres** to permanently resolve Vercel deployment crashes caused by the ephemeral Read-Only filesystem.
- **Provider**: Updated `schema.prisma` to use `postgresql`.
- **Environment**: Linked exactly to Vercel Storage integration for automatic environment variable injection (`POSTGRES_PRISMA_URL`).

---

### March 28, 2026 (Session 4) — Bug Fixes & Data Integrity

#### 1. Punch Upload Idempotency
- **Duplicate Prevention**: Modified `/api/punch/upload` to check for existing punch records before creating new ones. If a punch exists for the same employee and date, the system now updates the existing record (merging `punchIn` and `punchOut`) instead of creating a duplicate. This ensures re-uploading the same file or uploading separate morning/evening files doesn't corrupt the data.

#### 2. Continuous Shift Recalculation Fix
- **Atomic Deletion**: Updated the attendance calculation engine to handle "stitched" shifts that overlap into the next day. When recalculating a specific date range, the system now identifies any shifts that extended into "Day 2" and atomically deletes those Day 2 records before recreating them. This prevents orphaned or duplicated EOT/Attendance rows when recalculating days individually.

#### 3. Stitched Shift Classification
- **Deduction Accuracy**: Forced shift classification to `Day&Night` for any stitched shift exceeding 16 hours. This ensures that the double lunch deduction (Day + Night) is correctly applied to 24-hour continuous work sessions, preventing inflated overtime calculations.

#### 4. Database Maintenance
- **Legacy Cleanup**: Executed a comprehensive database cleanup script that identified and merged over 1,600 duplicate punch records accumulated from previous non-idempotent imports.
- **Global Recalculation**: Re-triggered a full-month calculation for March 2026 to ensure all records follow the new data integrity rules and merged punch timelines.

#### 5. Neon Postgres Connection Pooling (Final Sync)
- **Pooled vs Direct Connections**: Configured `prisma/schema.prisma` with both `url` (for pooled `@prisma/client` queries) and `directUrl` (for Prisma CLI migrations/pushes) to fully support the online Neon/Vercel serverless environment.
- **GitHub Sync**: Pushed the finalized PostgreSQL schema to the `main` branch, enabling persistent online storage across all environments.

### March 28, 2026 (Session 6) — Database Switcher & 413 Error Fix

#### 1. Dual Database Infrastructure
- **Dynamic Schema Switching**: Implemented `scripts/setup-db.js` which manages the Prisma `datasource` provider. The system now automatically toggles between **SQLite** (for local/Electron offline use) and **PostgreSQL** (for Vercel production use) based on the environment.
- **Automated Lifecycle**: Injected the switcher into `package.json` hooks (`dev`, `build`, `electron:build`). This ensures local development stays offline-first while the live site remains synchronized with Neon Postgres.

#### 2. Upload Limit & Error Resilience (413 Fix)
- **Payload Increase**: Set `experimental.serverActions.bodySizeLimit` to **20MB** in `next.config.ts`.
- **Status Handling**: Updated the frontend to specifically catch `413 Payload Too Large` responses and show a non-crashing toast notification. 
- **JSON Parsing Safety**: Added a safety block around Response JSON parsing to gracefully handle non-JSON (HTML) error pages from hosting providers (Vercel).

---

### March 31, 2026 (Session 1) — Attendance Export Refinement
- **EOT Exclusion**: Modified the Attendance Export and Attendance Records APIs to exclude records with `aaType: "EOT"`.
- **Logic**: This ensures that Extra Overtime is only managed and exported via the dedicated EOT page, preventing duplicate or confusing lines in the standard SAP attendance export as per user request.

**Last Updated**: March 31, 2026
**Document Version**: 1.10.0
**Maintained By**: Md Afjal Khan
