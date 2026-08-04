import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJobsByEmployer } from "@/lib/data/jobs";
import { Badge, Card, LinkButton } from "@/components/ui";

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser();
  const userId = user!.id;

  const profile = db
    .prepare("SELECT company_name, verified FROM employer_profiles WHERE user_id = ?")
    .get(userId) as { company_name: string; verified: number };

  const jobs = getJobsByEmployer(userId);
  const activeJobs = jobs.filter((j) => j.status === "published").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const totalViews = jobs.reduce((sum, j) => sum + j.views, 0);
  const totalApplicants = jobs.reduce((sum, j) => sum + j.application_count, 0);

  const topJobs = [...jobs].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{profile.company_name}</h1>
        <Badge tone={profile.verified ? "success" : "warning"}>
          {profile.verified ? "Verified employer" : "Pending verification"}
        </Badge>
      </div>

      {!profile.verified && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            Your company is pending verification by our admin team. You can still post jobs — they
            will be reviewed before going live.
          </p>
        </Card>
      )}

      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard label="Active jobs" value={activeJobs} href="/employer/jobs?status=published" />
        <StatCard label="Pending review" value={pendingJobs} href="/employer/jobs?status=pending" />
        <StatCard label="Total applicants" value={totalApplicants} href="/employer/applicants" />
        <StatCard label="Total job views" value={totalViews} href="/employer/views" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Job performance</h2>
        <LinkButton href="/employer/jobs/new" size="sm">
          + Post a new job
        </LinkButton>
      </div>

      {topJobs.length === 0 ? (
        <Card className="p-6 text-sm text-muted">You haven&apos;t posted any jobs yet.</Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {topJobs.map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}/applicants`}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors duration-200 group"
            >
              <div>
                <p className="font-medium text-slate-900 group-hover:text-brand-dark">{job.title}</p>
                <p className="text-xs text-muted mt-0.5 capitalize">{job.status}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-slate-500">{job.views} views</span>
                <span className="text-base font-semibold text-brand-dark">{job.application_count} applicants</span>
                <span className="text-muted group-hover:text-brand-dark transition-colors duration-200">&rarr;</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="p-5 cursor-pointer hover:border-brand/40">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-muted mt-1">{label}</p>
      </Card>
    </Link>
  );
}
