#!/usr/bin/env python3

import curses
import random
import time
from dataclasses import dataclass


MIN_FACTOR = 2
MAX_FACTOR = 9
TEST_DURATION = 30.0

RESTART_KEYS = (ord("r"), ord("R"))


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
    def __init__(self):
        self.current = self._new_problem()
        self.next_problem = self._new_problem()

        self.input_buffer = ""

        self.completed = 0
        self.errors = 0
        self.attempts = 0

        self.start_time = None
        self.end_time = None

    def _new_problem(self) -> Problem:
        return Problem(
            random.randint(MIN_FACTOR, MAX_FACTOR),
            random.randint(MIN_FACTOR, MAX_FACTOR),
        )

    def _advance(self):
        self.current = self.next_problem
        self.next_problem = self._new_problem()
        self.input_buffer = ""

    def elapsed(self) -> float:
        if self.start_time is None:
            return 0.0

        end = (
            self.end_time
            if self.end_time is not None
            else time.perf_counter()
        )

        return min(end - self.start_time, TEST_DURATION)

    def ppm(self) -> float:
        return self.attempts / TEST_DURATION * 60.0

    def accuracy(self) -> float:
        if self.attempts == 0:
            return 100.0

        return self.completed / self.attempts * 100.0

    def time_remaining(self) -> float:
        if self.start_time is None:
            return TEST_DURATION

        return max(0.0, TEST_DURATION - self.elapsed())

    def handle_digit(self, digit: str):
        answer = self.current.answer
        position = len(self.input_buffer)

        if digit != answer[position]:
            return

        self.input_buffer += digit

        if len(self.input_buffer) == len(answer):
            self.completed += 1
            self.attempts += 1
            self._advance()

    def handle_backspace(self):
        self.input_buffer = self.input_buffer[:-1]


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

    next_text = trainer.next_problem.text
    stdscr.addstr(
        y,
        max(0, (width - len(next_text)) // 2),
        next_text,
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

    input_text = trainer.input_buffer or "_"
    stdscr.addstr(
        y,
        max(0, (width - len(input_text)) // 2),
        input_text,
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


def run_test(stdscr):
    trainer = MultiplicationTrainer()

    curses.curs_set(0)
    stdscr.keypad(True)
    stdscr.nodelay(False)

    while True:
        draw(stdscr, trainer)

        if (
            trainer.start_time is not None
            and trainer.elapsed() >= TEST_DURATION
        ):
            trainer.end_time = trainer.start_time + TEST_DURATION
            break

        key = stdscr.getch()

        if key == 27:
            return None

        if key in RESTART_KEYS:
            return "restart"

        if trainer.start_time is None:
            if ord("0") <= key <= ord("9"):
                trainer.start_time = time.perf_counter()
            else:
                continue

        if trainer.elapsed() >= TEST_DURATION:
            trainer.end_time = trainer.start_time + TEST_DURATION
            break

        if ord("0") <= key <= ord("9"):
            trainer.handle_digit(chr(key))

        elif key in (curses.KEY_BACKSPACE, 127, 8):
            trainer.handle_backspace()

    return trainer


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
    try:
        while True:
            result = curses.wrapper(run_test)

            if result is None:
                break

            if result == "restart":
                continue

            curses.wrapper(lambda stdscr: show_results(stdscr, result))

    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
