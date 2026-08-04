import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { analyzeSeekerProfile, profileStrengthLabel, type SeekerProfileForAnalysis } from "@/lib/profile-analysis";

export function ProfileStrength({
  profile,
  compact = false,
}: {
  profile: SeekerProfileForAnalysis;
  compact?: boolean;
}) {
  const { score, checks } = analyzeSeekerProfile(profile);
  const { label, tone } = profileStrengthLabel(score);
  const visibleChecks = compact ? checks.filter((c) => !c.done).slice(0, 3) : checks;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-slate-900">Profile Strength</h2>
        <Badge tone={tone}>{label}</Badge>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <p className="text-3xl font-bold text-slate-900">{score}%</p>
        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {visibleChecks.map((check) => (
          <li key={check.key} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                check.done ? "bg-brand text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {check.done ? "✓" : ""}
            </span>
            <span className={check.done ? "text-slate-500 line-through" : "text-slate-700"}>
              {check.done ? check.label : check.hint}
            </span>
          </li>
        ))}
        {compact && visibleChecks.length === 0 && (
          <li className="text-sm text-slate-500">Your profile looks complete — nice work.</li>
        )}
      </ul>

      {compact && (
        <Link href="/seeker/profile" className="mt-4 inline-block text-sm text-brand-dark font-medium hover:underline">
          Improve your profile →
        </Link>
      )}
    </Card>
  );
}
