import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { fmtRate } from "@/lib/format";
import { paceBySecond } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function PaceBySecondCard({ completed }: { completed: Session[] }) {
  const pace = paceBySecond(completed);
  return (
    <Card
      title="Pace through a session"
      description="Average questions solved in each second of completed sessions. Filter to one length to compare like with like."
      table={{
        columns: ["Second", "Avg questions", "Sessions"],
        rows: pace.map((p) => [p.second, fmtRate(p.rate), p.sessions]),
      }}
    >
      <Chart
        labels={pace.map((p) => p.second)}
        xTitle="Second"
        yTitle="Questions"
        format={fmtRate}
        title={(i) => `Second ${pace[i].second}`}
        footer={(i) => `${pace[i].sessions} sessions`}
        series={[{ label: "Avg questions", data: pace.map((p) => p.rate), mark: "bars", color: "series1" }]}
      />
    </Card>
  );
}
