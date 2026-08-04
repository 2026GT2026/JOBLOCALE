"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  INDUSTRIES,
  REMOTE_TYPES,
} from "@/lib/constants";

export type JobFormValues = {
  id?: number;
  title: string;
  location: string;
  employment_type: string;
  remote_type: string;
  industry: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  qualifications: string;
  skills: string;
  deadline: string | null;
  status?: string;
};

export function JobForm({
  action,
  defaultValues,
  submitLabel = "Post job",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaultValues: JobFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [intent, setIntent] = useState<"draft" | "submit">("draft");

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues.id && <input type="hidden" name="job_id" value={defaultValues.id} />}
      <input type="hidden" name="intent" value={intent} />

      <Field label="Job title">
        <Input name="title" defaultValue={defaultValues.title} required />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <Input name="location" defaultValue={defaultValues.location} placeholder="City, Country" required />
        </Field>
        <Field label="Workplace type">
          <Select name="remote_type" defaultValue={defaultValues.remote_type}>
            {REMOTE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Employment type">
          <Select name="employment_type" defaultValue={defaultValues.employment_type}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Industry">
          <Select name="industry" defaultValue={defaultValues.industry}>
            <option value="">Select</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Experience level">
          <Select name="experience_level" defaultValue={defaultValues.experience_level}>
            {EXPERIENCE_LEVELS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Salary min (optional)">
          <Input type="number" name="salary_min" defaultValue={defaultValues.salary_min ?? ""} />
        </Field>
        <Field label="Salary max (optional)">
          <Input type="number" name="salary_max" defaultValue={defaultValues.salary_max ?? ""} />
        </Field>
        <Field label="Application deadline (optional)">
          <Input type="date" name="deadline" defaultValue={defaultValues.deadline ?? ""} />
        </Field>
      </div>

      <Field label="Job description">
        <Textarea name="description" defaultValue={defaultValues.description} rows={6} required />
      </Field>

      <Field label="Required qualifications" hint="One per line.">
        <Textarea name="qualifications" defaultValue={defaultValues.qualifications} rows={3} />
      </Field>

      <Field label="Required skills" hint="Comma-separated.">
        <Input name="skills" defaultValue={defaultValues.skills} />
      </Field>

      <ErrorText>{state?.error}</ErrorText>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="secondary"
          disabled={pending}
          onClick={() => setIntent("draft")}
        >
          {pending && intent === "draft" ? "Saving..." : "Save as draft"}
        </Button>
        <Button type="submit" disabled={pending} onClick={() => setIntent("submit")}>
          {pending && intent === "submit" ? "Submitting..." : submitLabel}
        </Button>
      </div>
      <p className="text-xs text-muted">
        Submitting for review sends your listing to our admin team for approval before it goes live.
      </p>
    </form>
  );
}
