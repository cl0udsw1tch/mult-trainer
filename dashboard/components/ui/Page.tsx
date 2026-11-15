import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";
import { Box, Col, Row } from "./layout";
import { Heading, Text } from "./typography";

const navItems = [
  { key: "overview", label: "Overview", href: routes.overview },
  { key: "history", label: "History", href: routes.history },
] as const;
type NavKey = (typeof navItems)[number]["key"];

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="page">
      <Col gap="lg">{children}</Col>
    </main>
  );
}

export function PageHeader({ title, meta, active }: { title: string; meta?: ReactNode; active?: NavKey }) {
  return (
    <Col gap="sm">
      <Row gap="md" align="center">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="nav-link"
            aria-current={item.key === active ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </Row>
      <Row justify="between" align="baseline" gap="sm" wrap>
        <Heading level={1}>{title}</Heading>
        {meta}
      </Row>
    </Col>
  );
}

/** One row of filters that scope everything below it. */
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <Row gap="lg" align="center" wrap>
      {children}
    </Row>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Box padding="xxl">
      <Col align="center">
        <Text tone="secondary">{children}</Text>
      </Col>
    </Box>
  );
}
