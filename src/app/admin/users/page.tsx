import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { setUserStatusAction } from "@/lib/actions/admin";

type Row = {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  name: string;
};

export default async function AdminUsersPage() {
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
        COALESCE(s.full_name, e.company_name, '') as name
       FROM users u
       LEFT JOIN seeker_profiles s ON s.user_id = u.id
       LEFT JOIN employer_profiles e ON e.user_id = u.id
       ORDER BY u.created_at DESC`
    )
    .all() as Row[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">User Management</h1>
      <Card className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{row.name || row.email}</p>
                <Badge>{row.role}</Badge>
                <Badge tone={row.status === "active" ? "success" : "danger"}>{row.status}</Badge>
              </div>
              <p className="text-sm text-muted">
                {row.email} · Joined {formatDate(row.created_at)}
              </p>
            </div>
            {row.role !== "admin" && (
              <form action={setUserStatusAction}>
                <input type="hidden" name="user_id" value={row.id} />
                <input type="hidden" name="status" value={row.status === "active" ? "suspended" : "active"} />
                <button
                  className={`text-sm px-3 py-1.5 rounded-xl border transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                    row.status === "active"
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {row.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </form>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
