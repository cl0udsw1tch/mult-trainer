import type { ReactNode } from "react";

const space = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export type Space = keyof typeof space;

const radius = { sm: 6, md: 8, lg: 12 } as const;
type Radius = keyof typeof radius;

/** Minimum column widths for auto-fitting grids. */
const columnMin = { tile: 160, card: 440 } as const;

const align = { start: "flex-start", center: "center", end: "flex-end", baseline: "baseline", stretch: "stretch" } as const;
const justify = { start: "flex-start", between: "space-between", end: "flex-end" } as const;

type FlexProps = {
  direction?: "row" | "column";
  gap?: Space;
  align?: keyof typeof align;
  justify?: keyof typeof justify;
  wrap?: boolean;
  children: ReactNode;
};

export function Flex({
  direction = "row",
  gap = "none",
  align: a = "stretch",
  justify: j = "start",
  wrap = false,
  children,
}: FlexProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap: space[gap],
        alignItems: align[a],
        justifyContent: justify[j],
        flexWrap: wrap ? "wrap" : "nowrap",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

export function Row(props: Omit<FlexProps, "direction">) {
  return <Flex direction="row" {...props} />;
}

export function Col(props: Omit<FlexProps, "direction">) {
  return <Flex direction="column" {...props} />;
}

/** As many columns of at least `min` as fit; one column on phones. */
export function Grid({ min, gap = "lg", children }: { min: keyof typeof columnMin; gap?: Space; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${columnMin[min]}px, 100%), 1fr))`,
        gap: space[gap],
      }}
    >
      {children}
    </div>
  );
}

/** A raised panel on the page plane. `span="full"` stretches across an enclosing Grid. */
export function Box({
  padding = "lg",
  rounded = "lg",
  span = "auto",
  children,
}: {
  padding?: Space;
  rounded?: Radius;
  span?: "auto" | "full";
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: radius[rounded],
        padding: space[padding],
        gridColumn: span === "full" ? "1 / -1" : undefined,
        minWidth: 0,
      }}
    >
      {children}
    </section>
  );
}
