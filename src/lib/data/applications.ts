import { db } from "@/lib/db";

export const STALE_DAYS_THRESHOLD = 14;
export const AT_RISK_MIN_COUNT = 2;

const EARLY_STAGE_STATUSES = new Set(["submitted", "reviewed"]);

function daysSince(value: string): number {
  const d = new Date(value.replace(" ", "T") + (value.includes("T") ? "" : "Z"));
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export type ApplicationFollowUp = {
  id: number;
  job_id: number;
  title: string;
  company_name: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
  daysSinceUpdate: number;
  isStale: boolean;
  isRejected: boolean;
  needsFollowUp: boolean;
};

type ApplicationRow = Omit<
  ApplicationFollowUp,
  "daysSinceUpdate" | "isStale" | "isRejected" | "needsFollowUp"
>;

function withFollowUp(row: ApplicationRow): ApplicationFollowUp {
  const daysSinceUpdate = daysSince(row.updated_at);
  const isStale = EARLY_STAGE_STATUSES.has(row.status) && daysSinceUpdate >= STALE_DAYS_THRESHOLD;
  const isRejected = row.status === "rejected";
  return { ...row, daysSinceUpdate, isStale, isRejected, needsFollowUp: isStale || isRejected };
}

export function getSeekerApplicationsWithFollowUp(seekerId: number): ApplicationFollowUp[] {
  const rows = db
    .prepare(
      `SELECT a.id, a.job_id, j.title, e.company_name, j.location, a.status, a.created_at, a.updated_at
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE a.seeker_id = ?
       ORDER BY a.updated_at DESC`
    )
    .all(seekerId) as ApplicationRow[];

  return rows.map(withFollowUp);
}

export function getSeekerFollowUpSummary(seekerId: number) {
  const apps = getSeekerApplicationsWithFollowUp(seekerId);
  return {
    total: apps.length,
    stale: apps.filter((a) => a.isStale).length,
    rejected: apps.filter((a) => a.isRejected).length,
    needsFollowUp: apps.filter((a) => a.needsFollowUp).length,
  };
}

export type AtRiskSeeker = {
  user_id: number;
  full_name: string;
  email: string;
  headline: string;
  totalApplications: number;
  staleCount: number;
  rejectedCount: number;
  atRiskCount: number;
};

export type AdminApplication = {
  id: number;
  job_id: number;
  job_title: string;
  employer_id: number;
  company_name: string;
  seeker_id: number;
  seeker_name: string;
  seeker_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  messageCount: number;
  lastMessageAt: string | null;
  daysSinceUpdate: number;
  isStale: boolean;
  isRejected: boolean;
  needsFollowUp: boolean;
};

type AdminApplicationRow = Omit<
  AdminApplication,
  "daysSinceUpdate" | "isStale" | "isRejected" | "needsFollowUp"
>;

export function getAllApplicationsForAdmin(): AdminApplication[] {
  const rows = db
    .prepare(
      `SELECT a.id, a.job_id, j.title as job_title, j.employer_id, e.company_name,
              a.seeker_id, sp.full_name as seeker_name, u.email as seeker_email,
              a.status, a.created_at, a.updated_at,
              (SELECT COUNT(*) FROM messages m WHERE m.application_id = a.id) as messageCount,
              (SELECT MAX(created_at) FROM messages m WHERE m.application_id = a.id) as lastMessageAt
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN employer_profiles e ON e.user_id = j.employer_id
       JOIN seeker_profiles sp ON sp.user_id = a.seeker_id
       JOIN users u ON u.id = a.seeker_id
       ORDER BY a.updated_at DESC`
    )
    .all() as AdminApplicationRow[];

  return rows.map((row) => {
    const daysSinceUpdate = daysSince(row.updated_at);
    const isStale = EARLY_STAGE_STATUSES.has(row.status) && daysSinceUpdate >= STALE_DAYS_THRESHOLD;
    const isRejected = row.status === "rejected";
    return { ...row, daysSinceUpdate, isStale, isRejected, needsFollowUp: isStale || isRejected };
  });
}

export function getApplicationTrackingSummary() {
  const apps = getAllApplicationsForAdmin();
  return {
    total: apps.length,
    needsFollowUp: apps.filter((a) => a.needsFollowUp).length,
    stale: apps.filter((a) => a.isStale).length,
    rejected: apps.filter((a) => a.isRejected).length,
  };
}

export function getAtRiskSeekers(minAtRisk = AT_RISK_MIN_COUNT): AtRiskSeeker[] {
  const seekerRows = db
    .prepare(
      `SELECT u.id as user_id, u.email, sp.full_name, sp.headline
       FROM users u
       JOIN seeker_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'seeker'`
    )
    .all() as { user_id: number; email: string; full_name: string; headline: string }[];

  const results: AtRiskSeeker[] = [];
  for (const s of seekerRows) {
    const apps = getSeekerApplicationsWithFollowUp(s.user_id);
    const staleCount = apps.filter((a) => a.isStale).length;
    const rejectedCount = apps.filter((a) => a.isRejected).length;
    const atRiskCount = staleCount + rejectedCount;
    if (atRiskCount >= minAtRisk) {
      results.push({
        user_id: s.user_id,
        email: s.email,
        full_name: s.full_name,
        headline: s.headline,
        totalApplications: apps.length,
        staleCount,
        rejectedCount,
        atRiskCount,
      });
    }
  }

  return results.sort((a, b) => b.atRiskCount - a.atRiskCount);
}
