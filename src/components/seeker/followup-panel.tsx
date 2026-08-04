import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { STALE_DAYS_THRESHOLD, type ApplicationFollowUp } from "@/lib/data/applications";
import { sendFollowUpMessageAction } from "@/lib/actions/seeker";
import { MessageThread, type ThreadMessage } from "@/components/message-thread";

export type FollowUpMessage = ThreadMessage;

export function FollowUpSummaryCard({
  stale,
  rejected,
}: {
  stale: number;
  rejected: number;
}) {
  const needsFollowUp = stale + rejected;

  return (
    <Link href="/seeker/applications">
      <Card
        className={`p-5 ${needsFollowUp > 0 ? "bg-amber-50 border-amber-200" : ""}`}
      >
        <p className="text-2xl font-bold text-slate-900">{needsFollowUp}</p>
        <p className="text-sm text-muted mt-1">
          {needsFollowUp === 0
            ? "No applications need follow-up"
            : `${stale} stale · ${rejected} rejected`}
        </p>
      </Card>
    </Link>
  );
}

export function FollowUpList({
  applications,
  messagesByApplication,
}: {
  applications: ApplicationFollowUp[];
  messagesByApplication: Map<number, FollowUpMessage[]>;
}) {
  if (applications.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-slate-700 font-medium">Nothing needs follow-up right now.</p>
        <p className="text-sm text-muted mt-1">
          We&apos;ll flag applications here if an employer goes quiet for {STALE_DAYS_THRESHOLD}+ days, or marks one as rejected.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const messages = messagesByApplication.get(app.id) ?? [];
        return (
          <Card key={app.id} className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Link href={`/jobs/${app.job_id}`} className="font-medium text-slate-900 hover:text-brand-dark">
                  {app.title}
                </Link>
                <p className="text-sm text-muted">
                  {app.company_name} · {app.location}
                </p>
              </div>
              <Badge tone={app.isRejected ? "danger" : "warning"}>
                {app.isRejected ? "Rejected" : `No response in ${app.daysSinceUpdate} days`}
              </Badge>
            </div>

            <p className="text-sm text-slate-600 mt-3 border-t border-border pt-3">
              {app.isRejected
                ? "This employer passed on your application this time. A quick review of your profile could improve your odds on the next one."
                : "This employer hasn't responded yet. A short, polite follow-up can help nudge things along."}
            </p>

            {messages.length > 0 && (
              <div className="my-3">
                <MessageThread messages={messages} alignRight="seeker" />
              </div>
            )}

            {!app.isRejected && (
              <form action={sendFollowUpMessageAction} className="flex gap-2 mt-3">
                <input type="hidden" name="application_id" value={app.id} />
                <input
                  name="body"
                  placeholder="Send a quick follow-up message..."
                  className="flex-1 rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <button className="text-sm px-4 py-2 rounded-2xl bg-brand text-white transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95">
                  Send
                </button>
              </form>
            )}
          </Card>
        );
      })}
    </div>
  );
}
