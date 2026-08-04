"use client";

import { useActionState } from "react";
import { updateSeekerProfileAction } from "@/lib/actions/seeker";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input, Textarea } from "@/components/ui";

type Profile = {
  full_name: string;
  phone: string;
  location: string;
  headline: string;
  skills: string;
  experience: string;
  education: string;
  portfolio_url: string;
  linkedin_url: string;
  resume_filename: string;
};

export function SeekerProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateSeekerProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <Input name="full_name" defaultValue={profile.full_name} required />
        </Field>
        <Field label="Phone number">
          <Input name="phone" defaultValue={profile.phone} placeholder="+234 800 000 0000" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <Input name="location" defaultValue={profile.location} placeholder="City, Country" />
        </Field>
        <Field label="Professional headline">
          <Input name="headline" defaultValue={profile.headline} placeholder="e.g. Frontend Engineer" />
        </Field>
      </div>

      <Field label="Skills" hint="Comma-separated, e.g. React, SEO, Excel">
        <Input name="skills" defaultValue={profile.skills} />
      </Field>

      <Field label="Employment history">
        <Textarea name="experience" defaultValue={profile.experience} rows={4} />
      </Field>

      <Field label="Education history">
        <Textarea name="education" defaultValue={profile.education} rows={3} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Portfolio URL">
          <Input name="portfolio_url" defaultValue={profile.portfolio_url} placeholder="https://..." />
        </Field>
        <Field label="LinkedIn URL">
          <Input name="linkedin_url" defaultValue={profile.linkedin_url} placeholder="https://linkedin.com/in/..." />
        </Field>
      </div>

      <Field
        label="Resume / CV"
        hint={profile.resume_filename ? `Current file: ${profile.resume_filename}` : "PDF, DOC, or DOCX, up to 5MB."}
      >
        <input
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm"
        />
      </Field>

      <ErrorText>{state?.error}</ErrorText>
      {state && !state.error && <p className="text-sm text-emerald-700">Profile saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
