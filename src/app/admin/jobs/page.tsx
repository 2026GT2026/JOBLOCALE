import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { approveJobAction, rejectJobAction } from "@/lib/actions/admin";

type Row = {
  id: number;
  title: string;
  location: string;
  status: string;
  created_at: string;
  company_name: string;
};

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  draft: "default",
  pending: "warning",
  published: "success",
  rejected: "danger",
  expired: "default",
  closed: "default",
};

export default async function AdminJobsPage() {
  const pending = db
    .prepare(
      `SELECT j.id, j.title, j.location, j.status, j.created_at, e.company_name
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.status = 'pending' ORDER BY j.created_at ASC`
    )
    .all() as Row[];

  const others = db
    .prepare(
      `SELECT j.id, j.title, j.location, j.status, j.created_at, e.company_name
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.status != 'pending' ORDER BY j.created_at DESC LIMIT 50`
    )
    .all() as Row[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Job Moderation Queue</h1>
        {pending.length === 0 ? (
          <Card>
            <EmptyState title="Nothing to review" description="New job submissions will appear here." />
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((job) => (
              <Card key={job.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-brand-dark">
                      {job.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {job.company_name} · {job.location} · Submitted {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={approveJobAction}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <button className="text-sm px-3 py-1.5 rounded-xl bg-emerald-600 text-white transition-all duration-200 ease-out hover:bg-emerald-700 hover:scale-105 active:scale-95">
                        Approve
                      </button>
                    </form>
                    <form action={rejectJobAction} className="flex items-center gap-2">
                      <input type="hidden" name="job_id" value={job.id} />
                      <input
                        name="reason"
                        placeholder="Rejection reason"
                        className="text-sm rounded-xl border border-border px-2 py-1.5 w-40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                      <button className="text-sm px-3 py-1.5 rounded-xl border border-red-200 text-red-600 transition-all duration-200 ease-out hover:bg-red-50 hover:scale-105 active:scale-95">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">All other jobs</h2>
        <Card className="divide-y divide-border">
          {others.map((job) => (
            <div key={job.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <Link href={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-brand-dark">
                  {job.title}
                </Link>
                <p className="text-sm text-muted">
                  {job.company_name} · {job.location} · {formatDate(job.created_at)}
                </p>
              </div>
              <Badge tone={statusTone[job.status]}>{job.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
