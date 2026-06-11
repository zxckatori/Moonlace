"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LiveWidget } from "@/components/stream/LiveWidget";

interface LiveStream {
  userId: string;
  title?: string;
  category?: string;
  thumbnailUrl?: string;
  user: { nickname: string; avatarUrl?: string | null };
}

interface ListeningEntry {
  trackTitle: string;
  artist?: string;
  user: { nickname: string; avatarUrl?: string | null };
}

export function RightSidebar() {
  const [live, setLive] = useState<LiveStream[]>([]);
  const [listening, setListening] = useState<ListeningEntry[]>([]);

  useEffect(() => {
    api<LiveStream[]>("/streams/live").then(setLive).catch(console.error);
    api<ListeningEntry[]>("/audio/now-listening/all").then(setListening).catch(console.error);
  }, []);

  return (
    <aside
      style={{
        padding: "var(--space-3)",
        borderLeft: "1px solid var(--border)",
        minWidth: "240px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <section>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", color: "var(--neon-cyan)", marginBottom: "var(--space-2)" }}>
          СЕЙЧАС В ЭФИРЕ
        </h2>
        {live.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Никто не стримит</p>
        ) : (
          live.map((s) => (
            <LiveWidget key={s.userId} stream={s} compact />
          ))
        )}
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", color: "var(--neon-purple)", marginBottom: "var(--space-2)" }}>
          СЛУШАЮТ
        </h2>
        {listening.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Тишина в эфире</p>
        ) : (
          listening.map((entry, i) => (
            <Link
              key={i}
              href={`/profile/${entry.user.nickname}`}
              style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}
            >
              <Avatar url={entry.user.avatarUrl} nickname={entry.user.nickname} size={28} />
              <div style={{ fontSize: "12px" }}>
                <div>{entry.user.nickname}</div>
                <div style={{ color: "var(--text-muted)" }}>
                  {entry.artist ? `${entry.artist} — ` : ""}{entry.trackTitle}
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </aside>
  );
}
