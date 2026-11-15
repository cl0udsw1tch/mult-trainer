"use client";

import { type DbChoice, DbPicker } from "@/components/controls/DbPicker";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { Grid, Row } from "@/components/ui/layout";
import { LinkButton } from "@/components/ui/LinkButton";
import { Text } from "@/components/ui/typography";
import { Page, PageHeader } from "@/components/ui/Page";
import { fmtDate } from "@/lib/format";
import { routes, sessionHref } from "@/lib/routes";
import type { Session } from "@/lib/types";
import { PerSecondCard } from "./PerSecondCard";
import { QuestionTimesCard } from "./QuestionTimesCard";
import { RunningPaceCard } from "./RunningPaceCard";
import { SessionTiles } from "./SessionTiles";
import { WindowCurveCard } from "./WindowCurveCard";

/** One session's stats. `sessions` is every session, oldest first, for comparisons and prev/next. */
export function SessionView({ sessions, index, db }: { sessions: Session[]; index: number; db: DbChoice }) {
  const session = sessions[index];
  const prev = sessions[index - 1];
  const next = sessions[index + 1];

  return (
    <ClientOnly>
      <Page>
        <PageHeader
          title={`Session · ${fmtDate(session.startedAt)}`}
          active="history"
          meta={<DbPicker {...db} />}
        />
        <Text tone="secondary">{`${session.duration}s · lookahead ${session.lookahead} · ${session.status}`}</Text>
        <Row gap="sm" wrap>
          <LinkButton href={prev ? sessionHref(prev) : null}>← Previous</LinkButton>
          <LinkButton href={next ? sessionHref(next) : null}>Next →</LinkButton>
          <LinkButton href={routes.history}>All sessions</LinkButton>
        </Row>
        <SessionTiles session={session} sessions={sessions} />
        <Grid min="card">
          <QuestionTimesCard session={session} />
          <RunningPaceCard session={session} />
          <WindowCurveCard session={session} sessions={sessions} />
          <PerSecondCard session={session} />
        </Grid>
      </Page>
    </ClientOnly>
  );
}
