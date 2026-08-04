import { db } from "@/lib/db";

export function getPlatformStats() {
  const employers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'employer'").get() as { c: number };
  const seekers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'seeker'").get() as { c: number };
  const publishedJobs = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status = 'published'").get() as {
    c: number;
  };
  const applications = db.prepare("SELECT COUNT(*) as c FROM applications").get() as { c: number };

  return {
    employers: employers.c,
    seekers: seekers.c,
    publishedJobs: publishedJobs.c,
    applications: applications.c,
  };
}

export function getAdminOverview() {
  const users = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  const employers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'employer'").get() as { c: number };
  const seekers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'seeker'").get() as { c: number };
  const suspended = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'suspended'").get() as {
    c: number;
  };
  const pendingJobs = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status = 'pending'").get() as {
    c: number;
  };
  const publishedJobs = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status = 'published'").get() as {
    c: number;
  };
  const unverifiedEmployers = db
    .prepare("SELECT COUNT(*) as c FROM employer_profiles WHERE verified = 0")
    .get() as { c: number };
  const applications = db.prepare("SELECT COUNT(*) as c FROM applications").get() as { c: number };
  const revenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'").get() as {
    total: number;
  };

  const jobsByDay = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count FROM jobs
       WHERE created_at >= datetime('now', '-13 days')
       GROUP BY date(created_at) ORDER BY day ASC`
    )
    .all() as { day: string; count: number }[];

  const usersByDay = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count FROM users
       WHERE created_at >= datetime('now', '-13 days')
       GROUP BY date(created_at) ORDER BY day ASC`
    )
    .all() as { day: string; count: number }[];

  const jobsByIndustry = db
    .prepare(
      `SELECT industry, COUNT(*) as count FROM jobs WHERE status = 'published' GROUP BY industry ORDER BY count DESC`
    )
    .all() as { industry: string; count: number }[];

  return {
    totalUsers: users.c,
    employers: employers.c,
    seekers: seekers.c,
    suspended: suspended.c,
    pendingJobs: pendingJobs.c,
    publishedJobs: publishedJobs.c,
    unverifiedEmployers: unverifiedEmployers.c,
    applications: applications.c,
    revenue: revenue.total,
    jobsByDay,
    usersByDay,
    jobsByIndustry,
  };
}
