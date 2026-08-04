"use client";

import { useRouter } from "next/navigation";

// Uses real browser history instead of a fixed destination, since these pages
// are reached from multiple places (dashboard, jobs list, applicants list) and
// a hardcoded href would send the user somewhere other than where they came from.
export function BackLink({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-plum-200 bg-plum-50 text-brand-dark hover:bg-plum-100 hover:border-plum-300 transition-all duration-200 cursor-pointer mb-4"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
