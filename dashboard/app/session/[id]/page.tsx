import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/SessionView";
import { loadSessions } from "@/lib/db";
import { sessionId } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sessions, source, dbs } = await loadSessions();
  const index = sessions.findIndex((s) => sessionId(s) === id);
  if (index < 0) notFound();
  return <SessionView sessions={sessions} index={index} db={{ source, dbs, count: sessions.length }} />;
}
