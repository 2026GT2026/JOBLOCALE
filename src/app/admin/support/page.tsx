import { Badge, Card, EmptyState } from "@/components/ui";
import { getAtRiskSeekers, STALE_DAYS_THRESHOLD } from "@/lib/data/applications";

export default async function AdminSupportPage() {
  const atRisk = getAtRiskSeekers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applicant Support</h1>
        <p className="text-sm text-muted mt-1">
          Job seekers with {STALE_DAYS_THRESHOLD}+ days of silence on an application, or two or more rejections —
          the platform&apos;s early-warning list for candidates who may need help.
        </p>
      </div>

      {atRisk.length === 0 ? (
        <Card>
          <EmptyState
            title="No one is at risk right now"
            description="Seekers with repeated rejections or stale applications will appear here."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {atRisk.map((s) => (
            <div key={s.user_id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{s.full_name || s.email}</p>
                  <Badge tone={s.atRiskCount >= 3 ? "danger" : "warning"}>
                    {s.atRiskCount} at-risk application{s.atRiskCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  {s.email} {s.headline && `· ${s.headline}`}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {s.totalApplications} total application{s.totalApplications === 1 ? "" : "s"} · {s.staleCount} no
                  response · {s.rejectedCount} rejected
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
