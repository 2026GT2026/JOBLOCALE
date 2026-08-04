"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export type IconName =
  | "overview"
  | "briefcase"
  | "shield"
  | "users"
  | "user"
  | "billing"
  | "document"
  | "bookmark"
  | "bell"
  | "settings";

export type NavItem = { href: string; label: string; icon?: IconName };
export type NavGroup = { label: string; items: NavItem[] };

function Icon({ name, className = "h-[18px] w-[18px]" }: { name?: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <path d="M4 19V10M10 19V5M16 19V13M22 19H2" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
          <path d="M9.5 12l1.8 1.8L14.5 10" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 8a3 3 0 1 1 0 6M21 20c0-2.7-1.8-5-4-5.7" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        </svg>
      );
    case "billing":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
          <path d="M2.5 10h19M6 15h4" />
        </svg>
      );
    case "document":
      return (
        <svg {...common}>
          <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
          <path d="M14 2.5V7h4M8 12h8M8 16h8" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-6-4-6 4V3z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export function DashboardShell({
  title,
  navGroups,
  children,
}: {
  title: string;
  navGroups: NavGroup[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[250px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="bg-white border border-border rounded-3xl shadow-sm p-4">
          <div className="flex items-center gap-2 px-1 mb-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white font-bold text-sm shrink-0">
              {title.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>
              <p className="text-xs text-muted leading-tight">Control panel</p>
            </div>
          </div>

          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          active
                            ? "bg-brand text-white border-brand shadow-sm"
                            : "text-slate-600 border-transparent hover:bg-plum-50 hover:text-brand-dark hover:translate-x-1 hover:border-border"
                        }`}
                      >
                        <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "opacity-100" : "opacity-60"}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
