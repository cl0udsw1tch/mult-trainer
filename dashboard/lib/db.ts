import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { DB_COOKIE } from "./routes";
import { byStart } from "./stats";
import type { Db } from "./types";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");
const DB_EXTENSION = ".db.json";
const FALLBACK_DB = `sessions${DB_EXTENSION}`;

/** Every database in data/; the .db.json extension tells them apart from other JSON. */
async function listDbs() {
  const files = await readdir(DATA_DIR);
  return files.filter((f) => f.endsWith(DB_EXTENSION)).sort();
}

/**
 * Reads the selected database fresh on every request so new sessions show up
 * on refresh. The selection comes from a cookie set by the header dropdown,
 * then DEFAULT_DB, then sessions.db.json. Only names found in data/ are used, so
 * the cookie can't point the server at an arbitrary path.
 */
export async function loadSessions() {
  const dbs = await listDbs();
  const picked = (await cookies()).get(DB_COOKIE)?.value;
  const source = [picked, process.env.DEFAULT_DB, FALLBACK_DB].find((n) => n && dbs.includes(n)) ?? dbs[0];
  if (!source) return { sessions: [], source: FALLBACK_DB, dbs };
  const db: Db = JSON.parse(await readFile(path.join(DATA_DIR, source), "utf8"));
  return { sessions: [...db.sessions].sort(byStart), source, dbs };
}
