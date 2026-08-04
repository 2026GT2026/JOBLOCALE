export type ThreadMessage = { id: number; sender_role: string; body: string; created_at: string };

const BUBBLE_STYLE: Record<string, string> = {
  seeker: "bg-plum-50 text-plum-900",
  employer: "bg-slate-100 text-slate-800",
  admin: "bg-sky-50 text-sky-900 border border-sky-200",
};

export function MessageThread({
  messages,
  alignRight,
}: {
  messages: ThreadMessage[];
  alignRight: "seeker" | "employer" | "admin";
}) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <div key={m.id} className={`max-w-md ${m.sender_role === alignRight ? "ml-auto" : ""}`}>
          {m.sender_role === "admin" && (
            <p className="text-[11px] font-semibold text-sky-700 mb-0.5 px-1">JobLocale Support</p>
          )}
          <div className={`text-sm rounded-2xl px-3 py-2 ${BUBBLE_STYLE[m.sender_role] ?? "bg-slate-100"}`}>
            {m.body}
          </div>
        </div>
      ))}
    </div>
  );
}
