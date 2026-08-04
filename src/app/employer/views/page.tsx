import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getJobsByEmployer } from "@/lib/data/jobs";
import { Badge, Card, EmptyState } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { formatDate } from "@/lib/format";

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  draft: "default",
  pending: "warning",
  published: "success",
  rejected: "danger",
  expired: "default",
  closed: "default",
};

export default async function EmployerViewsPage() {
  const user = await getCurrentUser();
  const jobs = [...getJobsByEmployer(user!.id)].sort((a, b) => b.views - a.views);
  const maxViews = Math.max(1, ...jobs.map((j) => j.views));

  return (
    <div>
      <BackLink fallbackHref="/employer/dashboard" />
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Job Views</h1>
      <p className="text-sm text-muted mb-6">{jobs.reduce((sum, j) => sum + j.views, 0)} total views across all postings</p>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState title="No jobs posted yet" description="Post a job to start tracking views." />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}/applicants`}
              className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50 transition-colors duration-200"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                </div>
                <p className="text-xs text-muted mt-0.5">Posted {formatDate(job.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-64">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${Math.max(4, (job.views / maxViews) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900 w-16 text-right">{job.views} views</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
