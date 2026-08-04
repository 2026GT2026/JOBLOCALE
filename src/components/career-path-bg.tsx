const PATH = "M-180,560 C120,540 100,330 282,330 C480,330 550,230 750,230 C900,230 900,110 1030,110";

const STROKE = { stroke: "var(--brand)", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ResumeIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx - 11}, ${cy - 13})`} {...STROKE} strokeWidth={2}>
      <rect x={0} y={0} width={22} height={26} rx={3} />
      <line x1={5} y1={8} x2={17} y2={8} />
      <line x1={5} y1={13} x2={17} y2={13} />
      <line x1={5} y1={18} x2={13} y2={18} />
    </g>
  );
}

function InterviewIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx - 13}, ${cy - 12})`} {...STROKE} strokeWidth={2}>
      <path d="M2 1h22a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H12l-7 6v-6H2a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" />
    </g>
  );
}

function OfferIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx}, ${cy})`} {...STROKE} strokeWidth={2.2}>
      <circle r={14} />
      <path d="M-6 0.5l4.2 4.2L7 -6" />
    </g>
  );
}

function BriefcaseIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx - 17}, ${cy - 14})`} {...STROKE} strokeWidth={2.4}>
      <path d="M11 9V6a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3" />
      <rect x={0} y={9} width={34} height={21} rx={3} />
      <line x1={0} y1={19} x2={34} y2={19} />
    </g>
  );
}

const MILESTONES: { x: number; y: number; Icon: typeof ResumeIcon }[] = [
  { x: -180, y: 560, Icon: ResumeIcon },
  { x: 282, y: 330, Icon: InterviewIcon },
  { x: 750, y: 230, Icon: OfferIcon },
  { x: 1030, y: 110, Icon: BriefcaseIcon },
];

export function CareerPathBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full overflow-visible opacity-[0.16]"
      viewBox="0 0 1100 450"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <path
        d={PATH}
        stroke="var(--brand)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="10 14"
        className="animate-dash-flow"
      />

      {MILESTONES.map(({ x, y, Icon }) => (
        <Icon key={`${x}-${y}`} cx={x} cy={y} />
      ))}

      <circle r={16} fill="var(--brand)" opacity={0.35}>
        <animateMotion dur="9s" repeatCount="indefinite" path={PATH} />
      </circle>
      <circle r={8} fill="var(--brand)">
        <animateMotion dur="9s" repeatCount="indefinite" path={PATH} />
      </circle>
    </svg>
  );
}
