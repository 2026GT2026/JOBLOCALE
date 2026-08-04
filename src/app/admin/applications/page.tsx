import { db } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  getAllApplicationsForAdmin,
  STALE_DAYS_THRESHOLD,
  type AdminApplication,
} from "@/lib/data/applications";
import { sendAdminMessageAction, nudgeEmployerAction } from "@/lib/actions/admin";
import { MessageThread, type ThreadMessage } from "@/components/message-thread";

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  submitted: "default",
  reviewed: "brand",
  shortlisted: "warning",
  interview: "warning",
  rejected: "danger",
  hired: "success",
};

export default async function AdminApplicationsPage() {
  const applications = getAllApplicationsForAdmin();
  const needsFollowUp = applications.filter((a) => a.needsFollowUp);
  const onTrack = applications.filter((a) => !a.needsFollowUp);

  const messagesByApplication = new Map<number, ThreadMessage[]>();
  for (const app of needsFollowUp) {
    const msgs = db
      .prepare("SELECT id, sender_role, body, created_at FROM messages WHERE application_id = ? ORDER BY created_at ASC")
      .all(app.id) as ThreadMessage[];
    messagesByApplication.set(app.id, msgs);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Tracking</h1>
        <p className="text-sm text-muted mt-1">
          Real-time status of every application on the platform, so no applicant is left hanging. Applications
          flagged below have gone {STALE_DAYS_THRESHOLD}+ days without an update, or were rejected — message the
          applicant directly, or nudge the employer to respond.
        </p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xl font-bold text-slate-900">{applications.length}</p>
          <p className="text-xs text-muted mt-1">Total applications</p>
        </Card>
        <Card className={`p-4 ${needsFollowUp.length > 0 ? "bg-amber-50 border-amber-200" : ""}`}>
          <p className="text-xl font-bold text-slate-900">{needsFollowUp.length}</p>
          <p className="text-xs text-muted mt-1">Needs follow-up</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-bold text-slate-900">{applications.filter((a) => a.isStale).length}</p>
          <p className="text-xs text-muted mt-1">Awaiting employer response</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-bold text-slate-900">{applications.filter((a) => a.isRejected).length}</p>
          <p className="text-xs text-muted mt-1">Rejected</p>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Needs follow-up</h2>
        {needsFollowUp.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing needs follow-up right now"
              description="Stale or rejected applications will appear here so you can step in."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {needsFollowUp.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                messages={messagesByApplication.get(app.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">All other applications</h2>
        {onTrack.length === 0 ? (
          <Card>
            <EmptyState title="No other applications" />
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {onTrack.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-slate-900">
                    {app.seeker_name || app.seeker_email} &rarr; {app.job_title}
                  </p>
                  <p className="text-sm text-muted">
                    {app.company_name} · Applied {formatDate(app.created_at)} · Updated {formatDate(app.updated_at)}
                  </p>
                </div>
                <Badge tone={statusTone[app.status] ?? "default"}>{app.status}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, messages }: { app: AdminApplication; messages: ThreadMessage[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium text-slate-900">
            {app.seeker_name || app.seeker_email} &rarr; {app.job_title}
          </p>
          <p className="text-sm text-muted">
            {app.company_name} · {app.seeker_email} · Applied {formatDate(app.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone[app.status] ?? "default"}>{app.status}</Badge>
          <Badge tone={app.isRejected ? "danger" : "warning"}>
            {app.isRejected ? "Rejected" : `No update in ${app.daysSinceUpdate}d`}
          </Badge>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <MessageThread messages={messages} alignRight="admin" />
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row gap-2">
        <form action={sendAdminMessageAction} className="flex flex-1 gap-2">
          <input type="hidden" name="application_id" value={app.id} />
          <input
            name="body"
            placeholder="Send an update to the applicant..."
            className="flex-1 rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button className="text-sm px-4 py-2 rounded-2xl bg-brand text-white transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95 shrink-0">
            Send
          </button>
        </form>
        {!app.isRejected && (
          <form action={nudgeEmployerAction}>
            <input type="hidden" name="application_id" value={app.id} />
            <button className="text-sm px-4 py-2 rounded-2xl border border-border text-slate-700 transition-all duration-200 ease-out hover:bg-slate-50 hover:scale-105 active:scale-95 whitespace-nowrap">
              Nudge employer
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}
