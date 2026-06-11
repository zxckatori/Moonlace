"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ActivityCard } from "@/components/feed/ActivityCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { getSocket } from "@/lib/ws";
import { useAuth } from "@/lib/store";

interface FeedEvent {
  id: string;
  type: string;
  payload: Record<string, string>;
  createdAt: string;
  user: { nickname: string; avatarUrl?: string | null };
}

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [filter, setFilter] = useState("all");

  const load = (f: string) => {
    api<{ events: FeedEvent[] }>(`/feed?filter=${f}`).then((r) => setEvents(r.events)).catch(console.error);
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("feed:update", (event: FeedEvent) => {
      if (filter === "all" || event.type.toLowerCase().includes(filter)) {
        setEvents((prev) => [event, ...prev].slice(0, 50));
      }
    });
    return () => { socket.off("feed:update"); };
  }, [filter]);

  return (
    <div>
      <Card
        style={{
          marginBottom: "var(--space-4)",
          textAlign: "center",
          padding: "var(--space-5)",
          borderColor: "var(--neon-purple)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 32px)",
            letterSpacing: "0.12em",
            marginBottom: "var(--space-2)",
          }}
          className="glow-purple"
        >
          Добро пожаловать в Moonlace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          {user
            ? `Привет, ${user.nickname}! Здесь собираются сигналы из пустоты — посты, музыка, стримы и разговоры. Приятно, что ты с нами ✦`
            : "Тихий уголок в неоновой пустоте. Заходи, общайся, делись музыкой и находи своих — мы рады каждому новому сигналу ✦"}
        </p>
      </Card>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          letterSpacing: "0.15em",
          marginBottom: "var(--space-3)",
        }}
        className="glow-cyan"
      >
        ЛЕНТА АКТИВНОСТИ
      </h2>
      <FeedFilters active={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
        {events.length === 0 ? (
          <Card>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-terminal)", fontSize: "18px" }}>
              &gt; Сигналов пока нет — будь первым
            </p>
          </Card>
        ) : (
          events.map((e) => (
            <Card key={e.id}>
              <ActivityCard event={e} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
