-- AlterTable
ALTER TABLE "PunchRecord" ADD COLUMN "project" TEXT;

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
    "project" TEXT NOT NULL DEFAULT 'D657',
    "network" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("activity", "createdAt", "designation", "element", "employeeId", "id", "isEngineer", "mobile", "name", "network", "shift", "status", "updatedAt") SELECT "activity", "createdAt", "designation", "element", "employeeId", "id", "isEngineer", "mobile", "name", "network", "shift", "status", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
