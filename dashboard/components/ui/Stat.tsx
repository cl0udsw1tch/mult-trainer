import type { ReactNode } from "react";
import { Box, Col, Row } from "./layout";
import { Text } from "./typography";

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Box padding="md">
      <Col gap="xs">
        <Text size="sm" tone="secondary">
          {label}
        </Text>
        <Text size="stat" weight="bold">
          {value}
        </Text>
        {sub && (
          <Text size="xs" tone="muted">
            {sub}
          </Text>
        )}
      </Col>
    </Box>
  );
}

const heroSize = { md: "stat", lg: "hero" } as const;

/** The one number a card is about, with what it means and where it came from. */
export function Hero({
  value,
  label,
  note,
  size = "lg",
}: {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  size?: keyof typeof heroSize;
}) {
  return (
    <Row gap="sm" align="baseline" wrap>
      <Text size={heroSize[size]} weight="bold">
        {value}
      </Text>
      <Text tone="secondary">{label}</Text>
      {note && <Text tone="muted">· {note}</Text>}
    </Row>
  );
}

/** A signed change, colored good when up. */
export function Delta({ value, format, suffix }: { value: number; format: (v: number) => string; suffix: string }) {
  if (!Number.isFinite(value)) return <>–</>;
  return (
    <Text size="xs" tone={value >= 0 ? "good" : "bad"}>
      {value >= 0 ? "▲" : "▼"} {format(Math.abs(value))} {suffix}
    </Text>
  );
}
