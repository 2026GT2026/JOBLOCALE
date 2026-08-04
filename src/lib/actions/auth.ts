"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["seeker", "employer"]),
  name: z.string().trim().min(1, "This field is required."),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password, role, name } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)")
    .run(email, passwordHash, role);
  const userId = Number(info.lastInsertRowid);

  if (role === "seeker") {
    db.prepare("INSERT INTO seeker_profiles (user_id, full_name) VALUES (?, ?)").run(userId, name);
  } else {
    db.prepare("INSERT INTO employer_profiles (user_id, company_name) VALUES (?, ?)").run(
      userId,
      name
    );
  }

  await createSession(userId);
  redirect(role === "seeker" ? "/seeker/dashboard" : "/employer/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;

  const user = db
    .prepare("SELECT id, password_hash, role, status FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string; role: string; status: string } | undefined;

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Incorrect email or password." };
  }

  if (user.status === "suspended") {
    return { error: "This account has been suspended. Contact support for assistance." };
  }

  await createSession(user.id);

  if (user.role === "admin") redirect("/admin/dashboard");
  if (user.role === "employer") redirect("/employer/dashboard");
  redirect("/seeker/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
