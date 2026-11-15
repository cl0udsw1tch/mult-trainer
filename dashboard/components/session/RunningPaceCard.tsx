"use client";

import { useState } from "react";
import { Chart } from "@/components/charts/Chart";
import {
  RECENT_QUESTIONS,
  RecentQuestionsField,
  TARGET_PACE,
  TargetPaceField,
} from "@/components/controls/PaceControls";
import { Card } from "@/components/ui/Card";
import { Row } from "@/components/ui/layout";
import { Hero } from "@/components/ui/Stat";
import { fmtRate, fmtSeconds, ordinals } from "@/lib/format";
import { elapsed, holdFromStart, longestRun, recentPace, runningPace } from "@/lib/stats";
import type { Session } from "@/lib/types";

const DIGITS = 2;

export function RunningPaceCard({ session }: { session: Session }) {
  const [recent, setRecent] = useState<number>(RECENT_QUESTIONS.initial);
  const [target, setTarget] = useState<number>(TARGET_PACE.initial);

  const overall = runningPace(session);
  const latest = recentPace(session, recent);
  const hold = holdFromStart(session, target);
  const run = longestRun(session, target);

  return (
    <Card
      title="Pace through the session"
      description="Pace so far after each question (counted from question 1, so its head start doesn't inflate it), and over the last few questions."
      controls={
        <>
          <TargetPaceField value={target} onChange={setTarget} />
          <RecentQuestionsField value={recent} onChange={setRecent} />
        </>
      }
      table={{
        columns: ["Question", "Solved at", "Pace so far", `Last ${recent} pace`],
        rows: session.times.map((t, i) => [
          i + 1,
          fmtSeconds(t, DIGITS),
          overall[i] == null ? "–" : fmtRate(overall[i]),
          latest[i] == null ? "–" : fmtRate(latest[i]),
        ]),
      }}
    >
      <Row gap="xl" wrap>
        <Hero size="md" value={fmtSeconds(hold)} label={`ahead of ${target} q/s from the start (of ${fmtSeconds(elapsed(session))})`} />
        <Hero
          size="md"
          value={run.count}
          label={`questions in a row at ${target}+ q/s (${fmtSeconds(run.seconds)}, from ${fmtSeconds(run.start)})`}
        />
      </Row>
      <Chart
        labels={ordinals(session.times.length)}
        xTitle="Question"
        yTitle="q/s"
        format={fmtRate}
        title={(i) => `Question ${i + 1} · solved at ${fmtSeconds(session.times[i], DIGITS)}`}
        series={[
          { label: "Pace so far", data: overall, mark: "line", color: "series1" },
          { label: `Last ${recent} pace`, data: latest, mark: "line", color: "series2" },
          { label: `Target (${target} q/s)`, data: session.times.map(() => target), mark: "rule", color: "reference" },
        ]}
      />
    </Card>
  );
}
