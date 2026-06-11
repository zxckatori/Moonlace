"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/store";

const items = [
  { href: "/", label: "Лента" },
  { href: "/forum", label: "Форум" },
  { href: "/messages", label: "ЛС" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav
      className="bottom-nav"
      style={{
        display: "none",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(5,5,8,0.95)",
        borderTop: "1px solid var(--border)",
        padding: "8px 0",
        zIndex: 100,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .bottom-nav { display: flex !important; justify-content: space-around; }
          .desktop-sidebars { display: none !important; }
          .main-layout { grid-template-columns: 1fr !important; padding-bottom: 60px !important; }
        }
      `}</style>
      {[...items, { href: user ? `/profile/${user.nickname}` : "/login", label: "Профиль" }].map(
        (item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily: "var(--font-terminal)",
              fontSize: "16px",
              color: pathname === item.href ? "var(--neon-cyan)" : "var(--text-muted)",
              padding: "4px 12px",
            }}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}
