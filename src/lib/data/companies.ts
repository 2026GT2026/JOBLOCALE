import { db } from "@/lib/db";
import { expireOldJobs } from "@/lib/data/jobs";

export type CompanyWithJobs = {
  user_id: number;
  company_name: string;
  location: string;
  industry: string;
  logo_path: string;
  verified: number;
  job_count: number;
};

// All employers that currently have at least one published job, ordered by
// how many openings they have (most active first).
export function getCompaniesWithJobs(): CompanyWithJobs[] {
  expireOldJobs();
  return db
    .prepare(
      `SELECT e.user_id, e.company_name, e.location, e.industry, e.logo_path, e.verified,
              COUNT(j.id) as job_count
       FROM employer_profiles e
       JOIN jobs j ON j.employer_id = e.user_id AND j.status = 'published'
       GROUP BY e.user_id
       HAVING job_count > 0
       ORDER BY job_count DESC, e.company_name ASC`
    )
    .all() as CompanyWithJobs[];
}
