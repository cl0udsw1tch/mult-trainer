import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { fmtSeconds } from "@/lib/format";
import { timeByPosition } from "@/lib/stats";
import type { Session } from "@/lib/types";

const DIGITS = 3;

export function PositionCard({ completed }: { completed: Session[] }) {
  const positions = timeByPosition(completed);
  return (
    <Card
      title="Time by question number"
      description="Average time on the n-th question of completed sessions. A rising line means you slow down as the session goes on."
      table={{
        columns: ["Question", "Avg time", "Sessions"],
        rows: positions.map((p) => [p.position, fmtSeconds(p.mean, DIGITS), p.sessions]),
      }}
    >
      <Chart
        labels={positions.map((p) => p.position)}
        xTitle="Question number"
        yTitle="Seconds"
        format={(v) => fmtSeconds(v, DIGITS)}
        title={(i) => `Question ${positions[i].position}`}
        footer={(i) => `${positions[i].sessions} sessions`}
        series={[{ label: "Avg time", data: positions.map((p) => p.mean), mark: "line", color: "series1" }]}
      />
    </Card>
  );
}
