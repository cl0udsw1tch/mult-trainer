// Generates data/mock-sessions.db.json: ~2 months of plausible practice so the
// dashboard has something to render. Seeded, so re-running is reproducible.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Session, SessionStatus } from "../lib/types.ts";

const OUT = fileURLToPath(new URL("../../data/mock-sessions.db.json", import.meta.url));
const DAYS = 60;
const END = new Date("2026-11-14T21:00:00");

let seed = 1234567;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = <T>(weighted: [T, number][]) => {
  let r = rand() * weighted.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of weighted) if ((r -= w) <= 0) return value;
  return weighted[0][0];
};
const gaussian = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

// Seconds of recall on top of typing; ordered pairs differ on purpose.
function difficulty(a: number, b: number) {
  const hard = new Set([6, 7, 8, 9]);
  let d = 0.25;
  if (a === 2 || b === 2 || a === 5 || b === 5) d = 0.12;
  else if (a === b) d = 0.18;
  else if (hard.has(a) && hard.has(b)) d = 0.48;
  if (a === 7 && b === 8) d += 0.2;
  if (a === 6 && b === 7) d += 0.12;
  if (a === 9 && b === 6) d += 0.1;
  return d;
}

// Seeing the next question early lets recall start before the current one is typed.
const lookaheadSpeed: Record<number, number> = { 0: 1.18, 1: 1, 2: 0.96 };

function simulate(start: Date, duration: number, lookahead: number, day: number, attempt: number): Session {
  // ~2.2 q/s at the start of the period, ~3 q/s by the end (10s sessions).
  const skill = 1 + 0.4 * (1 - Math.exp(-day / 25));
  const warmup = 1 + 0.14 * Math.exp(-(attempt - 1) / 1.4);
  const lateNight = start.getHours() >= 23 || start.getHours() < 6 ? 1.1 : 1;
  const status = pick<SessionStatus>([
    ["completed", 84],
    ["restarted", 12],
    ["quit", 4],
  ]);
  const cutoffMs =
    status === "completed" ? duration * 1000 : randInt(800, Math.min(duration * 1000, 4500));

  // Facts and wrong digits shape the timing but aren't stored: the database
  // only keeps when each question was solved.
  const times: number[] = [];
  let t = 0;
  for (let i = 0; ; i++) {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const digits = String(a * b).length;
    const typing = 0.11 * digits;
    // Roughly 15% slower by the one-minute mark.
    const fatigue = 1 + 0.0025 * (t / 1000);
    // The first question is visible before the timer starts, so only typing counts.
    const recall = i === 0 ? 0 : 0.03 + difficulty(a, b) * 0.62;
    const seconds =
      ((recall + typing) / skill) *
      lookaheadSpeed[lookahead] *
      warmup *
      lateNight *
      fatigue *
      Math.exp(0.25 * gaussian());
    const misses = rand() < (0.02 + difficulty(a, b) * 0.15) / skill ? randInt(1, 2) : 0;
    t += Math.round((seconds + misses * 0.15) * 1000);
    if (t >= cutoffMs) break;
    times.push(t / 1000);
  }

  const elapsedMs = status === "completed" ? duration * 1000 : cutoffMs;
  const iso = (d: Date) => {
    const off = -d.getTimezoneOffset();
    const local = new Date(d.getTime() + off * 60000).toISOString().slice(0, 23);
    const sign = off >= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
    const mm = String(Math.abs(off) % 60).padStart(2, "0");
    return `${local}${sign}${hh}:${mm}`;
  };
  return {
    startedAt: iso(start),
    endedAt: iso(new Date(start.getTime() + elapsedMs)),
    duration,
    lookahead,
    status,
    times,
  };
}

const sessions: Session[] = [];
for (let day = 0; day < DAYS; day++) {
  if (rand() > 0.72) continue;
  const date = new Date(END.getTime() - (DAYS - 1 - day) * 86400000);
  const sittings = rand() < 0.3 ? 2 : 1;
  for (let sitting = 0; sitting < sittings; sitting++) {
    const clock = new Date(date);
    clock.setHours(sitting === 0 ? randInt(7, 13) : randInt(18, 23), randInt(0, 59), randInt(0, 59));
    const attempts = randInt(3, 9);
    const lookahead = pick([
      [1, 80],
      [2, 12],
      [0, 8],
    ]);
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const duration = pick([
        [10, 85],
        [30, 5],
        [60, 10],
      ]);
      const session = simulate(clock, duration, lookahead, day, attempt);
      sessions.push(session);
      clock.setTime(Date.parse(session.endedAt) + randInt(4, 40) * 1000);
    }
  }
}

const body = sessions.map((s) => "  " + JSON.stringify(s)).join(",\n");
writeFileSync(OUT, `{"version": 1, "sessions": [\n${body}\n]}\n`);
console.log(`wrote ${sessions.length} sessions to ${OUT}`);
