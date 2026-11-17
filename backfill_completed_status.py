#!/usr/bin/env python3
"""Fix runs saved as "quit" that actually ran their full duration.

Before the fix in script.py, a run left idle until its time ran out and then
exited with Ctrl-C was saved as "quit". The timer had expired, so it should
be "completed" (the dashboard then shows it as "ran the clock" if you'd
stopped answering). Safe to run more than once; only matching runs change.

Usage:
    python3 backfill_completed_status.py            # show what would change
    python3 backfill_completed_status.py --write    # apply it
    python3 backfill_completed_status.py --db data/other.db.json --write
"""

import argparse
from datetime import datetime
from pathlib import Path

from script import DB_PATH, read_sessions, write_sessions

# endedAt is stored to the millisecond, so allow for rounding.
TOLERANCE_SECONDS = 0.002


def ran_full_duration(session: dict) -> bool:
    elapsed = (
        datetime.fromisoformat(session["endedAt"])
        - datetime.fromisoformat(session["startedAt"])
    ).total_seconds()
    return elapsed >= session["duration"] - TOLERANCE_SECONDS


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--db", type=Path, default=DB_PATH, help="database file (default: %(default)s)")
    parser.add_argument("--write", action="store_true", help="save the changes (default: dry run)")
    args = parser.parse_args()

    sessions = read_sessions(args.db)
    fixed = [s for s in sessions if s["status"] == "quit" and ran_full_duration(s)]

    for session in fixed:
        print(f'{session["startedAt"]}  {session["duration"]}s  quit -> completed')
        session["status"] = "completed"

    print(f"{len(fixed)} of {len(sessions)} sessions {'fixed' if args.write else 'would change'} in {args.db}")

    if fixed and args.write:
        write_sessions(sessions, args.db)
    elif fixed:
        print("Dry run: nothing saved. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
