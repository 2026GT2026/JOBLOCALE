const INK_MUTED = "#64748b";
const GRIDLINE = "#e2e8f0";
const BRAND = "#8a3868";

export function TrendBars({
  data,
  emptyLabel,
}: {
  data: { day: string; count: number }[];
  emptyLabel: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 560;
  const height = 140;
  const barGap = 6;
  const barWidth = Math.max(4, width / data.length - barGap);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" role="img" aria-label="Trend over last 14 days">
      <line x1={0} y1={height - 20} x2={width} y2={height - 20} stroke={GRIDLINE} strokeWidth={1} />
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (height - 40);
        const x = i * (barWidth + barGap);
        const y = height - 20 - barHeight;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx={2} fill={BRAND} />
            {d.count > 0 && (
              <text x={x + barWidth / 2} y={y - 4} fontSize={10} fill={INK_MUTED} textAnchor="middle">
                {d.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function IndustryBars({ data }: { data: { industry: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">No published jobs yet.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.industry} className="flex items-center gap-3">
          <span className="w-28 text-sm text-slate-600 truncate">{d.industry || "Uncategorized"}</span>
          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: BRAND }}
            />
          </div>
          <span className="w-6 text-sm text-slate-700 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
