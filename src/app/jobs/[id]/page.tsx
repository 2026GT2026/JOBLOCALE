import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadJobDetail } from "@/lib/data/job-detail";
import { BackLink } from "@/components/back-link";
import { JobDetailPane } from "@/components/job-detail-pane";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string }>;
}) {
  const { id } = await params;
  const { applied } = await searchParams;
  const jobId = Number(id);
  const user = await getCurrentUser();

  const data = await loadJobDetail(jobId, user, { countView: true });
  if (!data) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BackLink fallbackHref="/jobs" />
      <JobDetailPane data={data} user={user} applied={applied === "1"} />
    </div>
  );
}
