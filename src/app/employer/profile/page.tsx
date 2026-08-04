import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { EmployerProfileForm } from "@/components/employer/profile-form";

export default async function EmployerProfilePage() {
  const user = await getCurrentUser();
  const profile = db
    .prepare(
      "SELECT company_name, industry, company_size, location, website, description, logo_path FROM employer_profiles WHERE user_id = ?"
    )
    .get(user!.id) as {
    company_name: string;
    industry: string;
    company_size: string;
    location: string;
    website: string;
    description: string;
    logo_path: string;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Company Profile</h1>
      <Card className="p-6 sm:p-8">
        <EmployerProfileForm profile={profile} />
      </Card>
    </div>
  );
}
