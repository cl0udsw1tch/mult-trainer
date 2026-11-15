"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Controls";
import { Hero } from "@/components/ui/Stat";
import { fmtDate, fmtRate, fmtSeconds, ordinals, sessionLabel, sessionTitle } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { argmax, bestInWindow, elapsed, runningMax } from "@/lib/stats";
import type { Session } from "@/lib/types";

const WINDOW = { min: 1, initial: 5 } as const;

export function BestWindowCard({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<number>(WINDOW.initial);
  const max = Math.max(WINDOW.min, Math.ceil(Math.max(0, ...sessions.map(elapsed))));
  const seconds = Math.min(picked, max);

  const windows = useMemo(() => sessions.map((s) => bestInWindow(s, seconds)), [sessions, seconds]);
  const counts = windows.map((w) => w.count);
  const best = argmax(counts);

  return (
    <Card
      title={`Most questions in ${seconds}s`}
      description="Best stretch of that length inside any session, including restarted and quit runs. Click a point to open that session."
      controls={<Slider label="Window" min={WINDOW.min} max={max} value={seconds} onChange={setPicked} suffix={`${seconds}s`} />}
      table={{
        columns: ["#", "When", "Questions", "q/s", "Starts at"],
        rows: sessions.map((s, i) => [
          i + 1,
          sessionLabel(s),
          counts[i],
          fmtRate(counts[i] / seconds),
          fmtSeconds(windows[i].start),
        ]),
      }}
    >
      <Hero
        value={counts[best] ?? 0}
        label={`questions (${fmtRate((counts[best] ?? 0) / seconds)} q/s)`}
        note={best >= 0 ? fmtDate(sessions[best].startedAt) : undefined}
      />
      <Chart
        labels={ordinals(sessions.length)}
        xTitle="Session"
        yTitle="Questions"
        title={(i) => sessionTitle(sessions, i)}
        onSelect={(i) => router.push(sessionHref(sessions[i]))}
        footer={(i) => `from ${fmtSeconds(windows[i].start)}`}
        series={[
          { label: "Session best", data: counts, mark: "dots", color: "muted" },
          { label: "All-time best", data: runningMax(counts), mark: "step", color: "series1" },
        ]}
      />
    </Card>
  );
}
