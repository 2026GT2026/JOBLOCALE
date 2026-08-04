import Link from "next/link";
import { Badge, Card, LinkButton } from "@/components/ui";
import { formatDate, formatSalary, timeAgo } from "@/lib/format";
import { ApplyForm } from "@/components/seeker/apply-form";
import { toggleSaveJobAction } from "@/lib/actions/seeker";
import type { loadJobDetail } from "@/lib/data/job-detail";

type JobDetail = NonNullable<Awaited<ReturnType<typeof loadJobDetail>>>;

export function JobDetailPane({
  data,
  user,
  applied,
}: {
  data: JobDetail;
  user: { role: string } | null;
  applied?: boolean;
}) {
  const { job, isOwner, existingApplication, isSaved, seekerResume, qualifications, skills, similarJobs } = data;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8">
      <div>
        {job.status !== "published" && (
          <div className="mb-4">
            <Badge tone={job.status === "rejected" ? "danger" : "warning"}>
              {job.status === "pending" ? "Pending admin approval" : job.status === "rejected" ? "Rejected" : job.status}
            </Badge>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-muted mt-1">
              {job.company_name} · {job.location}
              {job.verified === 1 && (
                <span className="text-brand-dark font-medium"> · Verified employer</span>
              )}
            </p>
          </div>
          {job.featured === 1 && <Badge tone="brand">Featured</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge>{job.employment_type}</Badge>
          <Badge>{job.remote_type}</Badge>
          <Badge>{job.experience_level}</Badge>
          <Badge>{job.industry}</Badge>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-slate-900 mb-2">Job description</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{job.description}</p>

          {qualifications.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-900 mt-6 mb-2">Required qualifications</h2>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}

          {skills.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-900 mt-6 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-slate-900 mb-2">About {job.company_name}</h2>
          <p className="text-sm text-slate-600">{job.company_location}</p>
        </Card>

        {similarJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-slate-900 mb-3">Similar jobs</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {similarJobs.map((sj) => (
                <Link
                  key={sj.id}
                  href={`/jobs?selected=${sj.id}`}
                  className="block group"
                  scroll={false}
                >
                  <Card className="p-4 cursor-pointer hover:border-brand/40">
                    <p className="font-medium text-slate-900 group-hover:text-brand-dark">{sj.title}</p>
                    <p className="text-sm text-muted mt-0.5">
                      {sj.company_name} · {sj.location}
                    </p>
                    <p className="text-sm text-slate-700 font-medium mt-2">
                      {formatSalary(sj.salary_min, sj.salary_max)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-6">
          <p className="text-lg font-semibold text-slate-900">{formatSalary(job.salary_min, job.salary_max)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Posted</dt>
              <dd className="text-slate-700">{job.published_at ? timeAgo(job.published_at) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Application deadline</dt>
              <dd className="text-slate-700">{job.deadline ? formatDate(job.deadline) : "Open"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Views</dt>
              <dd className="text-slate-700">{job.views}</dd>
            </div>
          </dl>

          {!user && (
            <div className="mt-5 space-y-2">
              <LinkButton href="/login" className="w-full">
                Log in to apply
              </LinkButton>
              <p className="text-xs text-center text-muted">
                No account?{" "}
                <Link href="/register?role=seeker" className="text-brand-dark hover:underline">
                  Sign up as a job seeker
                </Link>
              </p>
            </div>
          )}

          {user?.role === "employer" && !isOwner && (
            <p className="mt-5 text-xs text-muted">Only job seekers can apply to jobs.</p>
          )}

          {isOwner && (
            <LinkButton href={`/employer/jobs/${job.id}/applicants`} className="w-full mt-5">
              View applicants
            </LinkButton>
          )}

          {user?.role === "seeker" && (
            <div className="mt-5 space-y-3">
              <form action={toggleSaveJobAction}>
                <input type="hidden" name="job_id" value={job.id} />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-border py-2 text-sm font-medium transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95"
                >
                  {isSaved ? "★ Saved" : "☆ Save job"}
                </button>
              </form>

              {existingApplication ? (
                <div className="rounded-xl bg-plum-50 border border-plum-200 px-3 py-2 text-sm text-plum-800">
                  Applied {timeAgo(existingApplication.created_at)} · Status:{" "}
                  <span className="font-medium capitalize">{existingApplication.status}</span>
                </div>
              ) : applied ? (
                <div className="rounded-xl bg-plum-50 border border-plum-200 px-3 py-2 text-sm text-plum-800">
                  Application submitted successfully!
                </div>
              ) : job.status === "published" ? (
                <ApplyForm jobId={job.id} hasResumeOnFile={Boolean(seekerResume)} />
              ) : null}
            </div>
          )}
        </Card>
      </aside>
    </div>
  );
}
