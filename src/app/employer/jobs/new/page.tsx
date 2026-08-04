import { Card } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { JobForm } from "@/components/employer/job-form";
import { createJobAction } from "@/lib/actions/employer";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  const defaults = db
    .prepare(
      "SELECT default_location, default_employment_type, default_remote_type FROM employer_profiles WHERE user_id = ?"
    )
    .get(user!.id) as {
    default_location: string;
    default_employment_type: string;
    default_remote_type: string;
  };

  return (
    <div>
      <BackLink fallbackHref="/employer/jobs" />
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Post a New Job</h1>
      <Card className="p-6 sm:p-8">
        <JobForm
          action={createJobAction}
          submitLabel="Submit for review"
          defaultValues={{
            title: "",
            location: defaults.default_location,
            employment_type: defaults.default_employment_type || "Full-Time",
            remote_type: defaults.default_remote_type || "Onsite",
            industry: "",
            experience_level: "Mid",
            salary_min: null,
            salary_max: null,
            description: "",
            qualifications: "",
            skills: "",
            deadline: "",
          }}
        />
      </Card>
    </div>
  );
}
