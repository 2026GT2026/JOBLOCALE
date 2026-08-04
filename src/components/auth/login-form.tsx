"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email address">
        <Input type="email" name="email" required placeholder="you@example.com" />
      </Field>

      <Field label="Password">
        <Input type="password" name="password" required placeholder="••••••••" />
      </Field>

      <ErrorText>{state?.error}</ErrorText>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-sm text-center text-muted">
        New to JobLocale?{" "}
        <Link href="/register" className="text-brand-dark font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
