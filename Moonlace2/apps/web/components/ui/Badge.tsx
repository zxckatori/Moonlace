export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "live" | "muted";
}) {
  const styles = {
    default: { border: "1px solid var(--neon-purple)", color: "var(--neon-purple)" },
    live: {
      border: "1px solid var(--neon-cyan)",
      color: "var(--neon-cyan)",
      background: "rgba(0,240,255,0.1)",
    },
    muted: { border: "1px solid var(--border)", color: "var(--text-muted)" },
  };

  return (
    <span
      className={variant === "live" ? "live-pulse" : ""}
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontFamily: "var(--font-terminal)",
        fontSize: "14px",
        letterSpacing: "0.1em",
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}
