import type { Session } from "./types";

/** URL-safe session id: its start time in epoch milliseconds. */
export const sessionId = (s: Session) => String(Date.parse(s.startedAt));

export const sessionHref = (s: Session) => `/session/${sessionId(s)}`;

export const routes = { overview: "/", history: "/history" } as const;

export const DB_COOKIE = "db";
