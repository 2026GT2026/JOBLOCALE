import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { Button, LinkButton } from "@/components/ui";
import { getUnreadCount } from "@/lib/notifications";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadCount = user ? getUnreadCount(user.id) : 0;

  return (
    <header className="border-b border-border bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-dark shrink-0 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-6">
            JL
          </span>
          JobLocale
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/jobs" className="relative hover:text-brand-dark transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand after:transition-all after:duration-200 hover:after:w-full">
            Find Jobs
          </Link>
          {user?.role === "employer" && (
            <Link href="/employer/jobs" className="relative hover:text-brand-dark transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand after:transition-all after:duration-200 hover:after:w-full">
              My Job Postings
            </Link>
          )}
          {!user && (
            <Link href="/register?role=employer" className="relative hover:text-brand-dark transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand after:transition-all after:duration-200 hover:after:w-full">
              For Employers
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin/dashboard" className="relative hover:text-brand-dark transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand after:transition-all after:duration-200 hover:after:w-full">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/register" variant="primary" size="sm">
                Sign up
              </LinkButton>
            </>
          )}
          {user && (
            <>
              <Link
                href="/notifications"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                title="Notifications"
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-brand-dark transition-colors duration-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
                  <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <LinkButton
                href={
                  user.role === "admin"
                    ? "/admin/dashboard"
                    : user.role === "employer"
                    ? "/employer/dashboard"
                    : "/seeker/dashboard"
                }
                variant="secondary"
                size="sm"
              >
                Dashboard
              </LinkButton>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
