import { HistoryView } from "@/components/history/HistoryView";
import { loadSessions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sessions, source, dbs } = await loadSessions();
  return <HistoryView sessions={sessions} db={{ source, dbs, count: sessions.length }} />;
}
