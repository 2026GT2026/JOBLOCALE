import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getJobById } from "@/lib/data/jobs";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { formatDate } from "@/lib/format";
import { StatusSelect } from "@/components/employer/status-select";
import { sendMessageAction } from "@/lib/actions/employer";
import { MessageThread } from "@/components/message-thread";

type Applicant = {
  id: number;
  seeker_id: number;
  cover_letter: string;
  resume_filename: string;
  resume_path: string;
  status: string;
  created_at: string;
  full_name: string;
  headline: string;
  skills: string;
  location: string;
  phone: string;
};

type Message = { id: number; sender_role: string; body: string; created_at: string };

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const jobId = Number(id);
  const job = getJobById(jobId);
  if (!job || job.employer_id !== user!.id) notFound();

  const applicants = db
    .prepare(
      `SELECT a.id, a.seeker_id, a.cover_letter, a.resume_filename, a.resume_path, a.status, a.created_at,
              s.full_name, s.headline, s.skills, s.location, s.phone
       FROM applications a JOIN seeker_profiles s ON s.user_id = a.seeker_id
       WHERE a.job_id = ? ORDER BY a.created_at DESC`
    )
    .all(jobId) as Applicant[];

  const messagesByApplication = new Map<number, Message[]>();
  for (const applicant of applicants) {
    const msgs = db
      .prepare("SELECT id, sender_role, body, created_at FROM messages WHERE application_id = ? ORDER BY created_at ASC")
      .all(applicant.id) as Message[];
    messagesByApplication.set(applicant.id, msgs);
  }

  return (
    <div>
      <BackLink fallbackHref="/employer/jobs" />
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
        <LinkButton href={`/api/employer/jobs/${jobId}/export`} variant="secondary" size="sm">
          Download applications (CSV)
        </LinkButton>
      </div>
      <p className="text-sm text-muted mb-6">{applicants.length} applicant(s)</p>

      {applicants.length === 0 ? (
        <Card>
          <EmptyState title="No applicants yet" description="Check back once candidates start applying." />
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((a) => {
            const messages = messagesByApplication.get(a.id) ?? [];
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-slate-900">{a.full_name}</p>
                    <p className="text-sm text-muted">
                      {a.headline} {a.location && `· ${a.location}`} {a.phone && `· ${a.phone}`}
                    </p>
                    <p className="text-xs text-muted mt-1">Applied {formatDate(a.created_at)}</p>
                  </div>
                  <StatusSelect applicationId={a.id} jobId={jobId} status={a.status} />
                </div>

                {a.skills && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {a.skills.split(",").map((s) => (
                      <Badge key={s}>{s.trim()}</Badge>
                    ))}
                  </div>
                )}

                {a.cover_letter && (
                  <p className="text-sm text-slate-700 mt-3 whitespace-pre-line border-t border-border pt-3">
                    {a.cover_letter}
                  </p>
                )}

                <div className="mt-3">
                  {a.resume_path ? (
                    <Link
                      href={`/api/uploads/${a.resume_path}`}
                      target="_blank"
                      className="text-sm text-brand-dark hover:underline"
                    >
                      View resume ({a.resume_filename})
                    </Link>
                  ) : (
                    <p className="text-sm text-muted">No resume attached.</p>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted uppercase mb-2">Candidate communication</p>
                  {messages.length > 0 && (
                    <div className="mb-3">
                      <MessageThread messages={messages} alignRight="employer" />
                    </div>
                  )}
                  <form action={sendMessageAction} className="flex gap-2">
                    <input type="hidden" name="application_id" value={a.id} />
                    <input type="hidden" name="job_id" value={jobId} />
                    <input
                      name="body"
                      placeholder="Message this candidate..."
                      className="flex-1 rounded-2xl border border-border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                    <button className="text-sm px-4 py-2 rounded-2xl bg-brand text-white transition-all duration-200 ease-out hover:bg-brand-dark hover:scale-105 active:scale-95">
                      Send
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
