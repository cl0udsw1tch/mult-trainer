import { Grid } from "@/components/ui/layout";
import { Delta, StatTile } from "@/components/ui/Stat";
import { fmtClock, fmtDate, fmtRate, fmtSeconds } from "@/lib/format";
import { argmax, elapsed, median, pps, questionTimes } from "@/lib/stats";
import type { Session } from "@/lib/types";

/** Sessions compared for "recent pace": the last N against the N before. */
const RECENT = 10;

export function SummaryTiles({ sessions, completed }: { sessions: Session[]; completed: Session[] }) {
  const rates = completed.map(pps);
  const best = argmax(rates);
  const recent = median(rates.slice(-RECENT));
  const previous = median(rates.slice(-2 * RECENT, -RECENT));
  const solved = sessions.reduce((n, s) => n + s.times.length, 0);
  // Question 1 is excluded: it's seen before the timer starts.
  const typical = median(sessions.flatMap((s) => questionTimes(s).slice(1)));

  return (
    <Grid min="tile" gap="md">
      <StatTile
        label="Sessions"
        value={completed.length}
        sub={`completed · ${sessions.length - completed.length} restarted/quit`}
      />
      <StatTile
        label="Recent pace"
        value={`${fmtRate(recent)} q/s`}
        sub={
          <>
            median of last {RECENT} · <Delta value={recent - previous} format={fmtRate} suffix={`vs prior ${RECENT}`} />
          </>
        }
      />
      <StatTile
        label="Best session"
        value={best >= 0 ? `${fmtRate(rates[best])} q/s` : "–"}
        sub={
          best >= 0
            ? `${completed[best].times.length} in ${completed[best].duration}s · ${fmtDate(completed[best].startedAt)}`
            : "no completed sessions"
        }
      />
      <StatTile label="Typical question" value={fmtSeconds(typical, 2)} sub="median time per question" />
      <StatTile label="Questions solved" value={solved.toLocaleString()} sub="all sessions in view" />
      <StatTile
        label="Practice time"
        value={fmtClock(sessions.reduce((n, s) => n + elapsed(s), 0))}
        sub="time on the clock"
      />
    </Grid>
  );
}
