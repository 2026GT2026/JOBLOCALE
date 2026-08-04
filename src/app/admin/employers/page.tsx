import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { setEmployerVerifiedAction } from "@/lib/actions/admin";

type Row = {
  user_id: number;
  company_name: string;
  industry: string;
  location: string;
  verified: number;
  created_at: string;
  email: string;
  job_count: number;
};

export default async function AdminEmployersPage() {
  const rows = db
    .prepare(
      `SELECT e.user_id, e.company_name, e.industry, e.location, e.verified, u.created_at, u.email,
        (SELECT COUNT(*) FROM jobs j WHERE j.employer_id = e.user_id) as job_count
       FROM employer_profiles e JOIN users u ON u.id = e.user_id
       ORDER BY e.verified ASC, u.created_at DESC`
    )
    .all() as Row[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Employer Verification</h1>
      <Card className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.user_id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{row.company_name}</p>
                <Badge tone={row.verified ? "success" : "warning"}>
                  {row.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <p className="text-sm text-muted">
                {row.email} · {row.industry} · {row.location} · {row.job_count} job(s) · Joined{" "}
                {formatDate(row.created_at)}
              </p>
            </div>
            <form action={setEmployerVerifiedAction}>
              <input type="hidden" name="user_id" value={row.user_id} />
              <input type="hidden" name="verified" value={row.verified ? 0 : 1} />
              <button
                className={`text-sm px-3 py-1.5 rounded-xl border transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                  row.verified
                    ? "border-border text-slate-600 hover:bg-slate-50"
                    : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {row.verified ? "Revoke verification" : "Verify employer"}
              </button>
            </form>
          </div>
        ))}
      </Card>
    </div>
  );
}
