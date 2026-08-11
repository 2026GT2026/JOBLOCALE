import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { resolveUploadPath } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  const logoOwner = db
    .prepare("SELECT user_id FROM employer_profiles WHERE logo_path = ?")
    .get(filename) as { user_id: number } | undefined;

  let authorized = Boolean(logoOwner);

  if (!authorized) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "admin") {
      authorized = true;
    } else {
      const seekerOwner = db
        .prepare("SELECT user_id FROM seeker_profiles WHERE resume_path = ?")
        .get(filename) as { user_id: number } | undefined;
      if (seekerOwner && seekerOwner.user_id === user.id) authorized = true;

      if (!authorized) {
        const appRow = db
          .prepare(
            `SELECT a.seeker_id as seeker_id, j.employer_id as employer_id
             FROM applications a JOIN jobs j ON j.id = a.job_id
             WHERE a.resume_path = ?`
          )
          .get(filename) as { seeker_id: number; employer_id: number } | undefined;
        if (appRow && (appRow.seeker_id === user.id || appRow.employer_id === user.id)) {
          authorized = true;
        }
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = resolveUploadPath(filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
