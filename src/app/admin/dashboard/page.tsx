import Link from "next/link";
import { getAdminOverview } from "@/lib/data/stats";
import { getApplicationTrackingSummary } from "@/lib/data/applications";
import { Card } from "@/components/ui";
import { TrendBars, IndustryBars } from "@/components/admin/charts";

export default async function AdminDashboardPage() {
  const stats = getAdminOverview();
  const tracking = getApplicationTrackingSummary();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reporting & Analytics</h1>

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin/users" />
        <StatCard label="Employers" value={stats.employers} href="/admin/employers" />
        <StatCard label="Job seekers" value={stats.seekers} href="/admin/users" />
        <StatCard label="Published jobs" value={stats.publishedJobs} href="/admin/jobs" />
        <StatCard label="Pending review" value={stats.pendingJobs} highlight={stats.pendingJobs > 0} href="/admin/jobs" />
        <StatCard
          label="Applications needing follow-up"
          value={tracking.needsFollowUp}
          highlight={tracking.needsFollowUp > 0}
          href="/admin/applications"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Suspended accounts" value={stats.suspended} href="/admin/users" large />
        <StatCard label="Unverified employers" value={stats.unverifiedEmployers} href="/admin/employers" large />
        <Card className="p-5">
          <p className="text-sm text-muted">Revenue (paid postings & promotions)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">NGN {stats.revenue.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Jobs posted — last 14 days</h2>
          <TrendBars data={stats.jobsByDay} emptyLabel="No jobs posted in the last 14 days." />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">User signups — last 14 days</h2>
          <TrendBars data={stats.usersByDay} emptyLabel="No signups in the last 14 days." />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Published jobs by industry</h2>
        <IndustryBars data={stats.jobsByIndustry} />
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  href,
  large,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  href?: string;
  large?: boolean;
}) {
  const card = (
    <Card
      className={`${large ? "p-5" : "p-4"} ${highlight ? "bg-amber-50 border-amber-200" : ""} ${href ? "cursor-pointer hover:border-brand/40" : ""}`}
    >
      {large ? (
        <>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </>
      ) : (
        <>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-muted mt-1">{label}</p>
        </>
      )}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
