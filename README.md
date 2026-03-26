# Danway EME Workforce System

A comprehensive workforce management system for tracking employee attendance, managing punch records, and generating manpower reports for construction projects.

## 🚀 Features

### 1. Employee Management
- **Add Employee Interface**: Professional modal dialog with cascading dropdowns
- **Smart Designation Selection**: 
  - First select Staff or Worker
  - Then choose from filtered designations (30 total)
  - Auto-fills SAP codes (Network/Activity/Element)
- **Employee Database**:
  - 17 Staff designations (Civil Engineer, Surveyor, Drivers, etc.)
  - 13 Worker designations (Foreman, Mason, Carpenter, Welder, etc.)
- **Search & Filter**: Search by employee ID, name, or designation
- **Dashboard Stats**: View total employees, staff count, and worker count
- **CRUD Operations**: Create, Read, Update, Delete employees

### 2. Attendance Management
- **SAP File Import**: Upload SAP attendance Excel files
- **Duplicate Handling**: Automatically deduplicates employees (keeps first occurrence)
- **Employee Master Data**: Import employee details with SAP codes
- **Punch Report Upload**: Process biometric punch records
- **Attendance Calculation**: Automatic attendance processing

### 3. Manpower Reporting
- **Daily Reports**: Generate manpower reports by date
- **Project-wise Breakdown**: Track employees by project
- **Shift Detection**: Automatic day/night shift identification
- **Export Functionality**: Export reports to Excel

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: SQLite with Prisma 6 ORM
- **Excel Processing**: xlsx library
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- macOS (current setup)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DanwayEME
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# .env file is already configured
DATABASE_URL="file:./prisma/dev.db"
```

4. **Run database migrations**
```bash
npx prisma migrate deploy
npx prisma generate
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
DanwayEME/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database
├── src/
│   ├── app/
│   │   ├── attendance/        # Attendance management page
│   │   ├── employees/         # Employee management page
│   │   ├── manpower/          # Manpower reports
│   │   └── api/
│   │       ├── employees/     # Employee CRUD APIs
│   │       ├── punch/         # Punch record processing
│   │       └── manpower/      # Report generation
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── sidebar.tsx        # Navigation sidebar
│   └── lib/
│       ├── attendance/        # Excel parsing utilities
│       ├── utils/             # Helper functions
│       └── prisma.ts          # Prisma client
├── data/                      # Sample data files
└── scripts/                   # Utility scripts
```

## 🎯 Key Features Explained

### Employee Management System

**Cascading Dropdowns:**
1. User selects **Staff** or **Worker**
2. Designation dropdown shows only relevant options:
   - **Staff** (Activity: 0010): Engineers, Coordinators, Drivers, Operators
   - **Worker** (Activity: 0132): Foreman, Carpenter, Mason, Welder, Helper
3. SAP codes auto-populate based on selection

**SAP Code Integration:**
- Network: 5001323 (standard for all)
- Activity: 0010 (Staff) or 0132 (Worker)
- Element: Unique per designation (0101-0123, 0601-0614)

### Attendance Processing

**Import Flow:**
1. Upload SAP attendance Excel file
2. System parses employee data
3. Deduplicates entries (handles normal + OT rows)
4. Creates/updates employee records
5. Displays import summary

**Punch Report Processing:**
1. Upload biometric punch report
2. System matches employees by ID
3. Calculates work hours
4. Detects shifts (day/night)
5. Generates attendance records

## 🗄️ Database Schema

### Employee Model
```prisma
model Employee {
  id           String   @id @default(cuid())
  employeeId   String   @unique
  name         String
  designation  String
  mobile       String?
  shift        String
  isEngineer   Boolean
  project      String
  network      String
  activity     String
  element      String
  status       String   @default("active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### PunchRecord Model
```prisma
model PunchRecord {
  id              String   @id @default(cuid())
  employeeId      String
  date            DateTime
  punchIn         DateTime?
  punchOut        DateTime?
  totalHours      Float?
  shift           String?
  isNightShift    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 🔌 API Endpoints

### Employee Management
- `GET /api/employees/import` - Fetch all employees
- `POST /api/employees/import` - Import from SAP file
- `POST /api/employees` - Create employee
- `PUT /api/employees` - Update employee
- `DELETE /api/employees?id={id}` - Delete employee

### Attendance
- `POST /api/punch/upload` - Upload punch report
- `GET /api/attendance?date={date}` - Get attendance by date

### Reports
- `GET /api/manpower?date={date}` - Generate manpower report

## 🎨 UI Components

Built with **shadcn/ui** for consistent, accessible design:
- Button, Card, Badge
- Dialog (Modal)
- Select (Dropdown)
- Input, Label
- Table

## 📊 Designation List

### Staff (17 designations)
- Civil Divisional Manager, Civil Engineer, Document Coordinator
- Office Boy, Draughtsman-civil, Office Assistant
- NOC Coordinator, Project Coordinator, Time Keeper
- Surveyor, LV Driver, HV Driver
- JCB Operator, Shovvel Operator
- Store Keeping, Safety Assistant, Surveyor - Hired

### Workers (13 designations)
- Civil Foreman, Civil Chargehand
- Carpenter, Mason, Steel Fixer
- Plumber, Painter, Scaffolder
- Electrician-civil, Welder
- Helper, Pumber, Store Keeper Assistant

## 🐛 Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Reset database
rm prisma/dev.db
npx prisma migrate deploy
npx prisma generate
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

## 📝 Development Notes

### Prisma Version
- Using **Prisma 6.19.2** (not Prisma 7)
- Prisma 7 requires adapters which had compatibility issues
- Prisma 6 has native SQLite support

### Environment Variables
- `DATABASE_URL` is loaded from `.env` file
- Prisma reads it automatically for migrations and client

## 🚦 Getting Started Guide

1. **Add Employees**
   - Navigate to `/employees`
   - Click "Add Employee"
   - Select Staff or Worker
   - Choose designation
   - Fill in details
   - Click "Add Employee"

2. **Import from SAP**
   - Go to `/attendance`
   - Click "Import Employees"
   - Upload SAP attendance Excel file
   - Review import summary

3. **Process Attendance**
   - Upload punch report
   - System calculates hours
   - View attendance records

4. **Generate Reports**
   - Go to `/manpower`
   - Select date
   - View/export report

## 🤝 Contributing

This is a private project for Danway EME workforce management.

## 📄 License

Proprietary - Danway EME

## 📅 Recent Updates

### February 14-15, 2026 - Attendance System Refinements

#### Critical Fixes
- **Timezone Handling**: Implemented strict UTC date parsing across all components
  - Updated Excel parser to use `Date.UTC()` for consistent date storage
  - Modified all API endpoints (`/api/punch/records`, `/api/attendance/records`, `/api/attendance/calculate`) to parse YYYY-MM-DD strings as UTC
  - Eliminated timezone-related data mismatches that caused "today's" data to appear missing

#### UI/UX Improvements
- **Shift Selection**: Restored interactive dropdown for shift assignment (Day/Night/Day&Night)
- **Edit Functionality**: Re-added Edit action button to attendance table rows
- **Visual Indicators**: Enhanced punch-out column to show ⚠️ warning for missing punch-outs
- **Status Display**: Improved status badge rendering with color-coded indicators

#### Data Processing Enhancements
- **Separated Concerns**: Removed duplicate attendance calculation from punch upload
  - Punch upload now ONLY saves punch records
  - Attendance calculation handled exclusively by Calculate button via `/api/attendance/calculate`
  - Ensures business rules are consistently applied
- **Smart Column Mapping**: Excel parser now handles multiple header variations
  - Supports `ProcessDate`, `Date`, or `Process Date` columns
  - Flexible `UserID`, `User ID`, or `ID` column detection
  - Prevents parsing failures due to header name differences

#### Diagnostic Tools
- **Upload Metrics**: Added detailed feedback on file processing
  - Total rows in Excel file
  - Valid rows successfully parsed
  - Invalid/skipped rows with reasons
  - Date range of imported data (e.g., "2026-02-02 to 2026-02-13")
- **Toast Notifications**: Enhanced success/warning messages with actionable information
- **Debug Scripts**: Created utility scripts for database inspection and verification

#### Business Rules Implementation
- **Missing Punch-Out Handling**:
  - Flagged for manual review with `needsReview` field
  - Assumed 8 hours for normal arrivals
  - Assumed 4 hours for late arrivals (≥12 PM)
- **Missing Punch-In**: Records completely ignored (no attendance created)
- **Late Arrival Detection**: Automatic half-day marking for arrivals after noon
- **Review Workflow**: Added fields for tracking review status, reason, reviewer, and timestamp

#### Database Schema Updates
```prisma
model AttendanceRecord {
  // ... existing fields ...
  needsReview   Boolean  @default(false)
  reviewReason  String?
  reviewedBy    String?
  reviewedAt    DateTime?
}
```

#### Known Issues & Next Steps
- Manual review UI not yet implemented (records are flagged but require manual database updates)
- Need to add filtering/sorting by review status
- Consider implementing bulk review approval workflow


### February 16, 2026 - Calculation Logic & rounding

#### 1. Advanced Attendance Calculation
- **Continuous Work / Double Shift Handling**: 
  - Automatically detects when an employee works across days (missing punch-out + early punch-in next day < 7 AM)
  - Creates attendance records for *both* days assuming a standard 10-hour shift (8 hours Normal + 2 hours OT)
  - Flags these records for manual review (`CONTINUOUS_WORK` tag)
- **Sunday Logic**:
  - Automatically treats ALL hours as Overtime for Workers (Non-Staff)
  - No lunch deduction (1 hour) applied on Sundays
- **Rounding Rules**: Implemented specific rounding logic for net hours:
  - 0-24 mins → 0.0 hours
  - 25-49 mins → 0.5 hours
  - 50-59 mins → 1.0 hours

#### 2. Enhanced Review System
- **New Review Flags**:
  - `CONTINUOUS_WORK`: For shifts spanning multiple days
  - `MISSING_PUNCH_OUT`: For incomplete records (auto-filled with 8h/4h)
- **Review Workflow**: Records are created with `needsReview: true` to prevent payroll errors

#### 3. UI & UX Refinements
- **Global Date Management**: 
  - Implemented `DateContext` to synchronize selected date across Header, Attendance, and Manpower pages
  - Centralized date picker in the Header for better usability
- **Smart Shift Display**: 
  - Frontend now prioritizes *calculated* shift (daily reality) over *assigned* shift (employee master)
  - Ensures special shifts like "Day & Night" are correctly displayed
- **Filter Enhancements**:
  - **Status Filter**: Updated to filter by "Present"/"Absent" (Attendance Status) instead of "Active"/"Inactive" (Employee Status)
  - **Shift Filter**: Added "Day & Night" option to filter mixed shifts
  - **Case-Insensitive Matching**: Improved filter reliability for inconsistent casing

#### 4. Data Export
- **SAP-Compatible Export**:
  - New "Export SAP Format" feature generates Excel files matching legacy system requirements
  - Columns: Employee ID, WBS Element, Network, Activity, Element, A/A Type, Hours, Name, Designation, Day/Night Shift, Mobile, Remarks
  - Precise mapping of A/A Types (0600 vs 0801) and Shift codes

For support or questions, contact the development team.

### February 17, 2026 - Reporting & Logic Refinement

#### 1. Manpower Reporting
- **Print-to-PDF**:
  - Generated professional-grade PDF reports directly from the browser
  - Custom print styling hides UI elements (Sidebar, Navigation)
  - Adds authoritative "Report Header" with Project, Date, and Logo
  - Optimized for Landscape A4 printing

#### 2. Attendance Logic Tuning
- **Continuous Work Cutoff**:
  - Adjusted threshold from 7:00 AM to **5:00 AM**
  - Fixes false positives where normal early arrivals (e.g. 06:30 AM) were flagged as overnight shifts
- **Status Definitions**:
  - **Late**: Punch In > 08:15 AM
  - **Half Day**: Worked < 5 hours
  - **Stats Update**: "Present" count now includes Late & Half Day workers (Active workforce)

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

**Last Updated**: February 22, 2026
**Version**: 1.1.4
**Status**: ✅ Production Ready
