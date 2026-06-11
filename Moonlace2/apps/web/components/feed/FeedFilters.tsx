"use client";

const FILTERS = [
  { id: "all", label: "Всё" },
  { id: "forum", label: "Форум" },
  { id: "music", label: "Музыка" },
  { id: "streams", label: "Стримы" },
  { id: "gallery", label: "Галерея" },
  { id: "wall", label: "Стена" },
];

export function FeedFilters({
  active,
  onChange,
}: {
  active: string;
  onChange: (f: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          style={{
            padding: "4px 12px",
            background: active === f.id ? "rgba(176,38,255,0.2)" : "transparent",
            border: `1px solid ${active === f.id ? "var(--neon-purple)" : "var(--border)"}`,
            color: active === f.id ? "var(--neon-purple)" : "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "var(--font-terminal)",
            fontSize: "16px",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
