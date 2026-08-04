import { db } from "@/lib/db";
import { getJobById, incrementJobViews, getSimilarJobs } from "@/lib/data/jobs";
import type { SessionUser } from "@/lib/auth";

export async function loadJobDetail(jobId: number, user: SessionUser | null, options: { countView?: boolean } = {}) {
  const job = getJobById(jobId);
  if (!job) return null;

  const isOwner = user?.role === "employer" && user.id === job.employer_id;

  if (job.status !== "published" && !isOwner && user?.role !== "admin") {
    return null;
  }

  if (job.status === "published" && !isOwner && options.countView) {
    incrementJobViews(jobId);
    job.views += 1;
  }

  let existingApplication: { status: string; created_at: string } | undefined;
  let isSaved = false;
  let seekerResume: string | undefined;

  if (user?.role === "seeker") {
    existingApplication = db
      .prepare("SELECT status, created_at FROM applications WHERE job_id = ? AND seeker_id = ?")
      .get(jobId, user.id) as { status: string; created_at: string } | undefined;
    isSaved = Boolean(
      db.prepare("SELECT 1 FROM saved_jobs WHERE job_id = ? AND seeker_id = ?").get(jobId, user.id)
    );
    const profile = db
      .prepare("SELECT resume_filename FROM seeker_profiles WHERE user_id = ?")
      .get(user.id) as { resume_filename: string } | undefined;
    seekerResume = profile?.resume_filename;
  }

  const qualifications = job.qualifications
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = job.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const similarJobs = getSimilarJobs(job, 4);

  return { job, isOwner, existingApplication, isSaved, seekerResume, qualifications, skills, similarJobs };
}
