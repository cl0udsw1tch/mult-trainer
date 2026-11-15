import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { fmtRate, ordinals } from "@/lib/format";
import { mean, pps } from "@/lib/stats";
import type { Session } from "@/lib/types";

/** Attempts from this number on are pooled into one "N+" bar. */
const MAX_ATTEMPT = 8;

export function WarmupCard({ completed, attempts }: { completed: Session[]; attempts: Map<string, number> }) {
  const groups = ordinals(MAX_ATTEMPT).map((n) => {
    const group = completed.filter((s) => Math.min(MAX_ATTEMPT, attempts.get(s.startedAt) ?? 1) === n);
    return { label: n === MAX_ATTEMPT ? `${n}+` : String(n), rate: mean(group.map(pps)), n: group.length };
  });
  return (
    <Card
      title="Warm-up"
      description="Average pace by attempt number within a sitting (runs less than 30 minutes apart). Restarts count as attempts."
      table={{ columns: ["Attempt", "Avg q/s", "Sessions"], rows: groups.map((g) => [g.label, fmtRate(g.rate), g.n]) }}
    >
      <Chart
        labels={groups.map((g) => g.label)}
        xTitle="Attempt in sitting"
        yTitle="q/s"
        format={fmtRate}
        title={(i) => `Attempt ${groups[i].label}`}
        footer={(i) => `${groups[i].n} sessions`}
        series={[{ label: "Avg q/s", data: groups.map((g) => g.rate), mark: "bars", color: "series1" }]}
      />
    </Card>
  );
}
