"use client";

import { useActionState } from "react";
import { createAlertAction } from "@/lib/actions/seeker";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Input, Select } from "@/components/ui";
import { EMPLOYMENT_TYPES } from "@/lib/constants";

export function AlertForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createAlertAction, undefined);

  return (
    <form action={formAction} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start">
      <Input name="keyword" placeholder="Keyword (e.g. Marketing)" />
      <Input name="location" placeholder="Location" />
      <Select name="employment_type" defaultValue="">
        <option value="">Any type</option>
        {EMPLOYMENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create alert"}
      </Button>
      <div className="sm:col-span-4">
        <ErrorText>{state?.error}</ErrorText>
      </div>
    </form>
  );
}
