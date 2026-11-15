"use client";

import { type ReactNode, useState } from "react";
import { Button } from "./Controls";
import { DataTable, type TableView } from "./DataTable";
import { Box, Col, Row } from "./layout";
import { Heading, Text } from "./typography";

/** A dashboard card. Every card with a chart passes `table`, its accessible twin. */
export function Card({
  title,
  description,
  span = "auto",
  table,
  controls,
  children,
}: {
  title: string;
  description?: ReactNode;
  span?: "auto" | "full";
  table?: TableView;
  controls?: ReactNode;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Box span={span}>
      <Col gap="md">
        <Col gap="xs">
          <Row justify="between" align="start" gap="sm">
            <Heading level={2}>{title}</Heading>
            {table && <Button onClick={() => setShowTable((v) => !v)}>{showTable ? "Chart" : "Table"}</Button>}
          </Row>
          {description && (
            <Text block size="sm" tone="secondary">
              {description}
            </Text>
          )}
        </Col>
        {controls && (
          <Row gap="md" align="center" wrap>
            {controls}
          </Row>
        )}
        {showTable && table ? <DataTable {...table} /> : children}
      </Col>
    </Box>
  );
}
