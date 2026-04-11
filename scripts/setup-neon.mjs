/**
 * setup-neon.mjs
 * One-time production setup for Neon PostgreSQL.
 * Run AFTER `prisma db push` fails on FK constraints.
 *
 * Usage:
 *   DATABASE_URL="<neon-pooled-url>" node scripts/setup-neon.mjs
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

const D657_SITE_ID = "d657-danway-site-primary-0001";
const D657_HASH = process.env.D657_PASSWORD_HASH || "$2b$12$h1GA5PzomWRce0h97DZxyu4UCZ9BjFNHo7hQHE/qMHfIc2qCD94Pm"; // Danway@657

const SAP_CODES = [
  { designation: "Carpenter", network: "D-657-H-C10-020", activity: "0020", element: "00001872" },
  { designation: "Civil Foreman", network: "D-657-H-C10-020", activity: "0020", element: "00001874" },
  { designation: "Concrete Cutter", network: "D-657-H-C10-020", activity: "0020", element: "00001873" },
  { designation: "Driver", network: "D-657-H-C10-020", activity: "0020", element: "00001875" },
  { designation: "Duckman", network: "D-657-H-C10-020", activity: "0020", element: "00001876" },
  { designation: "Electrician", network: "D-657-H-E10-010", activity: "0010", element: "00001877" },
  { designation: "Electrical Foreman", network: "D-657-H-E10-010", activity: "0010", element: "00001878" },
  { designation: "Electrical Engineer", network: "D-657-H-E10-010", activity: "0010", element: "00001879" },
  { designation: "Fabricator", network: "D-657-H-M10-010", activity: "0010", element: "00001880" },
  { designation: "Fitter", network: "D-657-H-M10-010", activity: "0010", element: "00001881" },
  { designation: "General Foreman", network: "D-657-H-C10-020", activity: "0020", element: "00001882" },
  { designation: "Helper", network: "D-657-H-C10-020", activity: "0020", element: "00001883" },
  { designation: "HVAC Technician", network: "D-657-H-M10-010", activity: "0010", element: "00001884" },
  { designation: "Instrument Technician", network: "D-657-H-E10-010", activity: "0010", element: "00001885" },
  { designation: "Labourer", network: "D-657-H-C10-020", activity: "0020", element: "00001886" },
  { designation: "Linesman", network: "D-657-H-E10-010", activity: "0010", element: "00001887" },
  { designation: "Mason", network: "D-657-H-C10-020", activity: "0020", element: "00001888" },
  { designation: "Mechanical Engineer", network: "D-657-H-M10-010", activity: "0010", element: "00001889" },
  { designation: "Mechanical Foreman", network: "D-657-H-M10-010", activity: "0010", element: "00001890" },
  { designation: "Painter", network: "D-657-H-C10-020", activity: "0020", element: "00001891" },
  { designation: "Pipe Fitter", network: "D-657-H-M10-010", activity: "0010", element: "00001892" },
  { designation: "Plumber", network: "D-657-H-M10-010", activity: "0010", element: "00001893" },
  { designation: "Project Engineer", network: "D-657-H-C10-020", activity: "0020", element: "00001894" },
  { designation: "Project Manager", network: "D-657-H-C10-020", activity: "0020", element: "00001895" },
  { designation: "Safety Officer", network: "D-657-H-C10-020", activity: "0020", element: "00001896" },
  { designation: "Site Engineer", network: "D-657-H-C10-020", activity: "0020", element: "00001897" },
  { designation: "Steel Fixer", network: "D-657-H-C10-020", activity: "0020", element: "00001898" },
  { designation: "Storekeeper", network: "D-657-H-C10-020", activity: "0020", element: "00001899" },
  { designation: "Surveyor", network: "D-657-H-C10-020", activity: "0020", element: "00001900" },
  { designation: "Welder", network: "D-657-H-M10-010", activity: "0010", element: "00001901" },
];

async function main() {
  console.log("🔗 Connecting to Neon...");

  // Step 1: Create D657 site if it doesn't exist
  console.log("📦 Creating D657 site...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Site" ("id", "code", "name", "loginId", "passwordHash", "createdAt", "updatedAt")
    VALUES ($1, 'D657', 'Site Daralhai', 'D657', $2, NOW(), NOW())
    ON CONFLICT ("code") DO NOTHING
  `, D657_SITE_ID, D657_HASH);

  // Fetch the actual D657 id (in case it already existed with a different id)
  const [site] = await prisma.$queryRawUnsafe(`SELECT "id" FROM "Site" WHERE "code" = 'D657'`);
  const siteId = site.id;
  console.log(`✅ D657 site id: ${siteId}`);

  // Step 2: Add siteId columns if they don't exist (safe — skips if already there)
  console.log("🔧 Adding siteId columns if missing...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "siteId" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "HiredEmployee" ADD COLUMN IF NOT EXISTS "siteId" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SAPCodeMapping" ADD COLUMN IF NOT EXISTS "siteId" TEXT NOT NULL DEFAULT ''`);

  // Step 3: Assign all unassigned records to D657
  const empUpdated = await prisma.$executeRawUnsafe(`UPDATE "Employee" SET "siteId" = $1 WHERE "siteId" = ''`, siteId);
  const hiredUpdated = await prisma.$executeRawUnsafe(`UPDATE "HiredEmployee" SET "siteId" = $1 WHERE "siteId" = ''`, siteId);
  const sapUpdated = await prisma.$executeRawUnsafe(`UPDATE "SAPCodeMapping" SET "siteId" = $1 WHERE "siteId" = ''`, siteId);
  console.log(`✅ Assigned: ${empUpdated} employees, ${hiredUpdated} hired workers, ${sapUpdated} SAP rows → D657`);

  // Step 4: Seed SAP codes for D657 if none exist
  const [{ count }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "SAPCodeMapping" WHERE "siteId" = $1`, siteId);
  if (Number(count) === 0) {
    console.log("📋 Seeding D657 SAP codes...");
    for (const code of SAP_CODES) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "SAPCodeMapping" ("id", "siteId", "designation", "network", "activity", "element", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("siteId", "designation") DO NOTHING
      `, siteId, code.designation, code.network, code.activity, code.element);
    }
    console.log(`✅ Seeded ${SAP_CODES.length} SAP codes`);
  } else {
    console.log(`ℹ️  SAP codes already exist (${count}), skipping seed`);
  }

  console.log("\n✅ Neon setup complete. Now run: prisma db push --accept-data-loss");
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
