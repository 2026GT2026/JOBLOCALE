import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { BackLink } from "@/components/back-link";
import { sendFollowUpMessageAction } from "@/lib/actions/seeker";
import { MessageThread } from "@/components/message-thread";

const statusTone: Record<string, "default" | "success" | "warning" | "danger" | "brand"> = {
  submitted: "default",
  reviewed: "brand",
  shortlisted: "warning",
  interview: "warning",
  rejected: "danger",
  hired: "success",
};

type Application = {
  id: number;
  job_id: number;
  status: string;
  cover_letter: string;
  resume_filename: string;
  resume_path: string;
  created_at: string;
  updated_at: string;
  title: string;
  company_name: string;
  location: string;
};

type Message = { id: number; sender_role: string; body: string; created_at: string };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const applicationId = Number(id);

  const application = db
    .prepare(
      `SELECT a.id, a.job_id, a.status, a.cover_letter, a.resume_filename, a.resume_path, a.created_at, a.updated_at,
              j.title, j.location, e.company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN employer_profiles e ON e.user_id = j.employer_id
       WHERE a.id = ? AND a.seeker_id = ?`
    )
    .get(applicationId, user!.id) as Application | undefined;

  if (!application) notFound();

  const messages = db
    .prepare("SELECT id, sender_role, body, created_at FROM messages WHERE application_id = ? ORDER BY created_at ASC")
    .all(applicationId) as Message[];

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink fallbackHref="/seeker/applications" />

      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <Link href={`/jobs/${application.job_id}`} className="text-2xl font-bold text-slate-900 hover:text-brand-dark">
            {application.title}
          </Link>
          <p className="text-sm text-muted mt-0.5">
            {application.company_name} · {application.location}
          </p>
        </div>
        <Badge tone={statusTone[application.status] ?? "default"}>{application.status}</Badge>
      </div>
      <p className="text-xs text-muted mb-6">
        Applied {formatDate(application.created_at)} · Last updated {formatDate(application.updated_at)}
      </p>

      <Card className="p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-1">Resume submitted</p>
          {application.resume_path ? (
            <Link
              href={`/api/uploads/${application.resume_path}`}
              target="_blank"
              className="text-sm text-brand-dark hover:underline"
            >
              {application.resume_filename || "View resume"}
            </Link>
          ) : (
            <p className="text-sm text-muted">No resume attached.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-1">Cover letter</p>
          {application.cover_letter ? (
            <p className="text-sm text-slate-700 whitespace-pre-line">{application.cover_letter}</p>
          ) : (
            <p className="text-sm text-muted">No cover letter submitted.</p>
          )}
        </div>
      </Card>

      <Card className="p-6 mt-4">
        <p className="text-xs font-semibold text-muted uppercase mb-3">Messages with {application.company_name}</p>
        {messages.length > 0 ? (
          <div className="mb-3">
            <MessageThread messages={messages} alignRight="seeker" />
          </div>
        ) : (
          <p className="text-sm text-muted mb-3">No messages yet.</p>
        )}
        <form action={sendFollowUpMessageAction} className="flex gap-2">
          <input type="hidden" name="application_id" value={application.id} />
          <input
            name="body"
            placeholder="Send a message..."
            className="flex-1 rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button className="text-sm px-4 py-2 rounded-2xl bg-brand text-white transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95">
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
