import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, type NavGroup } from "@/components/dashboard-shell";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/seeker/dashboard", label: "Overview", icon: "overview" }],
  },
  {
    label: "Profile",
    items: [{ href: "/seeker/profile", label: "My Profile", icon: "user" }],
  },
  {
    label: "Job search",
    items: [
      { href: "/seeker/applications", label: "My Applications", icon: "document" },
      { href: "/seeker/saved", label: "Saved Jobs", icon: "bookmark" },
      { href: "/seeker/alerts", label: "Job Alerts", icon: "bell" },
    ],
  },
];

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "seeker") redirect("/");

  return (
    <DashboardShell title="Job Seeker" navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}
