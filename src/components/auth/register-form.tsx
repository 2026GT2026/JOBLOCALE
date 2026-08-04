"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function RegisterForm({ defaultRole }: { defaultRole: "seeker" | "employer" }) {
  const [role, setRole] = useState<"seeker" | "employer">(defaultRole);
  const [state, formAction, pending] = useActionState<FormState, FormData>(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setRole("seeker")}
          className={`rounded-xl py-2 text-sm font-medium transition-all duration-200 ${
            role === "seeker" ? "bg-white shadow text-brand-dark" : "text-slate-500"
          }`}
        >
          I&apos;m a Job Seeker
        </button>
        <button
          type="button"
          onClick={() => setRole("employer")}
          className={`rounded-xl py-2 text-sm font-medium transition-all duration-200 ${
            role === "employer" ? "bg-white shadow text-brand-dark" : "text-slate-500"
          }`}
        >
          I&apos;m an Employer
        </button>
      </div>
      <input type="hidden" name="role" value={role} />

      <Field label={role === "seeker" ? "Full name" : "Company name"}>
        <Input name="name" required placeholder={role === "seeker" ? "Jane Doe" : "Acme Retail Ltd"} />
      </Field>

      <Field label="Email address">
        <Input type="email" name="email" required placeholder="you@example.com" />
      </Field>

      <Field label="Password" hint="At least 8 characters.">
        <Input type="password" name="password" required minLength={8} placeholder="••••••••" />
      </Field>

      <ErrorText>{state?.error}</ErrorText>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : `Create ${role === "seeker" ? "job seeker" : "employer"} account`}
      </Button>

      <p className="text-sm text-center text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-dark font-medium hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
