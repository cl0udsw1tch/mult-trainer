import { Grid } from "@/components/ui/layout";
import { Delta, StatTile } from "@/components/ui/Stat";
import { fmtRate, fmtSeconds, outcomeLabel } from "@/lib/format";
import {
  argmax,
  byStart,
  elapsed,
  isCompleted,
  mean,
  median,
  outcome,
  pps,
  questionTimes,
  rateOf,
  stdDev,
} from "@/lib/stats";
import type { Session } from "@/lib/types";

/** How many earlier same-length sessions the pace is compared against. */
const BASELINE = 10;
const DIGITS = 2;

export function SessionTiles({ session, sessions }: { session: Session; sessions: Session[] }) {
  const done = isCompleted(session);
  const how = outcomeLabel[outcome(session)];
  const peers = sessions.filter((s) => isCompleted(s) && s.duration === session.duration);
  const earlier = peers.filter((s) => byStart(s, session) < 0).slice(-BASELINE);
  const baseline = mean(earlier.map(pps));
  const rank = 1 + peers.filter((s) => pps(s) > pps(session)).length;

  // Question 1 is excluded from timing: it's seen before the timer starts.
  const times = questionTimes(session).slice(1);
  const fastest = times.length ? times.indexOf(Math.min(...times)) : -1;
  const slowest = argmax(times);

  return (
    <Grid min="tile" gap="md">
      <StatTile
        label="Solved"
        value={session.times.length}
        sub={`in ${fmtSeconds(elapsed(session))}${done ? "" : ` · ${how}`}`}
      />
      <StatTile
        label="Pace"
        value={`${fmtRate(rateOf(session))} q/s`}
        sub={
          done && earlier.length ? (
            <Delta
              value={pps(session) - baseline}
              format={fmtRate}
              suffix={`vs your average over the ${earlier.length} sessions before`}
            />
          ) : (
            "no earlier sessions to compare"
          )
        }
      />
      <StatTile
        label="Rank"
        value={done ? `#${rank}` : "–"}
        sub={done ? `of ${peers.length} completed ${session.duration}s sessions` : `not ranked: ${how}`}
      />
      <StatTile
        label="Median question"
        value={fmtSeconds(median(times), DIGITS)}
        sub={`± ${fmtSeconds(stdDev(times), DIGITS)} spread`}
      />
      <StatTile
        label="Fastest question"
        value={fastest >= 0 ? fmtSeconds(times[fastest], DIGITS) : "–"}
        sub={fastest >= 0 ? `question ${fastest + 2}` : undefined}
      />
      <StatTile
        label="Slowest question"
        value={slowest >= 0 ? fmtSeconds(times[slowest], DIGITS) : "–"}
        sub={slowest >= 0 ? `question ${slowest + 2}` : undefined}
      />
    </Grid>
  );
}
