export function MiniPlayer({
  trackTitle,
  artist,
  embedUrl,
}: {
  trackTitle: string;
  artist?: string;
  embedUrl?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        border: "1px solid var(--neon-purple)",
        borderRadius: "4px",
        background: "rgba(176,38,255,0.08)",
        fontSize: "13px",
      }}
    >
      <span style={{ fontFamily: "var(--font-terminal)", color: "var(--neon-purple)" }}>♫</span>
      <span>
        {artist ? `${artist} — ` : ""}
        {trackTitle}
      </span>
      {embedUrl && (
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", fontSize: "11px" }}>
          open
        </a>
      )}
    </div>
  );
}
