export function formatSalary(min: number | null, max: number | null, currency = "NGN") {
  if (!min && !max) return "Salary not disclosed";
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)} /yr`;
  if (min) return `From ${currency} ${fmt(min)} /yr`;
  return `Up to ${currency} ${fmt(max!)} /yr`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T") + (value.includes("T") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function timeAgo(value: string) {
  const d = new Date(value.replace(" ", "T") + (value.includes("T") ? "" : "Z"));
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(seconds)) return value;
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value2 = seconds;
  for (const [amount, unit] of units) {
    if (value2 < amount) {
      const rounded = Math.floor(value2);
      return rounded <= 1 ? `just now` : `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
    }
    value2 /= amount;
  }
  return value;
}
