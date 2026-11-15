import type { Session } from "./types";

// Everything here is derived from a session's `times`: the cumulative second
// at which each question was solved. Question i (0-based) appeared when
// question i - 1 was solved, or at 0 for the first.

export const isCompleted = (s: Session) => s.status === "completed";

/** Seconds on the clock: the full duration, or until the run was cut short. */
export const elapsed = (s: Session) => (Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000;

export const pps = (s: Session) => s.times.length / s.duration;

export const byStart = (x: Session, y: Session) => Date.parse(x.startedAt) - Date.parse(y.startedAt);

export function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((x, y) => x - y);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export const median = (values: number[]) => quantile(values, 0.5);

export const mean = (values: number[]) =>
  values.length === 0 ? NaN : values.reduce((sum, v) => sum + v, 0) / values.length;

export const argmax = (values: number[]) =>
  values.length === 0 ? -1 : values.indexOf(Math.max(...values));

/** When question i appeared. */
const appeared = (times: number[], i: number) => (i === 0 ? 0 : times[i - 1]);

/**
 * Seconds spent on each question. The first is short: it's on screen before
 * the timer starts (the timer starts on the first digit).
 */
export const questionTimes = (s: Session) => s.times.map((t, i) => t - appeared(s.times, i));

export type Window = { count: number; start: number };

/**
 * Most questions fully solved inside any `seconds`-long span. Windows start
 * when a question appears, so every counted question was worked on entirely
 * inside the window.
 */
export function bestInWindow(s: Session, seconds: number): Window {
  const { times } = s;
  let best: Window = { count: 0, start: 0 };
  let end = 0;
  for (let k = 0; k < times.length; k++) {
    const start = appeared(times, k);
    end = Math.max(end, k);
    while (end < times.length && times[end] - start <= seconds) end++;
    if (end - k > best.count) best = { count: end - k, start };
  }
  return best;
}

export type Run = { count: number; seconds: number; start: number };

/**
 * Longest stretch of consecutive questions whose average rate is at least
 * `rate` questions per second. Slow questions are allowed inside the run as
 * long as the fast ones around them keep the average up.
 */
export function longestRun(s: Session, rate: number): Run {
  const { times } = s;
  let best: Run = { count: 0, seconds: 0, start: 0 };
  for (let k = 0; k < times.length; k++) {
    const start = appeared(times, k);
    for (let m = k; m < times.length; m++) {
      const count = m - k + 1;
      const seconds = times[m] - start;
      if (count < rate * seconds) continue;
      if (count > best.count || (count === best.count && seconds < best.seconds)) {
        best = { count, seconds, start };
      }
    }
  }
  return best;
}

/**
 * How long, from the start, the session stayed ahead of a steady `rate` q/s
 * pace line: the n-th question must be solved by n / rate seconds. Once a
 * question misses its deadline the pace line has caught up, and the hold ends
 * at the previous deadline.
 */
export function holdFromStart(s: Session, rate: number): number {
  for (let i = 0; i < s.times.length; i++) {
    if (s.times[i] > (i + 1) / rate) return i / rate;
  }
  return Math.min(elapsed(s), s.times.length / rate);
}

export function rolling(values: number[], n: number, fn: (window: number[]) => number) {
  return values.map((_, i) => fn(values.slice(Math.max(0, i - n + 1), i + 1)));
}

/** Running maximum, used for personal-best step lines. */
export function runningMax(values: number[]) {
  let best = -Infinity;
  return values.map((v) => (best = Math.max(best, v)));
}

/** Average questions solved in each 1-second slice of completed sessions. */
export function paceBySecond(sessions: Session[]) {
  const maxSeconds = Math.max(0, ...sessions.map((s) => Math.ceil(s.duration)));
  const buckets = Array.from({ length: maxSeconds }, () => ({ solves: 0, sessions: 0 }));
  for (const s of sessions) {
    for (let sec = 0; sec < Math.ceil(s.duration); sec++) buckets[sec].sessions++;
    for (const t of s.times) {
      const sec = Math.floor(t);
      if (sec < buckets.length) buckets[sec].solves++;
    }
  }
  return buckets.map((b, sec) => ({
    second: sec + 1,
    rate: b.sessions ? b.solves / b.sessions : NaN,
    sessions: b.sessions,
  }));
}

/**
 * Average time for the n-th question across sessions. Starts at question 2,
 * since question 1 is seen before the timer starts. Positions reached by
 * fewer than `minSessions` sessions are dropped as noise.
 */
export function timeByPosition(sessions: Session[], minSessions = 5) {
  const sums: { total: number; n: number }[] = [];
  for (const s of sessions) {
    questionTimes(s).forEach((seconds, i) => {
      if (i === 0) return;
      sums[i] ??= { total: 0, n: 0 };
      sums[i].total += seconds;
      sums[i].n++;
    });
  }
  return sums
    .map((b, i) => (b ? { position: i + 1, mean: b.total / b.n, sessions: b.n } : null))
    .filter((p): p is NonNullable<typeof p> => p !== null && p.sessions >= minSessions);
}

const SITTING_GAP_MS = 30 * 60 * 1000;

/**
 * Attempt number of each session within its sitting (a run of sessions with
 * no gap over 30 minutes), keyed by startedAt. Restarted and quit runs count
 * as attempts.
 */
export function attemptNumbers(sessions: Session[]): Map<string, number> {
  const out = new Map<string, number>();
  let attempt = 0;
  let lastEnd = -Infinity;
  for (const s of [...sessions].sort(byStart)) {
    const start = Date.parse(s.startedAt);
    attempt = start - lastEnd > SITTING_GAP_MS ? 1 : attempt + 1;
    lastEnd = Date.parse(s.endedAt);
    out.set(s.startedAt, attempt);
  }
  return out;
}

export const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const ordinals = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/** Questions per second over the time actually played (restarted/quit runs included). */
export const rateOf = (s: Session) => (elapsed(s) > 0 ? s.times.length / elapsed(s) : NaN);

export function stdDev(values: number[]) {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Best count for every whole-second window length from 1s up to `maxSeconds`. */
export const windowCurve = (s: Session, maxSeconds: number) =>
  ordinals(maxSeconds).map((seconds) => bestInWindow(s, seconds).count);

/**
 * Pace so far after each question, measured from when question 1 was solved
 * so its head start doesn't inflate the early values. Null for question 1.
 */
export const runningPace = (s: Session) =>
  s.times.map((t, i) => (i === 0 || t === s.times[0] ? null : i / (t - s.times[0])));

/** Pace over the last k questions, once there are k of them. */
export const recentPace = (s: Session, k: number) =>
  s.times.map((t, i) => (i < k ? null : k / (t - s.times[i - k])));

/** Questions solved in each second of one session. */
export function perSecond(s: Session) {
  const counts = new Array<number>(Math.max(1, Math.ceil(elapsed(s)))).fill(0);
  for (const t of s.times) counts[Math.min(counts.length - 1, Math.floor(t))]++;
  return counts;
}
