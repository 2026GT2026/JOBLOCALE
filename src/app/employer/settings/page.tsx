import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { AccountForm } from "@/components/employer/account-form";
import { NotificationToggle } from "@/components/employer/notification-toggle";
import { JobDefaultsForm } from "@/components/employer/job-defaults-form";
import { DangerZone } from "@/components/employer/danger-zone";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const profile = db
    .prepare(
      `SELECT notify_new_applicant, notify_job_status, default_location, default_employment_type, default_remote_type
       FROM employer_profiles WHERE user_id = ?`
    )
    .get(user!.id) as {
    notify_new_applicant: number;
    notify_job_status: number;
    default_location: string;
    default_employment_type: string;
    default_remote_type: string;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-sm text-muted">Manage your account, notifications, and defaults.</p>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Account</h2>
        <Card className="p-6 sm:p-8">
          <AccountForm email={user!.email} />
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Notifications</h2>
        <Card className="p-6 space-y-5 divide-y divide-border">
          <NotificationToggle
            field="notify_new_applicant"
            label="New applicant emails"
            description="Get an email whenever someone applies to one of your jobs."
            initialValue={profile.notify_new_applicant === 1}
          />
          <div className="pt-5">
            <NotificationToggle
              field="notify_job_status"
              label="Job status updates"
              description="Get an email when a job posting is approved, rejected, or expires."
              initialValue={profile.notify_job_status === 1}
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Job posting defaults</h2>
        <Card className="p-6 sm:p-8">
          <JobDefaultsForm
            defaults={{
              default_location: profile.default_location,
              default_employment_type: profile.default_employment_type,
              default_remote_type: profile.default_remote_type,
            }}
          />
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-red-700 mb-3">Danger zone</h2>
        <Card className="p-6 sm:p-8 bg-red-50 border-red-200">
          <DangerZone />
        </Card>
      </div>
    </div>
  );
}
