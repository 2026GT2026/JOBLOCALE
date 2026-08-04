"use client";

import { useActionState } from "react";
import { updateEmployerProfileAction } from "@/lib/actions/employer";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { INDUSTRIES } from "@/lib/constants";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

type Profile = {
  company_name: string;
  industry: string;
  company_size: string;
  location: string;
  website: string;
  description: string;
  logo_path: string;
};

export function EmployerProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateEmployerProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Company name">
        <Input name="company_name" defaultValue={profile.company_name} required />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Industry">
          <Select name="industry" defaultValue={profile.industry}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Company size">
          <Select name="company_size" defaultValue={profile.company_size}>
            <option value="">Select size</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} employees
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <Input name="location" defaultValue={profile.location} placeholder="City, Country" />
        </Field>
        <Field label="Website">
          <Input name="website" defaultValue={profile.website} placeholder="https://..." />
        </Field>
      </div>

      <Field label="Company description">
        <Textarea name="description" defaultValue={profile.description} rows={5} />
      </Field>

      <Field
        label="Company logo"
        hint={profile.logo_path ? "A logo is already uploaded." : "PNG or JPG, up to 5MB."}
      >
        <input
          type="file"
          name="logo"
          accept=".png,.jpg,.jpeg"
          className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm"
        />
      </Field>

      <ErrorText>{state?.error}</ErrorText>
      {state && !state.error && <p className="text-sm text-emerald-700">Company profile saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save company profile"}
      </Button>
    </form>
  );
}
