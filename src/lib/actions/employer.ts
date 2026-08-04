"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, hashPassword, verifyPassword, destroySession } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import { createNotification } from "@/lib/notifications";
import type { FormState } from "@/lib/actions/auth";
import type { Job } from "@/lib/data/jobs";

const profileSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required."),
  industry: z.string().trim().optional().default(""),
  company_size: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
});

export async function updateEmployerProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");

  const parsed = profileSchema.safeParse({
    company_name: formData.get("company_name"),
    industry: formData.get("industry"),
    company_size: formData.get("company_size"),
    location: formData.get("location"),
    website: formData.get("website"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const logoFile = formData.get("logo");
  let logoPath: string | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      const saved = await saveUpload(logoFile);
      logoPath = saved.storedPath;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to upload logo." };
    }
  }

  const p = parsed.data;
  if (logoPath) {
    db.prepare(
      `UPDATE employer_profiles SET company_name=?, industry=?, company_size=?, location=?, website=?, description=?, logo_path=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(p.company_name, p.industry, p.company_size, p.location, p.website, p.description, logoPath, user.id);
  } else {
    db.prepare(
      `UPDATE employer_profiles SET company_name=?, industry=?, company_size=?, location=?, website=?, description=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(p.company_name, p.industry, p.company_size, p.location, p.website, p.description, user.id);
  }

  revalidatePath("/employer/profile");
  return { error: undefined };
}

const jobSchema = z.object({
  title: z.string().trim().min(1, "Job title is required."),
  location: z.string().trim().min(1, "Location is required."),
  employment_type: z.string().trim().min(1),
  remote_type: z.string().trim().min(1),
  industry: z.string().trim().min(1, "Industry is required."),
  experience_level: z.string().trim().min(1),
  salary_min: z.string().optional().default(""),
  salary_max: z.string().optional().default(""),
  description: z.string().trim().min(1, "Job description is required."),
  qualifications: z.string().trim().optional().default(""),
  skills: z.string().trim().optional().default(""),
  deadline: z.string().optional().default(""),
});

function parseJobForm(formData: FormData) {
  return jobSchema.safeParse({
    title: formData.get("title"),
    location: formData.get("location"),
    employment_type: formData.get("employment_type"),
    remote_type: formData.get("remote_type"),
    industry: formData.get("industry"),
    experience_level: formData.get("experience_level"),
    salary_min: formData.get("salary_min"),
    salary_max: formData.get("salary_max"),
    description: formData.get("description"),
    qualifications: formData.get("qualifications"),
    skills: formData.get("skills"),
    deadline: formData.get("deadline"),
  });
}

export async function createJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");
  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const intent = String(formData.get("intent") ?? "draft");
  const p = parsed.data;

  const status = intent === "submit" ? "pending" : "draft";

  const info = db
    .prepare(
      `INSERT INTO jobs (employer_id, title, location, employment_type, remote_type, salary_min, salary_max, industry, experience_level, description, qualifications, skills, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      user.id,
      p.title,
      p.location,
      p.employment_type,
      p.remote_type,
      p.salary_min ? Number(p.salary_min) : null,
      p.salary_max ? Number(p.salary_max) : null,
      p.industry,
      p.experience_level,
      p.description,
      p.qualifications,
      p.skills,
      p.deadline || null,
      status
    );

  redirect("/employer/jobs");
}

export async function updateJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");
  const jobId = Number(formData.get("job_id"));

  const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND employer_id = ?").get(jobId, user.id) as
    | { id: number; status: string }
    | undefined;
  if (!job) return { error: "Job not found." };

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const intent = String(formData.get("intent") ?? "draft");
  const p = parsed.data;

  let nextStatus = job.status;
  if (intent === "submit" && (job.status === "draft" || job.status === "rejected")) {
    nextStatus = "pending";
  } else if (intent === "draft" && job.status === "rejected") {
    nextStatus = "draft";
  }

  db.prepare(
    `UPDATE jobs SET title=?, location=?, employment_type=?, remote_type=?, salary_min=?, salary_max=?, industry=?, experience_level=?, description=?, qualifications=?, skills=?, deadline=?, status=?, rejection_reason='', updated_at=datetime('now')
     WHERE id=?`
  ).run(
    p.title,
    p.location,
    p.employment_type,
    p.remote_type,
    p.salary_min ? Number(p.salary_min) : null,
    p.salary_max ? Number(p.salary_max) : null,
    p.industry,
    p.experience_level,
    p.description,
    p.qualifications,
    p.skills,
    p.deadline || null,
    nextStatus,
    jobId
  );

  redirect("/employer/jobs");
}

export async function duplicateJobAction(formData: FormData) {
  const user = await requireRole("employer");
  const jobId = Number(formData.get("job_id"));

  const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND employer_id = ?").get(jobId, user.id) as
    | Job
    | undefined;
  if (!job) return;

  db.prepare(
    `INSERT INTO jobs (employer_id, title, location, employment_type, remote_type, salary_min, salary_max, industry, experience_level, description, qualifications, skills, deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(
    user.id,
    `${job.title} (Copy)`,
    job.location,
    job.employment_type,
    job.remote_type,
    job.salary_min,
    job.salary_max,
    job.industry,
    job.experience_level,
    job.description,
    job.qualifications,
    job.skills,
    job.deadline
  );

  revalidatePath("/employer/jobs");
}

export async function closeJobAction(formData: FormData) {
  const user = await requireRole("employer");
  const jobId = Number(formData.get("job_id"));
  db.prepare("UPDATE jobs SET status='closed', updated_at=datetime('now') WHERE id=? AND employer_id=?").run(
    jobId,
    user.id
  );
  revalidatePath("/employer/jobs");
}

export async function deleteJobAction(formData: FormData) {
  const user = await requireRole("employer");
  const jobId = Number(formData.get("job_id"));
  const appCount = db.prepare("SELECT COUNT(*) as c FROM applications WHERE job_id = ?").get(jobId) as {
    c: number;
  };
  if (appCount.c > 0) return;
  db.prepare("DELETE FROM jobs WHERE id = ? AND employer_id = ?").run(jobId, user.id);
  revalidatePath("/employer/jobs");
}

export async function promoteJobAction(formData: FormData) {
  const user = await requireRole("employer");
  const jobId = Number(formData.get("job_id"));

  const job = db.prepare("SELECT id FROM jobs WHERE id = ? AND employer_id = ?").get(jobId, user.id) as
    | { id: number }
    | undefined;
  if (!job) return;

  db.prepare("UPDATE jobs SET featured = 1, updated_at = datetime('now') WHERE id = ?").run(jobId);

  revalidatePath("/employer/jobs");
}

export async function updateApplicationStatusAction(formData: FormData) {
  const user = await requireRole("employer");
  const applicationId = Number(formData.get("application_id"));
  const status = String(formData.get("status"));
  const jobId = Number(formData.get("job_id"));

  const owns = db
    .prepare(
      `SELECT a.seeker_id, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? AND j.employer_id = ?`
    )
    .get(applicationId, user.id) as { seeker_id: number; title: string } | undefined;
  if (!owns) return;

  db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    applicationId
  );

  createNotification(
    owns.seeker_id,
    `Application ${status}`,
    `Your application for "${owns.title}" is now ${status}.`,
    "/seeker/applications"
  );

  revalidatePath(`/employer/jobs/${jobId}/applicants`);
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireRole("employer");
  const applicationId = Number(formData.get("application_id"));
  const jobId = Number(formData.get("job_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const owns = db
    .prepare(
      `SELECT a.seeker_id, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? AND j.employer_id = ?`
    )
    .get(applicationId, user.id) as { seeker_id: number; title: string } | undefined;
  if (!owns) return;

  db.prepare("INSERT INTO messages (application_id, sender_role, body) VALUES (?, 'employer', ?)").run(
    applicationId,
    body
  );

  createNotification(
    owns.seeker_id,
    "New message from employer",
    `You have a new message about "${owns.title}".`,
    "/seeker/applications"
  );

  revalidatePath(`/employer/jobs/${jobId}/applicants`);
}

const accountSchema = z.object({
  current_password: z.string().min(1, "Enter your current password."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  new_password: z.string().min(0).optional().default(""),
  confirm_password: z.string().min(0).optional().default(""),
});

export async function updateAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");

  const parsed = accountSchema.safeParse({
    current_password: formData.get("current_password"),
    email: formData.get("email"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { current_password, email, new_password, confirm_password } = parsed.data;

  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as {
    password_hash: string;
  };
  if (!(await verifyPassword(current_password, row.password_hash))) {
    return { error: "Current password is incorrect." };
  }

  if (new_password || confirm_password) {
    if (new_password.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }
    if (new_password !== confirm_password) {
      return { error: "New password and confirmation do not match." };
    }
  }

  if (email !== user.email) {
    const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
    if (existing) {
      return { error: "An account with this email already exists." };
    }
  }

  if (new_password) {
    const passwordHash = await hashPassword(new_password);
    db.prepare("UPDATE users SET email = ?, password_hash = ? WHERE id = ?").run(email, passwordHash, user.id);
  } else {
    db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, user.id);
  }

  revalidatePath("/employer/settings");
  return { error: undefined };
}

const NOTIFICATION_FIELDS = ["notify_new_applicant", "notify_job_status"] as const;

export async function updateNotificationPreferenceAction(formData: FormData) {
  const user = await requireRole("employer");
  const field = String(formData.get("field"));
  if (!NOTIFICATION_FIELDS.includes(field as (typeof NOTIFICATION_FIELDS)[number])) return;
  const value = formData.get("value") === "true" ? 1 : 0;
  db.prepare(`UPDATE employer_profiles SET ${field} = ? WHERE user_id = ?`).run(value, user.id);
  revalidatePath("/employer/settings");
}

const jobDefaultsSchema = z.object({
  default_location: z.string().trim().optional().default(""),
  default_employment_type: z.string().trim().optional().default(""),
  default_remote_type: z.string().trim().optional().default(""),
});

export async function updateJobDefaultsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");
  const parsed = jobDefaultsSchema.safeParse({
    default_location: formData.get("default_location"),
    default_employment_type: formData.get("default_employment_type"),
    default_remote_type: formData.get("default_remote_type"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const p = parsed.data;
  db.prepare(
    "UPDATE employer_profiles SET default_location = ?, default_employment_type = ?, default_remote_type = ? WHERE user_id = ?"
  ).run(p.default_location, p.default_employment_type, p.default_remote_type, user.id);

  revalidatePath("/employer/settings");
  revalidatePath("/employer/jobs/new");
  return { error: undefined };
}

const deactivateSchema = z.object({
  current_password: z.string().min(1, "Enter your current password to confirm."),
});

export async function deactivateAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("employer");
  const parsed = deactivateSchema.safeParse({ current_password: formData.get("current_password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as {
    password_hash: string;
  };
  if (!(await verifyPassword(parsed.data.current_password, row.password_hash))) {
    return { error: "Current password is incorrect." };
  }

  db.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").run(user.id);
  await destroySession();
  redirect("/login");
}
