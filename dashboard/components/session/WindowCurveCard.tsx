import { useMemo } from "react";
import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { ordinals } from "@/lib/format";
import { bestInWindow, elapsed, windowCurve } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function WindowCurveCard({ session, sessions }: { session: Session; sessions: Session[] }) {
  const maxSeconds = Math.max(1, Math.ceil(elapsed(session)));
  const mine = useMemo(() => windowCurve(session, maxSeconds), [session, maxSeconds]);
  const allTime = useMemo(
    () => ordinals(maxSeconds).map((x) => Math.max(...sessions.map((s) => bestInWindow(s, x).count))),
    [sessions, maxSeconds],
  );
  const labels = ordinals(maxSeconds);

  return (
    <Card
      title="Best stretch by length"
      description="Most questions this session solved in any 1s, 2s, 3s… stretch, against your all-time best for each length."
      table={{
        columns: ["Window", "This session", "All-time best"],
        rows: labels.map((x, i) => [`${x}s`, mine[i], allTime[i]]),
      }}
    >
      <Chart
        labels={labels.map((x) => `${x}s`)}
        xTitle="Window length"
        yTitle="Questions"
        series={[
          { label: "This session", data: mine, mark: "line", color: "series1" },
          { label: "All-time best", data: allTime, mark: "line", color: "series3" },
        ]}
      />
    </Card>
  );
}
