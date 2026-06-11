"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/store";

interface Theme {
  id: string;
  name: string;
  accentColor: string;
  fontFamily: string;
  backgroundColor?: string;
  usageCount: number;
  rating: number;
  author: { nickname: string; avatarUrl?: string | null };
}

export default function ThemesPage() {
  const { user } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    accentColor: "#b026ff",
    fontFamily: "Space Mono",
    isPublic: true,
    scanlineIntensity: 0.04,
  });

  useEffect(() => {
    api<Theme[]>("/themes?public=true").then(setThemes).catch(console.error);
  }, []);

  const create = async () => {
    await api("/themes", { method: "POST", body: JSON.stringify(form) });
    setShowCreate(false);
    api<Theme[]>("/themes?public=true").then(setThemes);
  };

  const apply = async (id: string) => {
    await api(`/themes/${id}/apply`, { method: "POST" });
    alert("Тема применена к профилю!");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontFamily: "var(--font-editorial)", fontSize: "28px" }}>Темы оформления</h1>
        {user && <Button onClick={() => setShowCreate(!showCreate)}>+ Создать</Button>}
      </div>

      {showCreate && (
        <Card style={{ marginBottom: "16px" }}>
          <Input placeholder="Название темы" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }}>
            <label>Акцент: <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} /></label>
            <select
              value={form.fontFamily}
              onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
              style={{ padding: "8px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {["Space Mono", "VT323", "Orbitron", "Cinzel"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div
            style={{
              marginTop: "12px",
              padding: "16px",
              border: `1px solid ${form.accentColor}`,
              fontFamily: form.fontFamily,
              background: "var(--abyss)",
            }}
          >
            Preview: Moonlace
          </div>
          <Button onClick={create} style={{ marginTop: "12px" }}>Опубликовать</Button>
        </Card>
      )}

      <div style={{ display: "grid", gap: "12px" }}>
        {themes.map((t) => (
          <Card key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: t.fontFamily as string, color: t.accentColor }}>{t.name}</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  <Avatar url={t.author.avatarUrl} nickname={t.author.nickname} size={24} />
                  <Link href={`/profile/${t.author.nickname}`} style={{ fontSize: "12px" }}>{t.author.nickname}</Link>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {t.usageCount} использований · ★ {t.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              {user && <Button onClick={() => apply(t.id)}>Применить</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
