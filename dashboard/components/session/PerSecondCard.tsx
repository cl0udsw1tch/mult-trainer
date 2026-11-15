import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { ordinals } from "@/lib/format";
import { perSecond } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function PerSecondCard({ session }: { session: Session }) {
  const counts = perSecond(session);
  const labels = ordinals(counts.length);
  return (
    <Card
      title="Questions each second"
      description="How many questions were solved in each second of the session."
      table={{ columns: ["Second", "Questions"], rows: labels.map((s, i) => [s, counts[i]]) }}
    >
      <Chart
        labels={labels}
        xTitle="Second"
        yTitle="Questions"
        title={(i) => `Second ${labels[i]}`}
        series={[{ label: "Questions", data: counts, mark: "bars", color: "series1" }]}
      />
    </Card>
  );
}
