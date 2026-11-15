"use client";

import type { ReactNode } from "react";
import { Row } from "./layout";
import { Text } from "./typography";

/** A labelled control; the label sits inline before it. */
export function Field({ label, suffix, children }: { label: string; suffix?: ReactNode; children: ReactNode }) {
  return (
    <label>
      <Row gap="sm" align="center">
        <Text size="sm" tone="secondary">
          {label}
        </Text>
        {children}
        {suffix != null && (
          <Text size="sm" tone="secondary" numeric>
            {suffix}
          </Text>
        )}
      </Row>
    </label>
  );
}

export function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button className="control-button" onClick={onClick}>
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.value)} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Select<T extends string | number>({
  label,
  options,
  value,
  onChange,
  width = "sm",
  suffix,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  width?: "sm" | "lg";
  suffix?: ReactNode;
}) {
  return (
    <Field label={label} suffix={suffix}>
      <select
        className={`control-input control-${width}`}
        value={String(value)}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          if (picked) onChange(picked.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: ReactNode;
}) {
  return (
    <Field label={label} suffix={suffix}>
      <input
        className="control-slider"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function NumberField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: ReactNode;
}) {
  return (
    <Field label={label} suffix={suffix}>
      <input
        className="control-input control-sm"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= min && v <= max) onChange(v);
        }}
      />
    </Field>
  );
}
