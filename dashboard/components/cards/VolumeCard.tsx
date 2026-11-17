import { Chart } from "@/components/charts/Chart";
import { Card } from "@/components/ui/Card";
import { fmtClock, fmtDay } from "@/lib/format";
import { elapsed, isCompleted, localDay } from "@/lib/stats";
import type { Session } from "@/lib/types";

const NOON = 12;

/** Every calendar day from the first session to the last, including empty days. */
function dayRange(sessions: Session[]) {
  if (!sessions.length) return [];
  const days: string[] = [];
  const d = new Date(sessions[0].startedAt);
  d.setHours(NOON, 0, 0, 0);
  const last = localDay(new Date(sessions[sessions.length - 1].startedAt));
  while (localDay(d) <= last) {
    days.push(localDay(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function VolumeCard({ sessions }: { sessions: Session[] }) {
  const perDay = dayRange(sessions).map((day) => {
    const group = sessions.filter((s) => localDay(new Date(s.startedAt)) === day);
    const done = group.filter(isCompleted).length;
    return { day, done, other: group.length - done, seconds: group.reduce((n, s) => n + elapsed(s), 0) };
  });
  return (
    <Card
      title="Practice volume"
      description="Sessions per day. Not completed covers restarts, quits and runs where you let the clock run out."
      table={{
        columns: ["Day", "Completed", "Not completed", "Time"],
        rows: perDay.map((d) => [d.day, d.done, d.other, fmtClock(d.seconds)]),
      }}
    >
      <Chart
        stacked
        labels={perDay.map((d) => fmtDay(d.day))}
        yTitle="Sessions"
        footer={(i) => `${fmtClock(perDay[i].seconds)} on the clock`}
        series={[
          { label: "Completed", data: perDay.map((d) => d.done), mark: "bars", color: "series1" },
          { label: "Not completed", data: perDay.map((d) => d.other), mark: "bars", color: "muted" },
        ]}
      />
    </Card>
  );
}
