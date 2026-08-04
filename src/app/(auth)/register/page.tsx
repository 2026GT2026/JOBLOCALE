import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BackLink } from "@/components/back-link";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { role } = await searchParams;
  const defaultRole = role === "employer" ? "employer" : "seeker";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <BackLink fallbackHref="/" />
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-muted mt-1">Join JobLocale to find local jobs or great local talent.</p>
        </div>
        <Card className="p-6 sm:p-8">
          <RegisterForm defaultRole={defaultRole} />
        </Card>
      </div>
    </div>
  );
}
