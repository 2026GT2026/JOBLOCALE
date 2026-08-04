export type ProfileCheck = {
  key: string;
  label: string;
  done: boolean;
  hint: string;
};

export type ProfileAnalysis = {
  score: number;
  checks: ProfileCheck[];
};

export type SeekerProfileForAnalysis = {
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

export function analyzeSeekerProfile(profile: SeekerProfileForAnalysis): ProfileAnalysis {
  const skillCount = profile.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;

  const checks: ProfileCheck[] = [
    {
      key: "resume",
      label: "Resume uploaded",
      done: Boolean(profile.resume_filename),
      hint: "Upload a resume so employers can review your background before responding.",
    },
    {
      key: "headline",
      label: "Professional headline",
      done: profile.headline.trim().length >= 8,
      hint: 'Add a short headline describing your role, e.g. "Frontend Engineer".',
    },
    {
      key: "skills",
      label: "At least 3 skills listed",
      done: skillCount >= 3,
      hint: "List at least 3 relevant skills — this is what matches you to job searches.",
    },
    {
      key: "experience",
      label: "Work experience described",
      done: profile.experience.trim().length >= 30,
      hint: "Describe your recent work experience in a sentence or two.",
    },
    {
      key: "education",
      label: "Education added",
      done: profile.education.trim().length >= 5,
      hint: "Add your highest level of education.",
    },
    {
      key: "location",
      label: "Location set",
      done: profile.location.trim().length > 0,
      hint: "Add your location so employers know where you're based.",
    },
    {
      key: "phone",
      label: "Phone number added",
      done: profile.phone.trim().length > 0,
      hint: "Add a phone number so employers can reach you quickly.",
    },
    {
      key: "links",
      label: "Portfolio or LinkedIn linked",
      done: Boolean(profile.portfolio_url.trim() || profile.linkedin_url.trim()),
      hint: "Link a portfolio or LinkedIn profile to stand out from other applicants.",
    },
  ];

  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  return { score, checks };
}

export function profileStrengthLabel(score: number): { label: string; tone: "danger" | "warning" | "success" } {
  if (score >= 80) return { label: "Strong profile", tone: "success" };
  if (score >= 50) return { label: "Good start", tone: "warning" };
  return { label: "Needs attention", tone: "danger" };
}
