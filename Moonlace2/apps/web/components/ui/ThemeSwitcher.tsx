"use client";

import { SITE_THEMES, useAppearance } from "@/components/providers/AppearanceProvider";

export function ThemeSwitcher() {
  const { siteTheme, view, customMeta, customVisible, setSiteTheme, selectCustom } = useAppearance();

  const items: { id: string; label: string; active: boolean; onClick: () => void }[] = [
    ...SITE_THEMES.map((t) => ({
      id: t.id,
      label: t.label,
      active: view === "site" && siteTheme === t.id,
      onClick: () => setSiteTheme(t.id),
    })),
  ];

  if (customMeta && customVisible) {
    items.push({
      id: "custom",
      label: customMeta.name.length > 12 ? `${customMeta.name.slice(0, 11)}…` : customMeta.name,
      active: view === "custom",
      onClick: selectCustom,
    });
  }

  return (
    <div
      role="group"
      aria-label="Тема оформления"
      style={{
        display: "flex",
        gap: "2px",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        overflow: "hidden",
        fontFamily: "var(--font-terminal)",
        fontSize: "13px",
        maxWidth: "100%",
        flexWrap: "wrap",
      }}
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={t.onClick}
          aria-pressed={t.active}
          className="btn-action"
          style={{
            padding: "4px 8px",
            border: "none",
            cursor: "pointer",
            background: t.active ? "var(--neon-purple)" : "transparent",
            color: t.active ? "var(--void)" : "var(--text-muted)",
            transition: "background 0.2s, color 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
