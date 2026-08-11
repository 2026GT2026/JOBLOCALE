import Link from "next/link";
import { getCompaniesWithJobs } from "@/lib/data/companies";
import { CompanyLogo } from "@/components/company-logo";
import { Badge, Card, EmptyState } from "@/components/ui";

export const metadata = {
  title: "Companies · JobLocale",
  description: "Browse companies hiring on JobLocale.",
};

export default function CompaniesPage() {
  const companies = getCompaniesWithJobs();
  const totalOpenings = companies.reduce((sum, c) => sum + c.job_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Companies hiring on JobLocale</h1>
        <p className="text-muted mt-2">
          {companies.length} {companies.length === 1 ? "company" : "companies"} ·{" "}
          {totalOpenings} open {totalOpenings === 1 ? "role" : "roles"}
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl">
          <EmptyState
            title="No companies are hiring yet"
            description="Check back soon — new employers post openings regularly."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Link
              key={c.user_id}
              href={`/jobs?keyword=${encodeURIComponent(c.company_name)}`}
              className="block group"
            >
              <Card className="p-5 h-full cursor-pointer hover:border-brand/40 transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <CompanyLogo name={c.company_name} logoPath={c.logo_path} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-brand-dark">
                        {c.company_name}
                      </p>
                      {c.verified === 1 && <Badge tone="brand">Verified</Badge>}
                    </div>
                    {(c.industry || c.location) && (
                      <p className="text-sm text-muted mt-0.5 truncate">
                        {[c.industry, c.location].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-sm text-slate-700 font-medium mt-3">
                      {c.job_count} open {c.job_count === 1 ? "role" : "roles"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
