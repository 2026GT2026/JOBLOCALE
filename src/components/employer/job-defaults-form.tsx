"use client";

import { useActionState } from "react";
import { updateJobDefaultsAction } from "@/lib/actions/employer";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import { EMPLOYMENT_TYPES, REMOTE_TYPES } from "@/lib/constants";

type Defaults = {
  default_location: string;
  default_employment_type: string;
  default_remote_type: string;
};

export function JobDefaultsForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateJobDefaultsAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm text-muted -mt-1">Pre-fill these fields whenever you post a new job.</p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Default location">
          <Input name="default_location" defaultValue={defaults.default_location} placeholder="City, Country" />
        </Field>
        <Field label="Default employment type">
          <Select name="default_employment_type" defaultValue={defaults.default_employment_type}>
            <option value="">No default</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default workplace type">
          <Select name="default_remote_type" defaultValue={defaults.default_remote_type}>
            <option value="">No default</option>
            {REMOTE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <ErrorText>{state?.error}</ErrorText>
      {state && !state.error && <p className="text-sm text-emerald-700">Defaults saved.</p>}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving..." : "Save defaults"}
      </Button>
    </form>
  );
}
