import Link from "next/link";
import { getFeaturedJobs, INDUSTRIES } from "@/lib/data/jobs";
import { getPlatformStats } from "@/lib/data/stats";
import { JobCard } from "@/components/job-card";
import { LinkButton } from "@/components/ui";
import { CareerPathBackground } from "@/components/career-path-bg";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const jobs = getFeaturedJobs(6);
  const stats = getPlatformStats();
  const user = await getCurrentUser();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-plum-50 to-slate-50 border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-plum-200/40 blur-3xl animate-float"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-plum-300/30 blur-3xl animate-float-delay"
        />
        <CareerPathBackground />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="animate-fade-in-up text-brand-dark font-semibold tracking-wide text-sm uppercase mb-3">
            Local-first recruitment
          </p>
          <h1 className="animate-fade-in-up-1 text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Find great jobs, right in <span className="text-brand">your community.</span>
          </h1>
          <p className="animate-fade-in-up-2 mt-4 text-lg text-muted max-w-2xl mx-auto">
            The leading local-first recruitment marketplace connecting employers with talent in
            their communities.
          </p>

          <form
            action="/jobs"
            className="animate-fade-in-up-3 mt-8 max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-border p-2 flex flex-col sm:flex-row gap-2 transition-shadow duration-300 hover:shadow-md"
          >
            <input
              name="keyword"
              placeholder="Job title, keyword, or company"
              className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none"
            />
            <input
              name="location"
              placeholder="City or region"
              className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none border-t sm:border-t-0 sm:border-l border-border"
            />
            <button className="bg-brand text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95">
              Search Jobs
            </button>
          </form>

          <div className="animate-fade-in-up-3 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <Stat label="Employers" value={stats.employers} />
            <Stat label="Job Seekers" value={stats.seekers} />
            <Stat label="Jobs Posted" value={stats.publishedJobs} />
            <Stat label="Applications" value={stats.applications} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Featured & recent jobs</h2>
          <Link href="/jobs" className="text-brand-dark text-sm font-medium hover:underline">
            View all jobs →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p className="text-muted">No jobs posted yet. Check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} loggedIn={Boolean(user)} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-8">
          {INDUSTRIES.slice(0, 8).map((industry) => (
            <Link
              key={industry}
              href={`/jobs?industry=${encodeURIComponent(industry)}`}
              className="px-3 py-1.5 rounded-xl bg-white border border-border text-sm text-slate-600 transition-all duration-200 ease-out hover:border-brand hover:text-brand-dark hover:scale-105 hover:shadow-sm"
            >
              {industry}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 gap-8 text-white">
          <div>
            <h3 className="text-2xl font-bold">Hiring locally?</h3>
            <p className="mt-2 text-plum-50">
              Post a job in minutes, review applicants in one dashboard, and reach candidates in
              your region — at an affordable price.
            </p>
            <LinkButton href="/register?role=employer" variant="secondary" className="mt-5">
              Post a job as an employer
            </LinkButton>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Looking for work?</h3>
            <p className="mt-2 text-plum-50">
              Build your profile, upload your resume, and get matched with jobs near you based on
              your skills.
            </p>
            <LinkButton href="/register?role=seeker" variant="secondary" className="mt-5">
              Create a job seeker account
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs sm:text-sm text-muted">{label}</p>
    </div>
  );
}
