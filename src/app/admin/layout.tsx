import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, type NavGroup } from "@/components/dashboard-shell";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Reports & Analytics", icon: "overview" }],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/jobs", label: "Job Moderation", icon: "briefcase" },
      { href: "/admin/employers", label: "Employer Verification", icon: "shield" },
    ],
  },
  {
    label: "Accounts",
    items: [{ href: "/admin/users", label: "User Management", icon: "users" }],
  },
  {
    label: "Applications",
    items: [
      { href: "/admin/applications", label: "Application Tracking", icon: "document" },
      { href: "/admin/support", label: "Applicant Support", icon: "bell" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <DashboardShell title="Administration" navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}
