"use client";

import Link from "next/link";
import { useAuth } from "@/lib/store";
import { Avatar } from "@/components/ui/Avatar";

export function Header() {
  const { user, unreadMessages, logout } = useAuth();

  return (
    <header
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "var(--space-3) var(--space-4)",
        borderBottom: "1px solid var(--border)",
        background: "rgba(5,5,8,0.8)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <nav style={{ display: "flex", gap: "var(--space-3)", fontFamily: "var(--font-terminal)", fontSize: "18px" }}>
        <Link href="/">Лента</Link>
        <Link href="/forum">Форум</Link>
        <Link href="/themes">Темы</Link>
      </nav>

      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(18px, 3vw, 28px)",
          letterSpacing: "0.3em",
          color: "var(--text)",
          textAlign: "center",
        }}
        className="glow-purple"
      >
        M O O N L A C E
      </Link>

      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", justifyContent: "flex-end" }}>
        {user ? (
          <>
            <Link href="/messages" style={{ position: "relative" }}>
              ЛС
              {unreadMessages > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -12,
                    background: "var(--blood)",
                    color: "#fff",
                    fontSize: "10px",
                    padding: "2px 5px",
                    borderRadius: "8px",
                  }}
                >
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link href="/settings" style={{ fontFamily: "var(--font-terminal)", fontSize: "18px" }}>
              ⚙
            </Link>
            <Link href={`/profile/${user.nickname}`}>
              <Avatar url={user.avatarUrl} nickname={user.nickname} size={32} />
            </Link>
            <button
              onClick={() => logout()}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-terminal)",
                fontSize: "16px",
              }}
            >
              выход
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Вход</Link>
            <Link href="/register" style={{ color: "var(--neon-cyan)" }}>
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
