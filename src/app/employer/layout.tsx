import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, type NavGroup } from "@/components/dashboard-shell";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/employer/dashboard", label: "Overview", icon: "overview" }],
  },
  {
    label: "Company",
    items: [
      { href: "/employer/profile", label: "Company Profile", icon: "user" },
      { href: "/employer/jobs", label: "Job Postings", icon: "briefcase" },
      { href: "/employer/applicants", label: "All Applicants", icon: "users" },
      { href: "/employer/views", label: "Job Views", icon: "document" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/employer/settings", label: "Settings", icon: "settings" }],
  },
];

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/");

  return (
    <DashboardShell title="Employer" navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}
