import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { BackLink } from "@/components/back-link";

type Notification = {
  id: number;
  title: string;
  body: string;
  link: string;
  read: number;
  created_at: string;
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = db
    .prepare("SELECT id, title, body, link, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as Notification[];

  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0").run(user.id);

  const dashboardHref =
    user.role === "admin" ? "/admin/dashboard" : user.role === "employer" ? "/employer/dashboard" : "/seeker/dashboard";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <BackLink fallbackHref={dashboardHref} />
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Notifications</h1>
      <p className="text-sm text-muted mb-6">Updates about your applications, jobs, and messages.</p>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState title="No notifications yet" description="You'll see updates here as things happen." />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {notifications.map((n) => {
            const content = (
              <div className={`p-4 flex items-start gap-3 ${n.read ? "" : "bg-plum-50/60"}`}>
                {!n.read && <span className="h-2 w-2 rounded-full bg-brand shrink-0 mt-1.5" aria-hidden />}
                <div className={n.read ? "pl-4" : ""}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-sm text-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted mt-1">{formatDate(n.created_at)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:bg-slate-50 transition-colors duration-200">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
