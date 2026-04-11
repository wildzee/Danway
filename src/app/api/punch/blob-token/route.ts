import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSession } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  const sessionResult = await requireSession(request);
  if (sessionResult instanceof NextResponse) return sessionResult;

  const body = (await request.json()) as HandleUploadBody;

  const json = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream",
      ],
      maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
    }),
    onUploadCompleted: async () => {
      // Processing is triggered separately by the client via /api/punch/process
    },
  });

  return NextResponse.json(json);
}
