"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import type { FormState } from "@/lib/actions/auth";
import { createNotification } from "@/lib/notifications";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  headline: z.string().trim().optional().default(""),
  skills: z.string().trim().optional().default(""),
  experience: z.string().trim().optional().default(""),
  education: z.string().trim().optional().default(""),
  portfolio_url: z.string().trim().optional().default(""),
  linkedin_url: z.string().trim().optional().default(""),
});

export async function updateSeekerProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("seeker");

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    headline: formData.get("headline"),
    skills: formData.get("skills"),
    experience: formData.get("experience"),
    education: formData.get("education"),
    portfolio_url: formData.get("portfolio_url"),
    linkedin_url: formData.get("linkedin_url"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const resumeFile = formData.get("resume");
  let resumeUpdate: { resume_filename: string; resume_path: string } | null = null;
  if (resumeFile instanceof File && resumeFile.size > 0) {
    try {
      const saved = await saveUpload(resumeFile);
      resumeUpdate = { resume_filename: saved.filename, resume_path: saved.storedPath };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to upload resume." };
    }
  }

  const p = parsed.data;
  if (resumeUpdate) {
    db.prepare(
      `UPDATE seeker_profiles SET full_name=?, phone=?, location=?, headline=?, skills=?, experience=?, education=?, portfolio_url=?, linkedin_url=?, resume_filename=?, resume_path=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(
      p.full_name,
      p.phone,
      p.location,
      p.headline,
      p.skills,
      p.experience,
      p.education,
      p.portfolio_url,
      p.linkedin_url,
      resumeUpdate.resume_filename,
      resumeUpdate.resume_path,
      user.id
    );
  } else {
    db.prepare(
      `UPDATE seeker_profiles SET full_name=?, phone=?, location=?, headline=?, skills=?, experience=?, education=?, portfolio_url=?, linkedin_url=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(p.full_name, p.phone, p.location, p.headline, p.skills, p.experience, p.education, p.portfolio_url, p.linkedin_url, user.id);
  }

  revalidatePath("/seeker/profile");
  return { error: undefined };
}

export async function applyToJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("seeker");
  const jobId = Number(formData.get("job_id"));
  const coverLetter = String(formData.get("cover_letter") ?? "");

  const job = db.prepare("SELECT id, status, title, employer_id FROM jobs WHERE id = ?").get(jobId) as
    | { id: number; status: string; title: string; employer_id: number }
    | undefined;
  if (!job || job.status !== "published") {
    return { error: "This job is no longer accepting applications." };
  }

  const existing = db
    .prepare("SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?")
    .get(jobId, user.id);
  if (existing) {
    return { error: "You have already applied to this job." };
  }

  const profile = db
    .prepare("SELECT resume_filename, resume_path FROM seeker_profiles WHERE user_id = ?")
    .get(user.id) as { resume_filename: string; resume_path: string } | undefined;

  let resumeFilename = profile?.resume_filename ?? "";
  let resumePath = profile?.resume_path ?? "";

  const uploadedResume = formData.get("resume");
  if (uploadedResume instanceof File && uploadedResume.size > 0) {
    try {
      const saved = await saveUpload(uploadedResume);
      resumeFilename = saved.filename;
      resumePath = saved.storedPath;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to upload resume." };
    }
  }

  if (!resumePath) {
    return { error: "Please attach a resume, or upload one to your profile first." };
  }

  db.prepare(
    `INSERT INTO applications (job_id, seeker_id, cover_letter, resume_filename, resume_path) VALUES (?, ?, ?, ?, ?)`
  ).run(jobId, user.id, coverLetter, resumeFilename, resumePath);

  const employerPrefs = db
    .prepare("SELECT notify_new_applicant FROM employer_profiles WHERE user_id = ?")
    .get(job.employer_id) as { notify_new_applicant: number } | undefined;
  if (employerPrefs?.notify_new_applicant) {
    createNotification(
      job.employer_id,
      "New applicant",
      `Someone applied to "${job.title}".`,
      `/employer/jobs/${jobId}/applicants`
    );
  }

  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?applied=1`);
}

export async function toggleSaveJobAction(formData: FormData) {
  const user = await requireRole("seeker");
  const jobId = Number(formData.get("job_id"));

  const existing = db
    .prepare("SELECT id FROM saved_jobs WHERE seeker_id = ? AND job_id = ?")
    .get(user.id, jobId);

  if (existing) {
    db.prepare("DELETE FROM saved_jobs WHERE seeker_id = ? AND job_id = ?").run(user.id, jobId);
  } else {
    db.prepare("INSERT INTO saved_jobs (seeker_id, job_id) VALUES (?, ?)").run(user.id, jobId);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/seeker/saved");
}

export async function createAlertAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("seeker");
  const keyword = String(formData.get("keyword") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const employmentType = String(formData.get("employment_type") ?? "").trim();

  if (!keyword && !location) {
    return { error: "Enter a keyword or location for this alert." };
  }

  db.prepare(
    "INSERT INTO job_alerts (seeker_id, keyword, location, employment_type) VALUES (?, ?, ?, ?)"
  ).run(user.id, keyword, location, employmentType);

  revalidatePath("/seeker/alerts");
  return { error: undefined };
}

export async function deleteAlertAction(formData: FormData) {
  const user = await requireRole("seeker");
  const id = Number(formData.get("alert_id"));
  db.prepare("DELETE FROM job_alerts WHERE id = ? AND seeker_id = ?").run(id, user.id);
  revalidatePath("/seeker/alerts");
}

export async function sendFollowUpMessageAction(formData: FormData) {
  const user = await requireRole("seeker");
  const applicationId = Number(formData.get("application_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const owns = db
    .prepare(
      `SELECT a.id, j.employer_id, j.title, j.id as job_id
       FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? AND a.seeker_id = ?`
    )
    .get(applicationId, user.id) as { id: number; employer_id: number; title: string; job_id: number } | undefined;
  if (!owns) return;

  db.prepare("INSERT INTO messages (application_id, sender_role, body) VALUES (?, 'seeker', ?)").run(
    applicationId,
    body
  );

  createNotification(
    owns.employer_id,
    "New message from applicant",
    `You have a new message about "${owns.title}".`,
    `/employer/jobs/${owns.job_id}/applicants`
  );

  revalidatePath("/seeker/applications");
}
