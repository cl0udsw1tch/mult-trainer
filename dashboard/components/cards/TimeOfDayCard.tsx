import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { fmtRate } from "@/lib/format";
import { mean, pps } from "@/lib/stats";
import type { Session } from "@/lib/types";

const HOURS = 24;
const HALF_DAY = 12;

const hourLabel = (h: number) => `${h % HALF_DAY || HALF_DAY}${h < HALF_DAY ? "a" : "p"}`;

export function TimeOfDayCard({ completed }: { completed: Session[] }) {
  const byHour = Array.from({ length: HOURS }, (_, h) => {
    const group = completed.filter((s) => new Date(s.startedAt).getHours() === h);
    return { h, rate: group.length ? mean(group.map(pps)) : null, n: group.length };
  });
  return (
    <Card
      title="Time of day"
      description="Average pace of completed sessions by the hour they started."
      table={{
        columns: ["Hour", "Avg q/s", "Sessions"],
        rows: byHour.filter((h) => h.n).map((h) => [hourLabel(h.h), fmtRate(h.rate ?? NaN), h.n]),
      }}
    >
      <Chart
        labels={byHour.map((h) => hourLabel(h.h))}
        yTitle="q/s"
        format={fmtRate}
        footer={(i) => `${byHour[i].n} sessions`}
        series={[{ label: "Avg q/s", data: byHour.map((h) => h.rate), mark: "bars", color: "series1" }]}
      />
    </Card>
  );
}
