export type SessionStatus = "completed" | "restarted" | "quit";

export type Session = {
  startedAt: string;
  endedAt: string;
  /** configured length in seconds */
  duration: number;
  /** upcoming questions shown above the current one */
  lookahead: number;
  status: SessionStatus;
  /** seconds since the timer started at which each question was solved, in order */
  times: number[];
};

export type Db = {
  version: 1;
  sessions: Session[];
};
