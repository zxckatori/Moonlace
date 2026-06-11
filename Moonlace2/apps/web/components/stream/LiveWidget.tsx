import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface StreamData {
  userId: string;
  title?: string | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  user?: { nickname: string; avatarUrl?: string | null };
}

export function LiveWidget({
  stream,
  compact = false,
  full = false,
}: {
  stream: StreamData;
  compact?: boolean;
  full?: boolean;
}) {
  const nickname = stream.user?.nickname ?? "stream";
  const avatarUrl = stream.user?.avatarUrl;

  return (
    <Link
      href={`/profile/${nickname}`}
      style={{
        display: "block",
        marginBottom: "var(--space-2)",
        border: "1px solid var(--neon-cyan)",
        borderRadius: "4px",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      {stream.thumbnailUrl && (
        <img
          src={stream.thumbnailUrl}
          alt=""
          style={{ width: "100%", aspectRatio: full ? "16/9" : "16/9", objectFit: "cover", display: "block" }}
        />
      )}
      <div style={{ padding: compact ? "8px" : "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Avatar url={avatarUrl} nickname={nickname} size={24} />
          <span style={{ fontFamily: "var(--font-terminal)", fontSize: "16px" }}>{nickname}</span>
          <Badge variant="live">ЭФИР</Badge>
        </div>
        {stream.title && (
          <div style={{ fontSize: "13px", marginBottom: "2px" }}>{stream.title}</div>
        )}
        {stream.category && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stream.category}</div>
        )}
      </div>
    </Link>
  );
}
