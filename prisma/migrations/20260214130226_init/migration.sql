-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "mobile" TEXT,
    "shift" TEXT NOT NULL,
    "isEngineer" BOOLEAN NOT NULL DEFAULT false,
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PunchRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "punchIn" TEXT,
    "punchOut" TEXT,
    "workTime" TEXT,
    "status" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PunchRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "aaType" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "shift" TEXT NOT NULL,
    "remarks" TEXT,
    "submittedToSAP" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "exportBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "processedBy" TEXT,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "SAPCodeMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShiftConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftType" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lunchHours" REAL NOT NULL DEFAULT 1.0,
    "normalHours" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE INDEX "PunchRecord_employeeId_date_idx" ON "PunchRecord"("employeeId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_employeeId_date_idx" ON "AttendanceRecord"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SAPCodeMapping_designation_key" ON "SAPCodeMapping"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftConfig_shiftType_key" ON "ShiftConfig"("shiftType");
