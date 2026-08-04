import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JobWithCompany } from "@/lib/data/jobs";
import { JobCard } from "@/components/job-card";
import { Card, EmptyState, LinkButton } from "@/components/ui";

export default async function SavedJobsPage() {
  const user = await getCurrentUser();

  const jobs = db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM saved_jobs s
       JOIN jobs j ON j.id = s.job_id
       JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE s.seeker_id = ?
       ORDER BY s.created_at DESC`
    )
    .all(user!.id) as JobWithCompany[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Saved Jobs</h1>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            title="No saved jobs yet"
            description="Save jobs you're interested in to revisit them later."
            action={<LinkButton href="/jobs">Browse jobs</LinkButton>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
