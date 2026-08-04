import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  const user = await getCurrentUser();
  if (!user || user.role !== "employer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = db.prepare("SELECT id, title FROM jobs WHERE id = ? AND employer_id = ?").get(jobId, user.id) as
    | { id: number; title: string }
    | undefined;
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = db
    .prepare(
      `SELECT s.full_name, s.headline, s.location, s.phone, a.status, a.created_at
       FROM applications a JOIN seeker_profiles s ON s.user_id = a.seeker_id
       WHERE a.job_id = ? ORDER BY a.created_at DESC`
    )
    .all(jobId) as { full_name: string; headline: string; location: string; phone: string; status: string; created_at: string }[];

  const header = ["Full Name", "Headline", "Location", "Phone", "Status", "Applied At"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.full_name, r.headline, r.location, r.phone, r.status, r.created_at].map((v) => csvEscape(String(v))).join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-job-${jobId}.csv"`,
    },
  });
}
