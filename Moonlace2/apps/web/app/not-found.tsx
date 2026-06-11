import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
      <h1
        className="glitch-text"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "48px",
          color: "var(--blood)",
          marginBottom: "var(--space-4)",
        }}
      >
        SIGNAL LOST
      </h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-terminal)", fontSize: "20px", marginBottom: "var(--space-4)" }}>
        &gt; transmission interrupted_
      </p>
      <Link href="/" style={{ fontFamily: "var(--font-terminal)", fontSize: "18px" }}>
        ← Вернуться на главную
      </Link>
    </div>
  );
}
