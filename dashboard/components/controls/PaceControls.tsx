"use client";

import { NumberField, Select } from "@/components/ui/Controls";

export const TARGET_PACE = { min: 0.5, max: 10, step: 0.25, initial: 3 } as const;
export const AVERAGE_OVER = { options: [5, 10, 20, 50], initial: 10 } as const;
export const RECENT_QUESTIONS = { options: [3, 5, 10], initial: 5 } as const;

/** The pace (questions per second) a card measures against. */
export function TargetPaceField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <NumberField
      label="Target pace"
      min={TARGET_PACE.min}
      max={TARGET_PACE.max}
      step={TARGET_PACE.step}
      value={value}
      onChange={onChange}
      suffix="q/s"
    />
  );
}

/** How many sessions a trend line averages over. */
export function AverageOverField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Select
      label="Average over"
      value={value}
      onChange={onChange}
      options={AVERAGE_OVER.options.map((n) => ({ value: n, label: String(n) }))}
      suffix="sessions"
    />
  );
}

/** How many of the latest questions a "recent" line averages over. */
export function RecentQuestionsField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Select
      label="Recent"
      value={value}
      onChange={onChange}
      options={RECENT_QUESTIONS.options.map((k) => ({ value: k, label: String(k) }))}
      suffix="questions"
    />
  );
}
