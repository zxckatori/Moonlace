import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ variant = "primary", children, style, ...props }: Props) {
  const variants = {
    primary: {
      background: "transparent",
      border: "1px solid var(--neon-cyan)",
      color: "var(--neon-cyan)",
    },
    ghost: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--text-muted)",
    },
    danger: {
      background: "transparent",
      border: "1px solid var(--blood)",
      color: "var(--blood)",
    },
  };

  return (
    <button
      style={{
        padding: "8px 16px",
        fontFamily: "var(--font-terminal)",
        fontSize: "16px",
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "all 0.2s",
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
