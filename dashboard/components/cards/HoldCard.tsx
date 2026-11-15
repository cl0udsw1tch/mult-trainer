"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Chart } from "@/components/charts/Chart";
import {
  AVERAGE_OVER,
  AverageOverField,
  TARGET_PACE,
  TargetPaceField,
} from "@/components/controls/PaceControls";
import { Card } from "@/components/ui/Card";
import { Hero } from "@/components/ui/Stat";
import { fmtSeconds, ordinals, sessionLabel, sessionTitle } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { argmax, elapsed, holdFromStart, mean, rolling, runningMax } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function HoldCard({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [rate, setRate] = useState<number>(TARGET_PACE.initial);
  const [rollN, setRollN] = useState<number>(AVERAGE_OVER.initial);
  const holds = useMemo(() => sessions.map((s) => holdFromStart(s, rate)), [sessions, rate]);
  const best = argmax(holds);

  return (
    <Card
      title={`Staying ahead of ${rate} q/s`}
      description={`How long from the start you stay ahead of a steady ${rate} q/s pace: question n solved within n ÷ ${rate} seconds. Click a point to open that session.`}
      controls={
        <>
          <TargetPaceField value={rate} onChange={setRate} />
          <AverageOverField value={rollN} onChange={setRollN} />
        </>
      }
      table={{
        columns: ["#", "When", "Held", "Session length"],
        rows: sessions.map((s, i) => [i + 1, sessionLabel(s), fmtSeconds(holds[i]), fmtSeconds(elapsed(s))]),
      }}
    >
      <Hero
        value={fmtSeconds(holds[best] ?? 0)}
        label="longest hold"
        note={best >= 0 ? sessionLabel(sessions[best]) : undefined}
      />
      <Chart
        labels={ordinals(sessions.length)}
        xTitle="Session"
        yTitle="Seconds held"
        format={(v) => fmtSeconds(v)}
        title={(i) => sessionTitle(sessions, i)}
        onSelect={(i) => router.push(sessionHref(sessions[i]))}
        series={[
          { label: "Held", data: holds, mark: "dots", color: "muted" },
          { label: `Average of last ${rollN}`, data: rolling(holds, rollN, mean), mark: "line", color: "series1" },
          { label: "Longest", data: runningMax(holds), mark: "step", color: "series3" },
        ]}
      />
    </Card>
  );
}
