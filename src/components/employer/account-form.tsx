"use client";

import { useActionState } from "react";
import { updateAccountAction } from "@/lib/actions/employer";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function AccountForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateAccountAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email address">
        <Input type="email" name="email" defaultValue={email} required />
      </Field>

      <Field label="New password" hint="Leave blank to keep your current password.">
        <Input type="password" name="new_password" placeholder="••••••••" />
      </Field>

      <Field label="Confirm new password">
        <Input type="password" name="confirm_password" placeholder="••••••••" />
      </Field>

      <Field label="Current password" hint="Required to save any change on this page.">
        <Input type="password" name="current_password" required placeholder="••••••••" />
      </Field>

      <ErrorText>{state?.error}</ErrorText>
      {state && !state.error && <p className="text-sm text-emerald-700">Account settings saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save account settings"}
      </Button>
    </form>
  );
}
