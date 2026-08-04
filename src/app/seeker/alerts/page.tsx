import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui";
import { AlertForm } from "@/components/seeker/alert-form";
import { deleteAlertAction } from "@/lib/actions/seeker";

type Alert = {
  id: number;
  keyword: string;
  location: string;
  employment_type: string;
  created_at: string;
};

export default async function AlertsPage() {
  const user = await getCurrentUser();
  const alerts = db
    .prepare("SELECT id, keyword, location, employment_type, created_at FROM job_alerts WHERE seeker_id = ? ORDER BY created_at DESC")
    .all(user!.id) as Alert[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Job Alerts</h1>

      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Create a new alert</h2>
        <AlertForm />
      </Card>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Your alerts</h2>
        {alerts.length === 0 ? (
          <Card>
            <EmptyState title="No alerts yet" description="Create an alert above to get notified about new matching jobs." />
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-700">
                  {a.keyword && <span className="font-medium">&quot;{a.keyword}&quot;</span>}
                  {a.keyword && (a.location || a.employment_type) && " · "}
                  {a.location}
                  {a.location && a.employment_type && " · "}
                  {a.employment_type}
                </p>
                <form action={deleteAlertAction}>
                  <input type="hidden" name="alert_id" value={a.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
