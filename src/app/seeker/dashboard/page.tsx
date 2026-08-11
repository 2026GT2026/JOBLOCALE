import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFeaturedJobs, searchJobs } from "@/lib/data/jobs";
import { getSeekerFollowUpSummary } from "@/lib/data/applications";
import { Badge, Card } from "@/components/ui";
import { CompanyLogo } from "@/components/company-logo";
import { formatSalary, timeAgo } from "@/lib/format";
import { ProfileStrength } from "@/components/seeker/profile-strength";
import { FollowUpSummaryCard } from "@/components/seeker/followup-panel";
import type { SeekerProfileForAnalysis } from "@/lib/profile-analysis";

export default async function SeekerDashboardPage() {
  const user = await getCurrentUser();
  const userId = user!.id;

  const profile = db
    .prepare(
      `SELECT full_name, phone, location, headline, skills, experience, education, portfolio_url, linkedin_url, resume_filename, resume_path
       FROM seeker_profiles WHERE user_id = ?`
    )
    .get(userId) as SeekerProfileForAnalysis & { full_name: string; resume_path: string };

  const applicationCount = db
    .prepare("SELECT COUNT(*) as c FROM applications WHERE seeker_id = ?")
    .get(userId) as { c: number };
  const savedCount = db.prepare("SELECT COUNT(*) as c FROM saved_jobs WHERE seeker_id = ?").get(userId) as {
    c: number;
  };
  const alertCount = db.prepare("SELECT COUNT(*) as c FROM job_alerts WHERE seeker_id = ?").get(userId) as {
    c: number;
  };
  const followUp = getSeekerFollowUpSummary(userId);

  const suggested = profile.location
    ? searchJobs({ location: profile.location, pageSize: 4 }).jobs
    : getFeaturedJobs(4);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile.full_name || "there"}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={applicationCount.c} href="/seeker/applications" />
        <StatCard label="Saved jobs" value={savedCount.c} href="/seeker/saved" />
        <StatCard label="Job alerts" value={alertCount.c} href="/seeker/alerts" />
        <FollowUpSummaryCard stale={followUp.stale} rejected={followUp.rejected} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Suggested for you</h2>
            <Link href="/jobs" className="text-sm text-brand-dark hover:underline">
              Browse all jobs →
            </Link>
          </div>
          {suggested.length === 0 ? (
            <Card className="p-6 text-sm text-muted">No suggestions yet — try browsing all jobs.</Card>
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {suggested.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs?selected=${job.id}`}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors duration-200 group"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <CompanyLogo name={job.company_name} logoPath={job.logo_path} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-slate-900 group-hover:text-brand-dark truncate min-w-0">
                          {job.title}
                        </p>
                        {job.featured === 1 && (
                          <span className="shrink-0">
                            <Badge tone="brand">Featured</Badge>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted mt-0.5 truncate">
                        {job.company_name} · {job.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <span className="text-slate-700 font-medium hidden sm:inline">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                    <span className="text-muted group-hover:text-brand-dark transition-colors duration-200">&rarr;</span>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>

        <ProfileStrength profile={profile} compact />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-shadow">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-muted mt-1">{label}</p>
      </Card>
    </Link>
  );
}
