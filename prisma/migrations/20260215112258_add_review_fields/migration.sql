-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
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
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "submittedToSAP" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "exportBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("aaType", "activity", "createdAt", "date", "element", "employeeId", "exportBatchId", "hours", "id", "network", "remarks", "shift", "submittedAt", "submittedToSAP") SELECT "aaType", "activity", "createdAt", "date", "element", "employeeId", "exportBatchId", "hours", "id", "network", "remarks", "shift", "submittedAt", "submittedToSAP" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_employeeId_date_idx" ON "AttendanceRecord"("employeeId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
