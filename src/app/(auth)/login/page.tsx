import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BackLink } from "@/components/back-link";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <BackLink fallbackHref="/" />
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Log in to manage your jobs and applications.</p>
        </div>
        <Card className="p-6 sm:p-8">
          <LoginForm />
        </Card>
        <p className="text-xs text-center text-muted mt-4">
          Demo accounts: admin@joblocale.test · employer@brightpath.test · jane.doe@example.test (password: password123)
        </p>
      </div>
    </div>
  );
}
