"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chart } from "@/components/charts/Chart";
import { AVERAGE_OVER, AverageOverField } from "@/components/controls/PaceControls";
import { Card } from "@/components/ui/Card";
import { fmtDate, fmtRate, ordinals, sessionTitle } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { mean, pps, quantile, rolling, runningMax } from "@/lib/stats";
import type { Session } from "@/lib/types";

/** The floor line: this quantile of the rolling window. */
const FLOOR_QUANTILE = 0.1;

export function ProgressCard({ completed }: { completed: Session[] }) {
  const router = useRouter();
  const [rollN, setRollN] = useState<number>(AVERAGE_OVER.initial);
  const rates = completed.map(pps);
  const rollMean = rolling(rates, rollN, mean);
  const floor = rolling(rates, rollN, (w) => quantile(w, FLOOR_QUANTILE));
  const best = runningMax(rates);

  return (
    <Card
      span="full"
      title="Pace per session"
      description="Questions per second in each completed session. The floor (10th percentile of recent sessions) shows how bad your off days are. Click a point to open that session."
      controls={<AverageOverField value={rollN} onChange={setRollN} />}
      table={{
        columns: ["#", "When", "Length", "Solved", "q/s", `Average (${rollN})`, `Floor (${rollN})`, "Best"],
        rows: completed.map((s, i) => [
          i + 1,
          fmtDate(s.startedAt),
          `${s.duration}s`,
          s.times.length,
          fmtRate(rates[i]),
          fmtRate(rollMean[i]),
          fmtRate(floor[i]),
          fmtRate(best[i]),
        ]),
      }}
    >
      <Chart
        size="lg"
        labels={ordinals(completed.length)}
        xTitle="Completed session"
        yTitle="q/s"
        format={fmtRate}
        title={(i) => sessionTitle(completed, i)}
        onSelect={(i) => router.push(sessionHref(completed[i]))}
        series={[
          { label: "Session", data: rates, mark: "dots", color: "muted" },
          { label: `Average of last ${rollN}`, data: rollMean, mark: "line", color: "series1" },
          { label: `Floor of last ${rollN}`, data: floor, mark: "line", color: "series2" },
          { label: "Personal best", data: best, mark: "step", color: "series3" },
        ]}
      />
    </Card>
  );
}
