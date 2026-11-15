"use client";

import { useMemo } from "react";
import { BestWindowCard } from "@/components/cards/BestWindowCard";
import { HoldCard } from "@/components/cards/HoldCard";
import { LongestRunCard } from "@/components/cards/LongestRunCard";
import { PaceBySecondCard } from "@/components/cards/PaceBySecondCard";
import { PositionCard } from "@/components/cards/PositionCard";
import { ProgressCard } from "@/components/cards/ProgressCard";
import { SessionExplorerCard } from "@/components/cards/SessionExplorerCard";
import { SummaryTiles } from "@/components/cards/SummaryTiles";
import { TimeOfDayCard } from "@/components/cards/TimeOfDayCard";
import { VolumeCard } from "@/components/cards/VolumeCard";
import { WarmupCard } from "@/components/cards/WarmupCard";
import { type DbChoice, DbPicker } from "@/components/controls/DbPicker";
import { useSessionFilters } from "@/components/controls/SessionFilters";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { Grid } from "@/components/ui/layout";
import { EmptyState, Page, PageHeader } from "@/components/ui/Page";
import { attemptNumbers, isCompleted } from "@/lib/stats";
import type { Session } from "@/lib/types";

export default function Dashboard({ sessions, db }: { sessions: Session[]; db: DbChoice }) {
  // Attempt numbers come from every session so filtering doesn't renumber a sitting.
  const attempts = useMemo(() => attemptNumbers(sessions), [sessions]);
  const { filtered, toolbar } = useSessionFilters(sessions);
  const completed = useMemo(() => filtered.filter(isCompleted), [filtered]);

  return (
    <ClientOnly>
      <Page>
        <PageHeader title="Multiplication trainer" active="overview" meta={<DbPicker {...db} />} />
        {sessions.length === 0 ? (
          <EmptyState>No sessions yet. Play a round with python3 script.py and refresh.</EmptyState>
        ) : (
          <>
            {toolbar(false)}
            <SummaryTiles sessions={filtered} completed={completed} />
            <Grid min="card">
              <ProgressCard completed={completed} />
              <HoldCard sessions={filtered} />
              <LongestRunCard sessions={filtered} />
              <SessionExplorerCard sessions={filtered} completed={completed} />
              <BestWindowCard sessions={filtered} />
              <PositionCard completed={completed} />
              <PaceBySecondCard completed={completed} />
              <WarmupCard completed={completed} attempts={attempts} />
              <VolumeCard sessions={filtered} />
              <TimeOfDayCard completed={completed} />
            </Grid>
          </>
        )}
      </Page>
    </ClientOnly>
  );
}
