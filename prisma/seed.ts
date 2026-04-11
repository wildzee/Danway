import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

// D657 SAP codes — migrated from hardcoded arrays in src/app/employees/page.tsx
const D657_SAP_CODES = [
  { designation: "Civil Divisional Manager", network: "5001323", activity: "0010", element: "0101" },
  { designation: "Civil Engineer", network: "5001323", activity: "0010", element: "0102" },
  { designation: "Document Coordinator", network: "5001323", activity: "0010", element: "0103" },
  { designation: "Office Boy", network: "5001323", activity: "0010", element: "0107" },
  { designation: "Draughtsman-civil", network: "5001323", activity: "0010", element: "0108" },
  { designation: "Office Assistant", network: "5001323", activity: "0010", element: "0110" },
  { designation: "NOC coordinator", network: "5001323", activity: "0010", element: "0111" },
  { designation: "Project coordinator", network: "5001323", activity: "0010", element: "0112" },
  { designation: "Time Keeper", network: "5001323", activity: "0010", element: "0113" },
  { designation: "Surveyor", network: "5001323", activity: "0010", element: "0117" },
  { designation: "LV Driver", network: "5001323", activity: "0010", element: "0118" },
  { designation: "HvDriver", network: "5001323", activity: "0010", element: "0119" },
  { designation: "JCB Operator", network: "5001323", activity: "0010", element: "0120" },
  { designation: "Shovvel Operator", network: "5001323", activity: "0010", element: "0121" },
  { designation: "Store Keeping", network: "5001323", activity: "0010", element: "0122" },
  { designation: "Safety Assistant", network: "5001323", activity: "0010", element: "0123" },
  { designation: "Surveyor - Hired", network: "5001323", activity: "0010", element: "0025" },
  { designation: "Civil Foreman", network: "5001323", activity: "0132", element: "0601" },
  { designation: "Civil Chargehand", network: "5001323", activity: "0132", element: "0602" },
  { designation: "Carpenter", network: "5001323", activity: "0132", element: "0603" },
  { designation: "Mason", network: "5001323", activity: "0132", element: "0604" },
  { designation: "Steel Fixer", network: "5001323", activity: "0132", element: "0605" },
  { designation: "Plumber", network: "5001323", activity: "0132", element: "0606" },
  { designation: "Painter", network: "5001323", activity: "0132", element: "0607" },
  { designation: "Scaffolder", network: "5001323", activity: "0132", element: "0608" },
  { designation: "Electrician-civil", network: "5001323", activity: "0132", element: "0609" },
  { designation: "Welder", network: "5001323", activity: "0132", element: "0610" },
  { designation: "Helper", network: "5001323", activity: "0132", element: "0612" },
  { designation: "Pumber", network: "5001323", activity: "0132", element: "0613" },
  { designation: "Store Keeper Assistant", network: "5001323", activity: "0132", element: "0614" },
];

async function main() {
  const initialPassword = process.env.D657_INITIAL_PASSWORD ?? "Danway@657";
  const passwordHash = await bcryptjs.hash(initialPassword, 12);

  // Create D657 site
  const d657 = await prisma.site.upsert({
    where: { code: "D657" },
    update: {},
    create: {
      code: "D657",
      name: "Site Daralhai",
      loginId: "D657",
      passwordHash,
    },
  });

  console.log(`✓ Site D657 created (id: ${d657.id})`);
  console.log(`  Login ID: D657`);
  console.log(`  Password: ${initialPassword}`);

  // Assign all orphaned employees (siteId = "") to D657
  const empResult = await prisma.employee.updateMany({
    where: { siteId: "" },
    data: { siteId: d657.id },
  });
  console.log(`✓ Assigned ${empResult.count} employees to D657`);

  // Assign all orphaned hired employees (siteId = "") to D657
  const hiredResult = await prisma.hiredEmployee.updateMany({
    where: { siteId: "" },
    data: { siteId: d657.id },
  });
  console.log(`✓ Assigned ${hiredResult.count} hired employees to D657`);

  // Seed D657 SAP code mappings
  let created = 0;
  for (const code of D657_SAP_CODES) {
    await prisma.sAPCodeMapping.upsert({
      where: { siteId_designation: { siteId: d657.id, designation: code.designation } },
      update: { network: code.network, activity: code.activity, element: code.element },
      create: { siteId: d657.id, ...code },
    });
    created++;
  }
  console.log(`✓ Seeded ${created} SAP code mappings for D657`);

  // Seed admin credentials hint
  console.log(`\nAdmin credentials (set in .env):`);
  console.log(`  ADMIN_LOGIN_ID=admin`);
  console.log(`  ADMIN_PASSWORD_HASH=<run: node -e "const b=require('bcryptjs');b.hash('yourpassword',12).then(console.log)">`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
