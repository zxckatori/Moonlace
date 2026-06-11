import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MiniPlayer } from "@/components/audio/MiniPlayer";

interface FeedEvent {
  id: string;
  type: string;
  payload: Record<string, string>;
  createdAt: string;
  user: { nickname: string; avatarUrl?: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  FORUM_POST: "написал в",
  NEW_TOPIC: "создал тему",
  WALL_POST: "опубликовал в профиле",
  GALLERY: "добавил в галерею",
  LISTENING: "слушает",
  STREAM_LIVE: "в эфире",
};

export function ActivityCard({ event }: { event: FeedEvent }) {
  const p = event.payload;
  let link = `/profile/${event.user.nickname}`;
  let detail = "";

  switch (event.type) {
    case "FORUM_POST":
    case "NEW_TOPIC":
      link = `/forum/${p.categorySlug}/${p.topicSlug || ""}`;
      detail = `${p.categoryName} → "${p.topicTitle || p.title}"`;
      break;
    case "LISTENING":
      detail = `${p.artist ? p.artist + " — " : ""}${p.trackTitle}`;
      break;
    case "STREAM_LIVE":
      detail = `"${p.title}" — ${p.category || "Эфир"}`;
      break;
    case "WALL_POST":
      detail = p.preview || "";
      break;
    case "GALLERY":
      detail = "новый медиа-файл";
      break;
  }

  return (
    <article style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <Avatar url={event.user.avatarUrl} nickname={event.user.nickname} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href={`/profile/${event.user.nickname}`} style={{ fontWeight: 700 }}>
            {event.user.nickname}
          </Link>
          <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-terminal)", fontSize: "16px" }}>
            {TYPE_LABELS[event.type] || event.type}
          </span>
          {event.type === "STREAM_LIVE" && <Badge variant="live">ЭФИР</Badge>}
        </div>
        {event.type === "LISTENING" ? (
          <div style={{ marginTop: "8px" }}>
            <MiniPlayer
              trackTitle={p.trackTitle}
              artist={p.artist}
              embedUrl={p.embedUrl}
            />
          </div>
        ) : detail ? (
          <Link href={link} style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
            {detail}
          </Link>
        ) : null}
        <time style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-terminal)" }}>
          {new Date(event.createdAt).toLocaleString("ru-RU")}
        </time>
      </div>
    </article>
  );
}
