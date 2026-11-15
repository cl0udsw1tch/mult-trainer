import { fmtSeconds, ordinals } from "@/lib/format";
import { mean, questionTimes, rolling } from "@/lib/stats";
import type { Session } from "@/lib/types";
import { Chart } from "./Chart";

const DIGITS = 3;

/** Time on each question of one session, with running and recent averages and the target pace. */
export function QuestionTimesChart({ session, recent, target }: { session: Session; recent: number; target: number }) {
  const times = questionTimes(session);
  return (
    <Chart
      size="lg"
      labels={ordinals(times.length)}
      xTitle="Question"
      yTitle="Seconds"
      format={(v) => fmtSeconds(v, DIGITS)}
      title={(i) => `Question ${i + 1}`}
      footer={(i) => `solved at ${fmtSeconds(session.times[i], DIGITS)}`}
      series={[
        { label: "Question time", data: times, mark: "bars", color: "series1" },
        { label: "Running average", data: rolling(times, Infinity, mean), mark: "line", color: "series2" },
        { label: `Last ${recent} avg`, data: rolling(times, recent, mean), mark: "line", color: "series3" },
        { label: `Target pace (${target} q/s)`, data: times.map(() => 1 / target), mark: "rule", color: "reference" },
      ]}
    />
  );
}

/** Table twin for QuestionTimesChart. */
export function questionTimesTable(session: Session, recent: number) {
  const times = questionTimes(session);
  const running = rolling(times, Infinity, mean);
  const last = rolling(times, recent, mean);
  return {
    columns: ["Question", "Solved at", "Time", "Running avg", `Last ${recent} avg`],
    rows: session.times.map((t, i) => [
      i + 1,
      fmtSeconds(t, DIGITS),
      fmtSeconds(times[i], DIGITS),
      fmtSeconds(running[i], DIGITS),
      fmtSeconds(last[i], DIGITS),
    ]),
  };
}
