"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ActivityCard } from "@/components/feed/ActivityCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { getSocket } from "@/lib/ws";

interface FeedEvent {
  id: string;
  type: string;
  payload: Record<string, string>;
  createdAt: string;
  user: { nickname: string; avatarUrl?: string | null };
}

export default function HomePage() {
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
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          letterSpacing: "0.15em",
          marginBottom: "var(--space-4)",
        }}
        className="glow-cyan"
      >
        ЛЕНТА АКТИВНОСТИ
      </h1>
      <FeedFilters active={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {events.length === 0 ? (
          <Card>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-terminal)", fontSize: "18px" }}>
              &gt; NO SIGNALS DETECTED_
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
