import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSeekerApplicationsWithFollowUp } from "@/lib/data/applications";
import { FollowUpList, type FollowUpMessage } from "@/components/seeker/followup-panel";

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  submitted: "default",
  reviewed: "brand",
  shortlisted: "warning",
  interview: "warning",
  rejected: "danger",
  hired: "success",
};

export default async function SeekerApplicationsPage() {
  const user = await getCurrentUser();
  const applications = getSeekerApplicationsWithFollowUp(user!.id);
  const needsFollowUp = applications.filter((a) => a.needsFollowUp);

  const messagesByApplication = new Map<number, FollowUpMessage[]>();
  for (const app of needsFollowUp) {
    const msgs = db
      .prepare("SELECT id, sender_role, body, created_at FROM messages WHERE application_id = ? ORDER BY created_at ASC")
      .all(app.id) as FollowUpMessage[];
    messagesByApplication.set(app.id, msgs);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Applications</h1>

        {applications.length === 0 ? (
          <Card>
            <EmptyState
              title="No applications yet"
              description="Apply to jobs and track their status here."
              action={<LinkButton href="/jobs">Browse jobs</LinkButton>}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((row) => (
              <Link key={row.id} href={`/seeker/applications/${row.id}`} className="block group">
                <Card className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-brand/40">
                  <div>
                    <p className="font-medium text-slate-900 group-hover:text-brand-dark">{row.title}</p>
                    <p className="text-sm text-muted">
                      {row.company_name} · {row.location} · Applied {formatDate(row.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone[row.status] ?? "default"}>{row.status}</Badge>
                    <span className="text-muted group-hover:text-brand-dark transition-colors duration-200">&rarr;</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {applications.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Needs follow-up</h2>
          <p className="text-sm text-muted mb-4">
            Applications that have gone quiet or didn&apos;t lead to a callback — with suggested next steps.
          </p>
          <FollowUpList applications={needsFollowUp} messagesByApplication={messagesByApplication} />
        </div>
      )}
    </div>
  );
}
