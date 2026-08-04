import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { formatSalary, timeAgo } from "@/lib/format";
import type { JobWithCompany } from "@/lib/data/jobs";

export function JobCard({ job, loggedIn = true }: { job: JobWithCompany; loggedIn?: boolean }) {
  return (
    <Link href={loggedIn ? `/jobs/${job.id}` : "/login"} className="block group">
      <Card className="p-5 cursor-pointer hover:border-brand/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-brand-dark">{job.title}</p>
            <p className="text-sm text-muted mt-0.5">
              {job.company_name} · {job.location}
            </p>
          </div>
          {job.featured === 1 && <Badge tone="brand">Featured</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge>{job.employment_type}</Badge>
          <Badge>{job.remote_type}</Badge>
          <Badge>{job.experience_level}</Badge>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-slate-700 font-medium">{formatSalary(job.salary_min, job.salary_max)}</span>
          <span className="text-muted">{job.published_at ? timeAgo(job.published_at) : ""}</span>
        </div>
      </Card>
    </Link>
  );
}
