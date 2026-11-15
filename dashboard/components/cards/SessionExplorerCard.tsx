"use client";

import { useState } from "react";
import { QuestionTimesChart, questionTimesTable } from "@/components/charts/QuestionTimesChart";
import {
  RECENT_QUESTIONS,
  RecentQuestionsField,
  TARGET_PACE,
  TargetPaceField,
} from "@/components/controls/PaceControls";
import { Card } from "@/components/ui/Card";
import { Button, Select } from "@/components/ui/Controls";
import { LinkButton } from "@/components/ui/LinkButton";
import { Hero } from "@/components/ui/Stat";
import { fmtRate, fmtSeconds, sessionLabel } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { argmax, elapsed, pps } from "@/lib/stats";
import type { Session } from "@/lib/types";

export function SessionExplorerCard({ sessions, completed }: { sessions: Session[]; completed: Session[] }) {
  const [pickedAt, setPickedAt] = useState<string | null>(null);
  const [recent, setRecent] = useState<number>(RECENT_QUESTIONS.initial);
  const [target, setTarget] = useState<number>(TARGET_PACE.initial);

  const latest = sessions[sessions.length - 1];
  const best = completed[argmax(completed.map(pps))];
  const session = sessions.find((s) => s.startedAt === pickedAt) ?? latest;
  if (!session) return null;

  return (
    <Card
      span="full"
      title="Session explorer"
      description="Time on each question of one session, with the running average since the start and over the last few questions. Question 1 is short because you see it before the timer starts."
      controls={
        <>
          <Select
            label="Session"
            width="lg"
            value={session.startedAt}
            onChange={setPickedAt}
            options={[...sessions].reverse().map((s) => ({
              value: s.startedAt,
              label: `${sessionLabel(s)} · ${s.times.length} solved`,
            }))}
          />
          <Button onClick={() => setPickedAt(latest.startedAt)}>Latest</Button>
          {best && <Button onClick={() => setPickedAt(best.startedAt)}>Best</Button>}
          <LinkButton href={sessionHref(session)}>Open session →</LinkButton>
          <RecentQuestionsField value={recent} onChange={setRecent} />
          <TargetPaceField value={target} onChange={setTarget} />
        </>
      }
      table={questionTimesTable(session, recent)}
    >
      <Hero
        value={session.times.length}
        label={`solved in ${fmtSeconds(elapsed(session))} (${fmtRate(session.times.length / elapsed(session))} q/s)`}
        note={sessionLabel(session)}
      />
      <QuestionTimesChart session={session} recent={recent} target={target} />
    </Card>
  );
}
