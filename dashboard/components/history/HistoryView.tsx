"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { type DbChoice, DbPicker } from "@/components/controls/DbPicker";
import { useSessionFilters } from "@/components/controls/SessionFilters";
import { Card } from "@/components/ui/Card";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { DataTable, type SortState } from "@/components/ui/DataTable";
import { EmptyState, Page, PageHeader } from "@/components/ui/Page";
import { fmtDate, fmtRate, fmtSeconds } from "@/lib/format";
import { sessionHref } from "@/lib/routes";
import { median, questionTimes, rateOf } from "@/lib/stats";
import type { Session } from "@/lib/types";

const DIGITS = 2;

type Row = {
  session: Session;
  start: number;
  solved: number;
  rate: number;
  median: number;
  slowest: number;
};

function toRow(session: Session): Row {
  // Question 1 is excluded from timing: it's seen before the timer starts.
  const times = questionTimes(session).slice(1);
  return {
    session,
    start: Date.parse(session.startedAt),
    solved: session.times.length,
    rate: rateOf(session),
    median: median(times),
    slowest: times.length ? Math.max(...times) : NaN,
  };
}

/** Column order, labels, cell rendering, and (where sortable) the value to sort by. */
const COLUMNS: { label: string; cell: (r: Row) => ReactNode; sortBy?: (r: Row) => number }[] = [
  {
    label: "When",
    cell: (r) => (
      <Link href={sessionHref(r.session)} className="table-link">
        {fmtDate(r.session.startedAt)}
      </Link>
    ),
    sortBy: (r) => r.start,
  },
  { label: "Length", cell: (r) => `${r.session.duration}s`, sortBy: (r) => r.session.duration },
  { label: "Lookahead", cell: (r) => r.session.lookahead, sortBy: (r) => r.session.lookahead },
  { label: "Status", cell: (r) => r.session.status },
  { label: "Solved", cell: (r) => r.solved, sortBy: (r) => r.solved },
  { label: "q/s", cell: (r) => fmtRate(r.rate), sortBy: (r) => r.rate },
  { label: "Median question", cell: (r) => fmtSeconds(r.median, DIGITS), sortBy: (r) => r.median },
  { label: "Slowest question", cell: (r) => fmtSeconds(r.slowest, DIGITS), sortBy: (r) => r.slowest },
];
const SORTABLE = COLUMNS.flatMap((c, i) => (c.sortBy ? [i] : []));
const DEFAULT_SORT: SortState = { column: 0, direction: "desc" };

export function HistoryView({ sessions, db }: { sessions: Session[]; db: DbChoice }) {
  const router = useRouter();
  const { filtered, toolbar } = useSessionFilters(sessions);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const rows = useMemo(() => {
    const by = COLUMNS[sort.column].sortBy ?? COLUMNS[DEFAULT_SORT.column].sortBy!;
    const sign = sort.direction === "asc" ? 1 : -1;
    // NaN (e.g. no timed questions) sorts last in either direction.
    const key = (r: Row) => (Number.isFinite(by(r)) ? by(r) : sign * Infinity);
    return filtered.map(toRow).sort((a, b) => sign * (key(a) - key(b)));
  }, [filtered, sort]);

  const onSort = (column: number) =>
    setSort((s) =>
      s.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "desc" },
    );

  return (
    <ClientOnly>
      <Page>
        <PageHeader title="History" active="history" meta={<DbPicker {...db} />} />
        {sessions.length === 0 ? (
          <EmptyState>No sessions yet. Play a round with python3 script.py and refresh.</EmptyState>
        ) : (
          <>
            {toolbar(true)}
            <Card
              title={`${rows.length} sessions`}
              description="Click a session to see its stats. Click a column heading to sort."
            >
              <DataTable
                height="full"
                columns={COLUMNS.map((c) => c.label)}
                rows={rows.map((r) => COLUMNS.map((c) => c.cell(r)))}
                sortable={SORTABLE}
                sort={sort}
                onSort={onSort}
                onRowClick={(i) => router.push(sessionHref(rows[i].session))}
              />
            </Card>
          </>
        )}
      </Page>
    </ClientOnly>
  );
}
