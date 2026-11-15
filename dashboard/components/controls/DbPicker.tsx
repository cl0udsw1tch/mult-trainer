"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/Controls";
import { DB_COOKIE, routes } from "@/lib/routes";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type DbChoice = { source: string; dbs: string[]; count: number };

/** Picks which JSON file in data/ every page reads. */
export function DbPicker({ source, dbs, count }: DbChoice) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Select
      label="Database"
      width="lg"
      value={source}
      onChange={(db) => {
        document.cookie = `${DB_COOKIE}=${encodeURIComponent(db)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
        // A session page belongs to one database; it won't exist in another.
        if (pathname.startsWith("/session/")) router.push(routes.history);
        router.refresh();
      }}
      options={dbs.map((d) => ({ value: d, label: d.replace(/\.db\.json$/, "") }))}
      suffix={`${count} sessions`}
    />
  );
}
