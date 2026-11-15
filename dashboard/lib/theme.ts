"use client";

import { useEffect, useState } from "react";

export type Tokens = {
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  grid: string;
  axis: string;
  series1: string;
  series2: string;
  series3: string;
  dots: string;
};

function read(): Tokens {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: v("--surface"),
    textPrimary: v("--text-primary"),
    textSecondary: v("--text-secondary"),
    textMuted: v("--text-muted"),
    grid: v("--grid"),
    axis: v("--axis"),
    series1: v("--series-1"),
    series2: v("--series-2"),
    series3: v("--series-3"),
    dots: v("--dots"),
  };
}

/** Resolved color tokens; null until mounted. Re-reads when the OS theme flips. */
export function useTokens(): Tokens | null {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setTokens(read());
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return tokens;
}
