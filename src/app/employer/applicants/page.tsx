import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { formatDate } from "@/lib/format";
import { StatusSelect } from "@/components/employer/status-select";

type Applicant = {
  id: number;
  job_id: number;
  job_title: string;
  status: string;
  created_at: string;
  full_name: string;
  headline: string;
  location: string;
};

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  submitted: "default",
  reviewed: "brand",
  shortlisted: "brand",
  interview: "warning",
  rejected: "danger",
  hired: "success",
};

export default async function EmployerApplicantsPage() {
  const user = await getCurrentUser();

  const applicants = db
    .prepare(
      `SELECT a.id, a.job_id, j.title as job_title, a.status, a.created_at,
              s.full_name, s.headline, s.location
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN seeker_profiles s ON s.user_id = a.seeker_id
       WHERE j.employer_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(user!.id) as Applicant[];

  return (
    <div>
      <BackLink fallbackHref="/employer/dashboard" />
      <h1 className="text-2xl font-bold text-slate-900 mb-1">All Applicants</h1>
      <p className="text-sm text-muted mb-6">{applicants.length} applicant(s) across all job postings</p>

      {applicants.length === 0 ? (
        <Card>
          <EmptyState title="No applicants yet" description="Check back once candidates start applying to your jobs." />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {applicants.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-slate-900">{a.full_name}</p>
                <p className="text-sm text-muted">
                  {a.headline} {a.location && `· ${a.location}`}
                </p>
                <p className="text-xs text-muted mt-1">
                  Applied {formatDate(a.created_at)} for{" "}
                  <Link href={`/employer/jobs/${a.job_id}/applicants`} className="text-brand-dark hover:underline">
                    {a.job_title}
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone[a.status] ?? "default"}>{a.status}</Badge>
                <StatusSelect applicationId={a.id} jobId={a.job_id} status={a.status} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
