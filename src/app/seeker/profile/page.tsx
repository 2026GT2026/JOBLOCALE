import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { SeekerProfileForm } from "@/components/seeker/profile-form";
import { ProfileStrength } from "@/components/seeker/profile-strength";

export default async function SeekerProfilePage() {
  const user = await getCurrentUser();
  const profile = db
    .prepare(
      `SELECT full_name, phone, location, headline, skills, experience, education, portfolio_url, linkedin_url, resume_filename
       FROM seeker_profiles WHERE user_id = ?`
    )
    .get(user!.id) as {
    full_name: string;
    phone: string;
    location: string;
    headline: string;
    skills: string;
    experience: string;
    education: string;
    portfolio_url: string;
    linkedin_url: string;
    resume_filename: string;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 sm:p-8 lg:col-span-2">
          <SeekerProfileForm profile={profile} />
        </Card>
        <ProfileStrength profile={profile} />
      </div>
    </div>
  );
}
