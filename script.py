#!/usr/bin/env python3

import argparse
import curses
import json
import random
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

LOOKAHEAD = 1  # number of upcoming problems shown above the current one
MIN_FACTOR = 2
MAX_FACTOR = 9
DEFAULT_DURATION = 10.0
DB_PATH = Path(__file__).resolve().parent / "data" / "sessions.db.json"

RESTART_KEYS = (ord("-"),)


@dataclass(frozen=True)
class Problem:
    a: int
    b: int

    @property
    def answer(self) -> str:
        return str(self.a * self.b)

    @property
    def text(self) -> str:
        return f"{self.a} × {self.b}"


class MultiplicationTrainer:
    def __init__(self, duration: float):
        self.duration = duration

        self.current = self._new_problem()
        self.upcoming = deque(self._new_problem() for _ in range(LOOKAHEAD))
        self.last_answer = ""

        self.input_buffer = ""

        self.completed = 0
        self.errors = 0
        self.attempts = 0
        self.correct_keys = 0

        self.start_time = None
        self.end_time = None
        self.started_at = None  # wall clock, for the session record
        self.exit = None  # "quit" | "restart" when the run is cut short
        self.timed_out = False

        self.times = []  # seconds since start at which each question was solved

    def _new_problem(self) -> Problem:
        return Problem(
            random.randint(MIN_FACTOR, MAX_FACTOR),
            random.randint(MIN_FACTOR, MAX_FACTOR),
        )

    def _advance(self):
        self.last_answer = self.current.answer
        self.upcoming.append(self._new_problem())
        self.current = self.upcoming.popleft()
        self.input_buffer = ""

    def elapsed(self) -> float:
        if self.start_time is None:
            return 0.0

        end = self.end_time if self.end_time is not None else time.perf_counter()

        return min(end - self.start_time, self.duration)

    def check_timeout(self) -> bool:
        if self.start_time is None or self.elapsed() < self.duration:
            return False

        self.end_time = self.start_time + self.duration
        self.timed_out = True
        return True

    def start(self):
        self.start_time = time.perf_counter()
        self.started_at = datetime.now().astimezone()

    def ppm(self) -> float:
        return self.attempts / self.duration * 60.0

    def accuracy(self) -> float:
        keys = self.correct_keys + self.errors
        if keys == 0:
            return 100.0

        return self.correct_keys / keys * 100.0

    def time_remaining(self) -> float:
        if self.start_time is None:
            return self.duration

        return max(0.0, self.duration - self.elapsed())

    def handle_digit(self, digit: str):
        answer = self.current.answer
        position = len(self.input_buffer)

        if digit != answer[position]:
            self.errors += 1
            return

        self.correct_keys += 1
        self.input_buffer += digit

        if len(self.input_buffer) == len(answer):
            self.completed += 1
            self.attempts += 1
            self.times.append(round(time.perf_counter() - self.start_time, 3))
            self._advance()

    def handle_backspace(self):
        self.input_buffer = self.input_buffer[:-1]

    def status(self) -> str:
        if self.timed_out:
            return "completed"

        return "quit" if self.exit == "quit" else "restarted"

    def to_record(self) -> dict:
        # The loop only notices the timeout on the next keypress, so a run left
        # idle past its duration and then exited (e.g. Ctrl-C) still counts.
        self.check_timeout()
        if self.end_time is None:
            self.end_time = time.perf_counter()

        elapsed = self.duration if self.timed_out else self.elapsed()

        return {
            "startedAt": self.started_at.isoformat(timespec="milliseconds"),
            "endedAt": (self.started_at + timedelta(seconds=elapsed)).isoformat(
                timespec="milliseconds"
            ),
            "duration": self.duration,
            "lookahead": LOOKAHEAD,
            "status": self.status(),
            "times": self.times,
        }


def read_sessions(path: Path) -> list:
    if not path.exists():
        return []

    return json.loads(path.read_text())["sessions"]


def write_sessions(sessions: list, path: Path):
    # One session per line keeps the committed file's diffs readable.
    body = ",\n".join(
        "  " + json.dumps(session, separators=(",", ":")) for session in sessions
    )

    path.parent.mkdir(exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text('{"version": 1, "sessions": [\n' + body + "\n]}\n")
    tmp.replace(path)


def save_session(trainer: MultiplicationTrainer):
    # A run that never received its first digit never started; nothing to log.
    if trainer.start_time is None:
        return

    write_sessions(read_sessions(DB_PATH) + [trainer.to_record()], DB_PATH)


def draw(stdscr, trainer: MultiplicationTrainer):
    stdscr.erase()

    height, width = stdscr.getmaxyx()

    title = "Multiplication — Lookahead"

    stdscr.addstr(
        1,
        max(0, (width - len(title)) // 2),
        title,
        curses.A_BOLD,
    )

    y = 3

    # Furthest upcoming problem at the top, nearest right above current.
    for problem in reversed(trainer.upcoming):
        text = problem.text
        stdscr.addstr(
            y,
            max(0, (width - len(text)) // 2),
            text,
            curses.A_DIM,
        )
        y += 1

    current_text = trainer.current.text
    stdscr.addstr(
        y,
        max(0, (width - len(current_text)) // 2),
        current_text,
        curses.A_REVERSE,
    )

    y += 1

    if trainer.input_buffer:
        input_text, attr = trainer.input_buffer, curses.A_NORMAL
    elif trainer.last_answer:
        input_text, attr = trainer.last_answer, curses.A_DIM
    else:
        input_text, attr = "_", curses.A_NORMAL

    stdscr.addstr(
        y,
        max(0, (width - len(input_text)) // 2),
        input_text,
        attr,
    )

    y += 3

    remaining = trainer.time_remaining()

    stats = (
        f"Time: {remaining:05.1f}s    "
        f"Score: {trainer.completed:.1f}    "
        f"Accuracy: {trainer.accuracy():.1f}%"
    )

    stdscr.addstr(
        y,
        max(0, (width - len(stats)) // 2),
        stats,
    )

    y += 2

    instructions = "Numpad: answer    Backspace: undo    R: restart    Esc: quit"

    stdscr.addstr(
        y,
        max(0, (width - len(instructions)) // 2),
        instructions,
        curses.A_DIM,
    )

    stdscr.refresh()


def run_test(stdscr, duration: float):
    trainer = MultiplicationTrainer(duration)

    curses.curs_set(0)
    stdscr.keypad(True)
    stdscr.nodelay(False)

    try:
        _run_loop(stdscr, trainer)
    except KeyboardInterrupt:
        trainer.exit = "quit"

    return trainer


def _run_loop(stdscr, trainer: MultiplicationTrainer):
    while True:
        draw(stdscr, trainer)

        if trainer.check_timeout():
            return

        key = stdscr.getch()

        # Checked before acting on Esc/restart so a key pressed after time ran
        # out still records the run as completed.
        timed_out = trainer.check_timeout()

        if key == 27:
            trainer.exit = "quit"
            return

        if key in RESTART_KEYS:
            trainer.exit = "restart"
            return

        if timed_out:
            return

        if trainer.start_time is None:
            if ord("0") <= key <= ord("9"):
                trainer.start()
            else:
                continue

        if ord("0") <= key <= ord("9"):
            trainer.handle_digit(chr(key))

        elif key in (curses.KEY_BACKSPACE, 127, 8):
            trainer.handle_backspace()


def show_results(stdscr, trainer):
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        stdscr.erase()

        height, width = stdscr.getmaxyx()

        score = trainer.ppm()
        accuracy = trainer.accuracy()

        lines = [
            "RESULT",
            "",
            f"{score:.1f} PPM",
            "",
            f"Correct:  {trainer.completed}",
            f"Errors:   {trainer.errors}",
            f"Accuracy: {accuracy:.1f}%",
            "",
            "R  Restart",
        ]

        start_y = max(0, (height - len(lines)) // 2)

        for i, line in enumerate(lines):
            x = max(0, (width - len(line)) // 2)

            if i == 2:
                stdscr.addstr(
                    start_y + i,
                    x,
                    line,
                    curses.A_BOLD,
                )
            else:
                stdscr.addstr(
                    start_y + i,
                    x,
                    line,
                )

        stdscr.refresh()

        key = stdscr.getch()

        if key in RESTART_KEYS:
            return "restart"


def main():
    parser = argparse.ArgumentParser(description="Multiplication sprint trainer")
    parser.add_argument(
        "-d",
        "--duration",
        type=float,
        default=DEFAULT_DURATION,
        help="session length in seconds (default: %(default)s)",
    )
    args = parser.parse_args()

    try:
        while True:
            trainer = curses.wrapper(run_test, args.duration)
            save_session(trainer)

            if trainer.exit == "quit":
                break

            if trainer.exit == "restart":
                continue

            curses.wrapper(lambda stdscr: show_results(stdscr, trainer))

    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
