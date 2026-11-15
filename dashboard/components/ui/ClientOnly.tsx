"use client";

import { type ReactNode, useEffect, useState } from "react";

/** Renders children only in the browser: dates and "last N days" depend on the viewer's clock and locale. */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}
