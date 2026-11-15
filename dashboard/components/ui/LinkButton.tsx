import Link from "next/link";
import type { ReactNode } from "react";

/** A navigation link that looks like a control button. Disabled when there's nowhere to go. */
export function LinkButton({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) {
    return (
      <span className="control-button" aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link className="control-button" href={href}>
      {children}
    </Link>
  );
}
