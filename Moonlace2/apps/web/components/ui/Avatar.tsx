export function Avatar({
  url,
  nickname,
  size = 40,
}: {
  url?: string | null;
  nickname: string;
  size?: number;
}) {
  const initial = nickname[0]?.toUpperCase() || "?";
  return url ? (
    <img
      src={url}
      alt={nickname}
      width={size}
      height={size}
      style={{ borderRadius: "4px", border: "1px solid var(--border)", objectFit: "cover" }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "4px",
        border: "1px solid var(--neon-purple)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-terminal)",
        fontSize: size * 0.45,
        color: "var(--neon-purple)",
        background: "var(--abyss)",
      }}
    >
      {initial}
    </div>
  );
}
