// Renders a company's logo. If the employer has uploaded one (logo_path),
// it's shown; otherwise a deterministic, good-looking monogram is generated
// from the company name so every card has a consistent brand mark.

const SIZES = {
  sm: "h-9 w-9 text-xs rounded-lg",
  md: "h-11 w-11 text-sm rounded-xl",
  lg: "h-14 w-14 text-base rounded-2xl",
} as const;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Stable hash → hue, so the same company always gets the same colors.
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 360;
  }
  return h;
}

export function CompanyLogo({
  name,
  logoPath,
  size = "md",
}: {
  name: string;
  logoPath?: string;
  size?: keyof typeof SIZES;
}) {
  const cls = SIZES[size];

  if (logoPath) {
    // Absolute paths ("/logos/google.svg") are bundled public assets; bare
    // filenames are employer uploads served through the uploads API.
    const src = logoPath.startsWith("/") ? logoPath : `/api/uploads/${logoPath}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} logo`}
        className={`${cls} shrink-0 object-contain bg-white p-1.5 ring-1 ring-black/5 shadow-sm`}
      />
    );
  }

  const hue = hueFromName(name || "?");
  const bg = `linear-gradient(135deg, hsl(${hue} 58% 46%), hsl(${(hue + 28) % 360} 62% 38%))`;

  return (
    <span
      aria-hidden="true"
      className={`${cls} shrink-0 inline-flex items-center justify-center font-semibold tracking-tight text-white ring-1 ring-black/5 shadow-sm select-none`}
      style={{ backgroundImage: bg }}
    >
      {initials(name)}
    </span>
  );
}
