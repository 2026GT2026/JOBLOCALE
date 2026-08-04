import { db } from "@/lib/db";

export type Job = {
  id: number;
  employer_id: number;
  title: string;
  location: string;
  employment_type: string;
  remote_type: string;
  salary_min: number | null;
  salary_max: number | null;
  industry: string;
  experience_level: string;
  description: string;
  qualifications: string;
  skills: string;
  deadline: string | null;
  status: "draft" | "pending" | "published" | "rejected" | "expired" | "closed";
  rejection_reason: string;
  featured: number;
  views: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type JobWithCompany = Job & {
  company_name: string;
  company_location: string;
  logo_path: string;
  verified: number;
};

export function expireOldJobs() {
  db.prepare(
    `UPDATE jobs SET status = 'expired', updated_at = datetime('now')
     WHERE status = 'published' AND deadline IS NOT NULL AND date(deadline) < date('now')`
  ).run();
}

export type JobSearchParams = {
  keyword?: string;
  location?: string;
  industry?: string;
  employmentType?: string;
  remoteType?: string;
  experienceLevel?: string;
  datePosted?: string; // "1" | "3" | "7" | "30"
  page?: number;
  pageSize?: number;
};

export function searchJobs(params: JobSearchParams) {
  expireOldJobs();

  const clauses: string[] = ["j.status = 'published'"];
  const args: (string | number)[] = [];

  if (params.keyword) {
    clauses.push("(j.title LIKE ? OR j.description LIKE ? OR j.skills LIKE ? OR e.company_name LIKE ?)");
    const like = `%${params.keyword}%`;
    args.push(like, like, like, like);
  }
  if (params.location) {
    clauses.push("j.location LIKE ?");
    args.push(`%${params.location}%`);
  }
  if (params.industry) {
    clauses.push("j.industry = ?");
    args.push(params.industry);
  }
  if (params.employmentType) {
    clauses.push("j.employment_type = ?");
    args.push(params.employmentType);
  }
  if (params.remoteType) {
    clauses.push("j.remote_type = ?");
    args.push(params.remoteType);
  }
  if (params.experienceLevel) {
    clauses.push("j.experience_level = ?");
    args.push(params.experienceLevel);
  }
  if (params.datePosted) {
    clauses.push("j.published_at >= datetime('now', ?)");
    args.push(`-${Number(params.datePosted)} days`);
  }

  const pageSize = params.pageSize ?? 10;
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;

  const where = clauses.join(" AND ");

  const total = db
    .prepare(
      `SELECT COUNT(*) as c FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id WHERE ${where}`
    )
    .get(...args) as { c: number };

  const rows = db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE ${where}
       ORDER BY j.featured DESC, j.published_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...args, pageSize, offset) as JobWithCompany[];

  return { jobs: rows, total: total.c, page, pageSize, totalPages: Math.max(1, Math.ceil(total.c / pageSize)) };
}

export function getFeaturedJobs(limit = 6) {
  expireOldJobs();
  return db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.status = 'published'
       ORDER BY j.featured DESC, j.published_at DESC
       LIMIT ?`
    )
    .all(limit) as JobWithCompany[];
}

export function getJobById(id: number) {
  return db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.id = ?`
    )
    .get(id) as JobWithCompany | undefined;
}

export function incrementJobViews(id: number) {
  db.prepare("UPDATE jobs SET views = views + 1 WHERE id = ?").run(id);
}

export function getSimilarJobs(job: Pick<Job, "id" | "industry" | "location">, limit = 4) {
  const byIndustry = db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.status = 'published' AND j.industry = ? AND j.id != ?
       ORDER BY j.featured DESC, j.published_at DESC
       LIMIT ?`
    )
    .all(job.industry, job.id, limit) as JobWithCompany[];

  if (byIndustry.length >= limit) return byIndustry;

  const excludeIds = [job.id, ...byIndustry.map((j) => j.id)];
  const placeholders = excludeIds.map(() => "?").join(",");
  const rest = db
    .prepare(
      `SELECT j.*, e.company_name as company_name, e.location as company_location, e.logo_path as logo_path, e.verified as verified
       FROM jobs j JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE j.status = 'published' AND j.id NOT IN (${placeholders})
       ORDER BY j.featured DESC, j.published_at DESC
       LIMIT ?`
    )
    .all(...excludeIds, limit - byIndustry.length) as JobWithCompany[];

  return [...byIndustry, ...rest];
}

export function getJobsByEmployer(employerId: number) {
  expireOldJobs();
  return db
    .prepare(
      `SELECT j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
       FROM jobs j WHERE j.employer_id = ? ORDER BY j.created_at DESC`
    )
    .all(employerId) as (Job & { application_count: number })[];
}

export { INDUSTRIES, EMPLOYMENT_TYPES, REMOTE_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants";
