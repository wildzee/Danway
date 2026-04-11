/*
  Warnings:

  - Added the required column `siteId` to the `SAPCodeMapping` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HiredEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT '',
    "project" TEXT NOT NULL DEFAULT 'D657',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HiredEmployee_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HiredEmployee_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HiredTimesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hiredEmployeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" REAL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HiredTimesheet_hiredEmployeeId_fkey" FOREIGN KEY ("hiredEmployeeId") REFERENCES "HiredEmployee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "lunchHours" REAL NOT NULL DEFAULT 1.0,
    "ramadanLunchHours" REAL NOT NULL DEFAULT 0.5,
    "ramadanActive" BOOLEAN NOT NULL DEFAULT false,
    "ramadanStart" DATETIME,
    "ramadanEnd" DATETIME,
    "siteStartTime" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "mobile" TEXT,
    "shift" TEXT NOT NULL,
    "isEngineer" BOOLEAN NOT NULL DEFAULT false,
    "allowOvertime" BOOLEAN NOT NULL DEFAULT true,
    "siteId" TEXT NOT NULL DEFAULT '',
    "project" TEXT NOT NULL DEFAULT 'D657',
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("activity", "createdAt", "designation", "element", "employeeId", "id", "isEngineer", "mobile", "name", "network", "project", "shift", "status", "updatedAt") SELECT "activity", "createdAt", "designation", "element", "employeeId", "id", "isEngineer", "mobile", "name", "network", "project", "shift", "status", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE INDEX "Employee_siteId_idx" ON "Employee"("siteId");
CREATE UNIQUE INDEX "Employee_siteId_employeeId_key" ON "Employee"("siteId", "employeeId");
CREATE TABLE "new_PunchRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "hiredEmployeeId" TEXT,
    "date" DATETIME NOT NULL,
    "project" TEXT,
    "punchIn" TEXT,
    "punchOut" TEXT,
    "workTime" TEXT,
    "status" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PunchRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PunchRecord_hiredEmployeeId_fkey" FOREIGN KEY ("hiredEmployeeId") REFERENCES "HiredEmployee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PunchRecord" ("createdAt", "date", "employeeId", "id", "importBatchId", "project", "punchIn", "punchOut", "status", "workTime") SELECT "createdAt", "date", "employeeId", "id", "importBatchId", "project", "punchIn", "punchOut", "status", "workTime" FROM "PunchRecord";
DROP TABLE "PunchRecord";
ALTER TABLE "new_PunchRecord" RENAME TO "PunchRecord";
CREATE INDEX "PunchRecord_employeeId_date_idx" ON "PunchRecord"("employeeId", "date");
CREATE INDEX "PunchRecord_hiredEmployeeId_date_idx" ON "PunchRecord"("hiredEmployeeId", "date");
CREATE TABLE "new_SAPCodeMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SAPCodeMapping_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SAPCodeMapping" ("activity", "createdAt", "designation", "element", "id", "network", "updatedAt") SELECT "activity", "createdAt", "designation", "element", "id", "network", "updatedAt" FROM "SAPCodeMapping";
DROP TABLE "SAPCodeMapping";
ALTER TABLE "new_SAPCodeMapping" RENAME TO "SAPCodeMapping";
CREATE INDEX "SAPCodeMapping_siteId_idx" ON "SAPCodeMapping"("siteId");
CREATE UNIQUE INDEX "SAPCodeMapping_siteId_designation_key" ON "SAPCodeMapping"("siteId", "designation");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_loginId_key" ON "Site"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "HiredEmployee_siteId_idx" ON "HiredEmployee"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "HiredEmployee_siteId_employeeId_key" ON "HiredEmployee"("siteId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HiredTimesheet_hiredEmployeeId_date_key" ON "HiredTimesheet"("hiredEmployeeId", "date");

-- CreateIndex
CREATE INDEX "PublicHoliday_date_idx" ON "PublicHoliday"("date");
