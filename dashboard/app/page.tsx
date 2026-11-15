import Dashboard from "@/components/Dashboard";
import { loadSessions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sessions, source, dbs } = await loadSessions();
  return <Dashboard sessions={sessions} db={{ source, dbs, count: sessions.length }} />;
}
