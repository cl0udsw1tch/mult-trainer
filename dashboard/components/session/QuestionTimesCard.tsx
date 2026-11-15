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
import type { Session } from "@/lib/types";

export function QuestionTimesCard({ session }: { session: Session }) {
  const [recent, setRecent] = useState<number>(RECENT_QUESTIONS.initial);
  const [target, setTarget] = useState<number>(TARGET_PACE.initial);
  return (
    <Card
      span="full"
      title="Time per question"
      description="Bars below the target line were faster than the target pace. Question 1 is short because you see it before the timer starts."
      controls={
        <>
          <RecentQuestionsField value={recent} onChange={setRecent} />
          <TargetPaceField value={target} onChange={setTarget} />
        </>
      }
      table={questionTimesTable(session, recent)}
    >
      <QuestionTimesChart session={session} recent={recent} target={target} />
    </Card>
  );
}
