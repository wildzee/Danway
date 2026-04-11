import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";
import * as XLSX from "xlsx";

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_\-/]+/g, "");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { siteId } = await params;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty or unreadable" }, { status: 400 });
  }

  // Normalize column names
  const normalizedRows = rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = String(val ?? "").trim();
    }
    return normalized;
  });

  // Column aliases
  const getField = (row: Record<string, string>, aliases: string[]): string => {
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== "") return row[alias];
    }
    return "";
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of normalizedRows) {
    const designation = getField(row, ["designation", "designations", "jobtitle", "position", "role"]);
    const network = getField(row, ["network", "networknumber", "networkno"]);
    const activity = getField(row, ["activity", "activitynumber", "activityno"]);
    const element = getField(row, ["element", "elementnumber", "elementno", "wbselement"]);

    if (!designation || !network || !activity || !element) {
      skipped++;
      continue;
    }

    const existing = await prisma.sAPCodeMapping.findUnique({
      where: { siteId_designation: { siteId, designation } },
    });

    if (existing) {
      await prisma.sAPCodeMapping.update({
        where: { siteId_designation: { siteId, designation } },
        data: { network, activity, element },
      });
      updated++;
    } else {
      await prisma.sAPCodeMapping.create({
        data: { siteId, designation, network, activity, element },
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, created, updated, skipped, total: rows.length });
}
