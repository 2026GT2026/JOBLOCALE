import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getJobsByEmployer } from "@/lib/data/jobs";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { closeJobAction, deleteJobAction, duplicateJobAction, promoteJobAction } from "@/lib/actions/employer";

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  draft: "default",
  pending: "warning",
  published: "success",
  rejected: "danger",
  expired: "default",
  closed: "default",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Active jobs",
  pending: "Pending review",
  draft: "Drafts",
  rejected: "Rejected",
  expired: "Expired",
  closed: "Closed",
};

export default async function EmployerJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  const allJobs = getJobsByEmployer(user!.id);
  const jobs = status ? allJobs.filter((j) => j.status === status) : allJobs;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {status ? STATUS_LABELS[status] ?? "Job Postings" : "Job Postings"}
          </h1>
          {status && (
            <Link href="/employer/jobs" className="text-sm text-brand-dark hover:underline">
              Clear filter · showing all {allJobs.length} jobs
            </Link>
          )}
        </div>
        <LinkButton href="/employer/jobs/new">+ Post a new job</LinkButton>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            title="You haven't posted any jobs yet"
            description="Create your first job posting to start receiving applications."
            action={<LinkButton href="/employer/jobs/new">Post a job</LinkButton>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-brand-dark">
                      {job.title}
                    </Link>
                    <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                    {job.featured === 1 && <Badge tone="brand">Featured</Badge>}
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {job.location} · Posted {formatDate(job.created_at)}
                    {job.deadline && ` · Deadline ${formatDate(job.deadline)}`}
                  </p>
                  {job.status === "rejected" && job.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">Rejected: {job.rejection_reason}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-1">
                    {job.views} views · {job.application_count} applicants
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/employer/jobs/${job.id}/applicants`}
                    className="text-sm px-3 py-1.5 rounded-xl border border-border transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95"
                  >
                    Applicants ({job.application_count})
                  </Link>
                  {(job.status === "draft" || job.status === "rejected") && (
                    <Link
                      href={`/employer/jobs/${job.id}/edit`}
                      className="text-sm px-3 py-1.5 rounded-xl border border-border transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95"
                    >
                      Edit
                    </Link>
                  )}
                  {job.status === "published" && job.featured === 0 && (
                    <form action={promoteJobAction}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <button className="text-sm px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 transition-all duration-200 ease-out hover:bg-amber-50 hover:scale-105 active:scale-95">
                        Promote (featured)
                      </button>
                    </form>
                  )}
                  {job.status === "published" && (
                    <form action={closeJobAction}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <button className="text-sm px-3 py-1.5 rounded-xl border border-border transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95">
                        Close
                      </button>
                    </form>
                  )}
                  <form action={duplicateJobAction}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button className="text-sm px-3 py-1.5 rounded-xl border border-border transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95">
                      Duplicate
                    </button>
                  </form>
                  {job.application_count === 0 && (job.status === "draft" || job.status === "rejected") && (
                    <form action={deleteJobAction}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <button className="text-sm px-3 py-1.5 rounded-xl border border-red-200 text-red-600 transition-all duration-200 ease-out hover:bg-red-50 hover:scale-105 active:scale-95">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
