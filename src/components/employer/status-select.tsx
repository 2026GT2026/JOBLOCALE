"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatusAction } from "@/lib/actions/employer";

const STATUSES = ["submitted", "reviewed", "shortlisted", "interview", "rejected", "hired"];

export function StatusSelect({
  applicationId,
  jobId,
  status,
}: {
  applicationId: number;
  jobId: number;
  status: string;
}) {
  // Controlled locally so the select reflects the user's choice immediately.
  // Submitting via the form's automatic revalidation left this reading a stale
  // value from the client router cache; router.refresh() bypasses that cache.
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      name="status"
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const newValue = e.target.value;
        setValue(newValue);
        const formData = new FormData();
        formData.set("application_id", String(applicationId));
        formData.set("job_id", String(jobId));
        formData.set("status", newValue);
        startTransition(async () => {
          await updateApplicationStatusAction(formData);
          router.refresh();
        });
      }}
      className="text-sm rounded-xl border border-border px-2 py-1.5 capitalize transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
