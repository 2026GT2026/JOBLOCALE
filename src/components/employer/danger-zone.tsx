"use client";

import { useActionState } from "react";
import { deactivateAccountAction } from "@/lib/actions/employer";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function DangerZone() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(deactivateAccountAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Deactivate your account? You'll be logged out and won't be able to sign back in until an admin reactivates it.")) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <p className="text-sm text-slate-600">
        Deactivating your account signs you out immediately and blocks further logins. Your jobs and
        data are kept, but the account will need to be reactivated by an admin.
      </p>
      <Field label="Current password" hint="Required to confirm this action.">
        <Input type="password" name="current_password" required placeholder="••••••••" />
      </Field>
      <ErrorText>{state?.error}</ErrorText>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Deactivating..." : "Deactivate account"}
      </Button>
    </form>
  );
}
