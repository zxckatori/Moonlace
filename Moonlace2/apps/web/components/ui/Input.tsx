import { InputHTMLAttributes } from "react";

export function Input({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        width: "100%",
        padding: "10px 12px",
        background: "rgba(5,5,8,0.6)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontSize: "14px",
        ...style,
      }}
      {...props}
    />
  );
}
