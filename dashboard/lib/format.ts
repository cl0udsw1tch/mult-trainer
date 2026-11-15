import type { Session } from "./types";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const fmtRate = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "–");

export const fmtSeconds = (v: number, digits = 1) => (Number.isFinite(v) ? `${v.toFixed(digits)}s` : "–");

export const fmtClock = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};

export const sessionLabel = (s: Session) =>
  `${fmtDate(s.startedAt)} · ${s.duration}s · lookahead ${s.lookahead}${s.status === "completed" ? "" : ` · ${s.status}`}`;

/** Tooltip title for the i-th session of a list. */
export const sessionTitle = (sessions: Session[], i: number) => `#${i + 1} · ${sessionLabel(sessions[i])}`;

export { ordinals } from "./stats";
