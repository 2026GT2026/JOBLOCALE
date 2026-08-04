"use client";

import { useActionState } from "react";
import { applyToJobAction } from "@/lib/actions/seeker";
import type { FormState } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Textarea } from "@/components/ui";

export function ApplyForm({ jobId, hasResumeOnFile }: { jobId: number; hasResumeOnFile: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(applyToJobAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="job_id" value={jobId} />

      <Field label="Cover letter" hint="Briefly explain why you're a great fit (optional).">
        <Textarea name="cover_letter" rows={5} placeholder="Dear hiring manager..." />
      </Field>

      <Field
        label={hasResumeOnFile ? "Resume" : "Attach resume"}
        hint={
          hasResumeOnFile
            ? "We'll use the resume from your profile unless you attach a new one below."
            : "PDF, DOC, or DOCX, up to 5MB."
        }
      >
        <input
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm"
        />
      </Field>

      <ErrorText>{state?.error}</ErrorText>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
