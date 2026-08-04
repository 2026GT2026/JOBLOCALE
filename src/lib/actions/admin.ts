"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function setUserStatusAction(formData: FormData) {
  await requireRole("admin");
  const userId = Number(formData.get("user_id"));
  const status = String(formData.get("status"));
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
  revalidatePath("/admin/users");
}

export async function setEmployerVerifiedAction(formData: FormData) {
  await requireRole("admin");
  const userId = Number(formData.get("user_id"));
  const verified = Number(formData.get("verified"));
  db.prepare("UPDATE employer_profiles SET verified = ?, updated_at = datetime('now') WHERE user_id = ?").run(
    verified,
    userId
  );
  revalidatePath("/admin/employers");
}

function notifyJobStatus(jobId: number, title: string, body: string, link: string) {
  const job = db.prepare("SELECT employer_id FROM jobs WHERE id = ?").get(jobId) as
    | { employer_id: number }
    | undefined;
  if (!job) return;
  const prefs = db
    .prepare("SELECT notify_job_status FROM employer_profiles WHERE user_id = ?")
    .get(job.employer_id) as { notify_job_status: number } | undefined;
  if (prefs?.notify_job_status) {
    createNotification(job.employer_id, title, body, link);
  }
}

export async function approveJobAction(formData: FormData) {
  await requireRole("admin");
  const jobId = Number(formData.get("job_id"));
  const job = db.prepare("SELECT title FROM jobs WHERE id = ?").get(jobId) as { title: string } | undefined;
  db.prepare(
    "UPDATE jobs SET status = 'published', published_at = datetime('now'), rejection_reason = '', updated_at = datetime('now') WHERE id = ?"
  ).run(jobId);
  if (job) {
    notifyJobStatus(jobId, "Job approved", `"${job.title}" is now live.`, "/employer/jobs");
  }
  revalidatePath("/admin/jobs");
}

export async function rejectJobAction(formData: FormData) {
  await requireRole("admin");
  const jobId = Number(formData.get("job_id"));
  const reason = String(formData.get("reason") ?? "Does not meet posting guidelines.");
  const job = db.prepare("SELECT title FROM jobs WHERE id = ?").get(jobId) as { title: string } | undefined;
  db.prepare(
    "UPDATE jobs SET status = 'rejected', rejection_reason = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(reason, jobId);
  if (job) {
    notifyJobStatus(jobId, "Job rejected", `"${job.title}" was rejected: ${reason}`, "/employer/jobs");
  }
  revalidatePath("/admin/jobs");
}

export async function sendAdminMessageAction(formData: FormData) {
  await requireRole("admin");
  const applicationId = Number(formData.get("application_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const application = db
    .prepare(
      `SELECT a.seeker_id, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`
    )
    .get(applicationId) as { seeker_id: number; title: string } | undefined;
  if (!application) return;

  db.prepare("INSERT INTO messages (application_id, sender_role, body) VALUES (?, 'admin', ?)").run(
    applicationId,
    body
  );

  createNotification(
    application.seeker_id,
    "Update from JobLocale Support",
    `You have a new message about your application for "${application.title}".`,
    "/seeker/applications"
  );

  revalidatePath("/admin/applications");
}

export async function nudgeEmployerAction(formData: FormData) {
  await requireRole("admin");
  const applicationId = Number(formData.get("application_id"));

  const application = db
    .prepare(
      `SELECT j.employer_id, j.title, j.id as job_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`
    )
    .get(applicationId) as { employer_id: number; title: string; job_id: number } | undefined;
  if (!application) return;

  createNotification(
    application.employer_id,
    "Applicant awaiting a response",
    `A candidate for "${application.title}" hasn't heard back in a while — please review and follow up.`,
    `/employer/jobs/${application.job_id}/applicants`
  );

  revalidatePath("/admin/applications");
}
