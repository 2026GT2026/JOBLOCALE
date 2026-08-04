import Link from "next/link";
import {
  searchJobs,
  INDUSTRIES,
  EMPLOYMENT_TYPES,
  REMOTE_TYPES,
  EXPERIENCE_LEVELS,
} from "@/lib/data/jobs";
import { loadJobDetail } from "@/lib/data/job-detail";
import { JobDetailPane } from "@/components/job-detail-pane";
import { Badge, Card, EmptyState, Select } from "@/components/ui";
import { formatSalary, timeAgo } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";

type SearchParams = {
  keyword?: string;
  location?: string;
  industry?: string;
  employmentType?: string;
  remoteType?: string;
  experienceLevel?: string;
  datePosted?: string;
  page?: string;
  selected?: string;
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const user = await getCurrentUser();

  const results = searchJobs({
    keyword: sp.keyword,
    location: sp.location,
    industry: sp.industry,
    employmentType: sp.employmentType,
    remoteType: sp.remoteType,
    experienceLevel: sp.experienceLevel,
    datePosted: sp.datePosted,
    page,
  });

  const explicitlySelected = Boolean(sp.selected);
  const effectiveId = sp.selected ? Number(sp.selected) : results.jobs[0]?.id;
  const detail = effectiveId ? await loadJobDetail(effectiveId, user, { countView: explicitlySelected }) : null;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      keyword: sp.keyword,
      location: sp.location,
      industry: sp.industry,
      employmentType: sp.employmentType,
      remoteType: sp.remoteType,
      experienceLevel: sp.experienceLevel,
      datePosted: sp.datePosted,
      page: sp.page,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/jobs?${params.toString()}`;
  };

  const selectHref = (jobId: number) => buildHref({ selected: String(jobId) });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <form className="bg-white border border-border rounded-3xl p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500">Keyword</label>
          <input
            name="keyword"
            defaultValue={sp.keyword}
            placeholder="Job title, skill, company"
            className="mt-1 w-full rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-slate-500">Location</label>
          <input
            name="location"
            defaultValue={sp.location}
            placeholder="City or region"
            className="mt-1 w-full rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="w-36">
          <label className="text-xs font-medium text-slate-500">Industry</label>
          <Select name="industry" defaultValue={sp.industry ?? ""} className="mt-1">
            <option value="">All</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <label className="text-xs font-medium text-slate-500">Type</label>
          <Select name="employmentType" defaultValue={sp.employmentType ?? ""} className="mt-1">
            <option value="">Any</option>
            {EMPLOYMENT_TYPES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-slate-500">Workplace</label>
          <Select name="remoteType" defaultValue={sp.remoteType ?? ""} className="mt-1">
            <option value="">Any</option>
            {REMOTE_TYPES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-slate-500">Experience</label>
          <Select name="experienceLevel" defaultValue={sp.experienceLevel ?? ""} className="mt-1">
            <option value="">Any</option>
            {EXPERIENCE_LEVELS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <label className="text-xs font-medium text-slate-500">Date posted</label>
          <Select name="datePosted" defaultValue={sp.datePosted ?? ""} className="mt-1">
            <option value="">Any time</option>
            <option value="1">Last 24 hours</option>
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        </div>
        <button className="bg-brand text-white rounded-2xl px-5 py-2 text-sm font-medium transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95">
          Search
        </button>
        {(sp.keyword || sp.location || sp.industry || sp.employmentType || sp.remoteType || sp.experienceLevel || sp.datePosted) && (
          <Link href="/jobs" className="text-xs text-muted hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      {results.jobs.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl">
          <EmptyState
            title="No jobs match your search"
            description="Try broadening your filters or searching a different keyword."
          />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <div className={`space-y-3 lg:h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2 ${explicitlySelected ? "hidden lg:block" : "block"}`}>
            <p className="text-sm text-muted px-1">
              {results.total} job{results.total === 1 ? "" : "s"} found
            </p>
            {results.jobs.map((job) => {
              const isActive = effectiveId === job.id;
              return (
                <Link key={job.id} href={selectHref(job.id)} scroll={false} className="block">
                  <Card
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      isActive ? "border-brand ring-2 ring-brand/20" : "hover:border-brand/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      {job.featured === 1 && <Badge tone="brand">Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted mt-0.5">
                      {job.company_name} · {job.location}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge>{job.employment_type}</Badge>
                      <Badge>{job.remote_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-slate-700 font-medium">{formatSalary(job.salary_min, job.salary_max)}</span>
                      <span className="text-muted">{job.published_at ? timeAgo(job.published_at) : ""}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}

            {results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {Array.from({ length: results.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildHref({ page: String(p), selected: undefined })}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl text-sm transition-all duration-200 hover:scale-110 ${
                      p === results.page
                        ? "bg-brand text-white"
                        : "bg-white border border-border text-slate-600 hover:border-brand"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={`lg:h-[calc(100vh-220px)] lg:overflow-y-auto lg:pl-2 ${explicitlySelected ? "block" : "hidden lg:block"}`}>
            <Link
              href={buildHref({ selected: undefined })}
              scroll={false}
              className="lg:hidden inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-dark mb-4"
            >
              <span aria-hidden>&larr;</span> Back to results
            </Link>
            {detail ? (
              <JobDetailPane data={detail} user={user} />
            ) : (
              <Card className="p-10 text-center text-muted text-sm">Select a job to view details.</Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
