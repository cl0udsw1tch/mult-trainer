"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/Controls";
import { Toolbar } from "@/components/ui/Page";
import { type Outcome, outcome } from "@/lib/stats";
import type { Session } from "@/lib/types";

const DAY_MS = 86_400_000;
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number] | "all";
type Status = "all" | "completed" | "ran-clock" | "cut-short";

const matchesStatus = (status: Status, how: Outcome) =>
  status === "all" ||
  status === how ||
  (status === "cut-short" && (how === "restarted" || how === "quit"));

const distinct = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

/** Filters that scope every view on a page: session length, lookahead, date range, and optionally status. */
export function useSessionFilters(all: Session[]) {
  const [length, setLength] = useState<number | "all">("all");
  const [lookahead, setLookahead] = useState<number | "all">("all");
  const [range, setRange] = useState<Range>("all");
  const [status, setStatus] = useState<Status>("all");

  const filtered = useMemo(() => {
    const cutoff = range === "all" ? -Infinity : Date.now() - range * DAY_MS;
    return all.filter(
      (s) =>
        (length === "all" || s.duration === length) &&
        (lookahead === "all" || s.lookahead === lookahead) &&
        matchesStatus(status, outcome(s)) &&
        Date.parse(s.startedAt) >= cutoff,
    );
  }, [all, length, lookahead, range, status]);

  const lengths = useMemo(() => distinct(all.map((s) => s.duration)), [all]);
  const lookaheads = useMemo(() => distinct(all.map((s) => s.lookahead)), [all]);

  const toolbar = (withStatus: boolean) => (
    <Toolbar>
      <Segmented
        label="Length"
        value={length}
        onChange={setLength}
        options={[{ value: "all" as const, label: "All" }, ...lengths.map((l) => ({ value: l, label: `${l}s` }))]}
      />
      <Segmented
        label="Lookahead"
        value={lookahead}
        onChange={setLookahead}
        options={[{ value: "all" as const, label: "All" }, ...lookaheads.map((l) => ({ value: l, label: String(l) }))]}
      />
      <Segmented
        label="Range"
        value={range}
        onChange={setRange}
        options={[...RANGES.map((d) => ({ value: d as Range, label: `${d}d` })), { value: "all" as Range, label: "All" }]}
      />
      {withStatus && (
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all" as Status, label: "All" },
            { value: "completed" as Status, label: "Completed" },
            { value: "ran-clock" as Status, label: "Ran the clock" },
            { value: "cut-short" as Status, label: "Restarted/quit" },
          ]}
        />
      )}
    </Toolbar>
  );

  return { filtered, toolbar };
}
