import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getJobById } from "@/lib/data/jobs";
import { Card } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { JobForm } from "@/components/employer/job-form";
import { updateJobAction } from "@/lib/actions/employer";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const job = getJobById(Number(id));

  if (!job || job.employer_id !== user!.id) notFound();

  return (
    <div>
      <BackLink fallbackHref="/employer/jobs" />
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Job Posting</h1>
      <Card className="p-6 sm:p-8">
        <JobForm
          action={updateJobAction}
          submitLabel="Submit for review"
          defaultValues={{
            id: job.id,
            title: job.title,
            location: job.location,
            employment_type: job.employment_type,
            remote_type: job.remote_type,
            industry: job.industry,
            experience_level: job.experience_level,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            description: job.description,
            qualifications: job.qualifications,
            skills: job.skills,
            deadline: job.deadline,
          }}
        />
      </Card>
    </div>
  );
}
