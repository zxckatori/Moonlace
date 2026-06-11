import { ReactNode, CSSProperties } from "react";

export function Card({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`card-hover ${className}`}
      style={{
        background: "var(--surface)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "var(--space-3)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
