"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationPreferenceAction } from "@/lib/actions/employer";

export function NotificationToggle({
  field,
  label,
  description,
  initialValue,
}: {
  field: "notify_new_applicant" | "notify_job_status";
  label: string;
  description: string;
  initialValue: boolean;
}) {
  // Controlled + explicit router.refresh(), same pattern as StatusSelect: relying on the
  // form's automatic revalidation left this reading a stale value after toggling.
  const [checked, setChecked] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          const formData = new FormData();
          formData.set("field", field);
          formData.set("value", String(next));
          startTransition(async () => {
            await updateNotificationPreferenceAction(formData);
            router.refresh();
          });
        }}
        className="h-5 w-9 shrink-0 appearance-none rounded-full bg-slate-200 checked:bg-brand relative transition-colors duration-200 cursor-pointer disabled:opacity-60 before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:translate-x-4"
      />
    </label>
  );
}
