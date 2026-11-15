import type { ReactNode } from "react";

const size = { xs: 12, sm: 13, md: 14, lg: 15, xl: 22, stat: 26, hero: 32 } as const;
const weight = { regular: 400, medium: 500, bold: 600 } as const;
const lineHeight = 1.35;

export const tone = {
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted: "var(--text-muted)",
  good: "var(--good)",
  bad: "var(--bad)",
} as const;
export type Tone = keyof typeof tone;

export function Text({
  size: s = "md",
  tone: t = "primary",
  weight: w = "regular",
  numeric = false,
  block = false,
  children,
}: {
  size?: keyof typeof size;
  tone?: Tone;
  weight?: keyof typeof weight;
  /** Equal-width digits, for numbers that line up in columns. */
  numeric?: boolean;
  /** Render as a paragraph rather than inline. */
  block?: boolean;
  children: ReactNode;
}) {
  const Tag = block ? "p" : "span";
  return (
    <Tag
      style={{
        margin: 0,
        fontSize: size[s],
        color: tone[t],
        fontWeight: weight[w],
        fontVariantNumeric: numeric ? "tabular-nums" : undefined,
        lineHeight,
      }}
    >
      {children}
    </Tag>
  );
}

const headingSize = { 1: size.xl, 2: size.lg } as const;

export function Heading({ level, children }: { level: keyof typeof headingSize; children: ReactNode }) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag style={{ margin: 0, fontSize: headingSize[level], fontWeight: weight.bold, lineHeight }}>
      {children}
    </Tag>
  );
}
