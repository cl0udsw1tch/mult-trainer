"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Chart } from "@/components/charts/Chart";
import { TARGET_PACE, TargetPaceField } from "@/components/controls/PaceControls";
import { Card } from "@/components/ui/Card";
import { Hero } from "@/components/ui/Stat";
import { fmtDate, fmtRate, fmtSeconds, ordinals, sessionLabel, sessionTitle } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { argmax, longestRun, runningMax } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function LongestRunCard({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [rate, setRate] = useState<number>(TARGET_PACE.initial);
  const runs = useMemo(() => sessions.map((s) => longestRun(s, rate)), [sessions, rate]);
  const counts = runs.map((r) => r.count);
  const best = argmax(counts);

  return (
    <Card
      title={`Longest run at ${rate} q/s or faster`}
      description="Most consecutive questions anywhere in a session whose average pace stays at or above the target. A run can't outlast its session. Click a point to open that session."
      controls={<TargetPaceField value={rate} onChange={setRate} />}
      table={{
        columns: ["#", "When", "Questions", "Seconds", "Run q/s", "Starts at"],
        rows: sessions.map((s, i) => [
          i + 1,
          sessionLabel(s),
          counts[i],
          fmtSeconds(runs[i].seconds),
          runs[i].seconds ? fmtRate(counts[i] / runs[i].seconds) : "–",
          fmtSeconds(runs[i].start),
        ]),
      }}
    >
      <Hero
        value={counts[best] ?? 0}
        label={best >= 0 ? `questions in ${fmtSeconds(runs[best].seconds)}` : "questions"}
        note={best >= 0 ? fmtDate(sessions[best].startedAt) : undefined}
      />
      <Chart
        labels={ordinals(sessions.length)}
        xTitle="Session"
        yTitle="Questions"
        title={(i) => sessionTitle(sessions, i)}
        onSelect={(i) => router.push(sessionHref(sessions[i]))}
        footer={(i) => `${fmtSeconds(runs[i].seconds)}, from ${fmtSeconds(runs[i].start)}`}
        series={[
          { label: "Session longest", data: counts, mark: "dots", color: "muted" },
          { label: "All-time longest", data: runningMax(counts), mark: "step", color: "series1" },
        ]}
      />
    </Card>
  );
}
