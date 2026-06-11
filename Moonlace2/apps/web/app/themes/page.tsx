"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getUploadUrl } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/store";
import { useToast } from "@/components/providers/ToastProvider";
import { refreshUserTheme } from "@/components/providers/UserThemeApplier";

const PRESET_FONTS = ["Space Mono", "VT323", "Orbitron", "Cinzel"] as const;

interface Theme {
  id: string;
  name: string;
  accentColor: string;
  fontFamily: string;
  fontUrl?: string | null;
  backgroundColor?: string | null;
  backgroundUrl?: string | null;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  scanlineIntensity: number;
  author: { nickname: string; avatarUrl?: string | null };
}

type Tab = "public" | "mine";

export default function ThemesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("public");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [customFontName, setCustomFontName] = useState("");
  const [useCustomFont, setUseCustomFont] = useState(false);
  const [form, setForm] = useState({
    name: "",
    accentColor: "#b026ff",
    backgroundColor: "#050508",
    fontFamily: "Space Mono",
    isPublic: true,
    scanlineIntensity: 0.04,
  });

  const loadThemes = () => {
    if (tab === "mine" && user) {
      api<Theme[]>("/themes/mine").then(setThemes).catch(console.error);
    } else {
      api<Theme[]>("/themes?public=true").then(setThemes).catch(console.error);
    }
  };

  useEffect(() => {
    loadThemes();
  }, [tab, user]);

  const uploadThemeFont = async (themeId: string, file: File, fontName: string) => {
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("accessToken");
    const q = fontName.trim() ? `?fontName=${encodeURIComponent(fontName.trim())}` : "";
    const res = await fetch(getUploadUrl(`/themes/${themeId}/font${q}`), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === "string" ? err.error : "Ошибка загрузки шрифта");
    }
    return res.json();
  };

  const create = async () => {
    const name = form.name.trim();
    if (name.length < 2) {
      showToast("Название темы: минимум 2 символа", "error");
      return;
    }
    if (useCustomFont && !fontFile) {
      showToast("Выберите файл шрифта (.woff, .woff2, .ttf, .otf)", "error");
      return;
    }
    try {
      const created = await api<Theme>("/themes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          name,
          fontFamily: useCustomFont ? (customFontName.trim() || "CustomFont") : form.fontFamily,
        }),
      });
      if (useCustomFont && fontFile) {
        await uploadThemeFont(created.id, fontFile, customFontName.trim() || fontFile.name.replace(/\.[^.]+$/, ""));
      }
      setShowCreate(false);
      setFontFile(null);
      setCustomFontName("");
      setUseCustomFont(false);
      setForm({ name: "", accentColor: "#b026ff", backgroundColor: "#050508", fontFamily: "Space Mono", isPublic: true, scanlineIntensity: 0.04 });
      showToast(form.isPublic ? "Тема опубликована" : "Тема создана");
      setTab("mine");
      loadThemes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка создания", "error");
    }
  };

  const apply = async (id: string) => {
    try {
      await api(`/themes/${id}/apply`, { method: "POST" });
      refreshUserTheme();
      showToast("Тема применена ко всему сайту");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    try {
      await api(`/themes/${id}`, { method: "PATCH", body: JSON.stringify({ isPublic: !isPublic }) });
      showToast(!isPublic ? "Тема опубликована" : "Тема скрыта");
      loadThemes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  };

  const previewFont = useCustomFont && customFontName.trim()
    ? customFontName.trim()
    : useCustomFont && fontFile
      ? fontFile.name.replace(/\.[^.]+$/, "")
      : form.fontFamily;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontFamily: "var(--font-editorial)", fontSize: "28px" }}>Темы оформления</h1>
        {user && <Button onClick={() => setShowCreate(!showCreate)}>+ Создать тему</Button>}
      </div>

      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-3)", fontSize: "14px" }}>
        Цвета и шрифт применяются ко всему сайту. Можно загрузить свой шрифт (.woff, .woff2, .ttf, .otf).
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "var(--space-4)" }}>
        <button type="button" onClick={() => setTab("public")} style={{ padding: "6px 14px", background: tab === "public" ? "rgba(176,38,255,0.2)" : "transparent", border: `1px solid ${tab === "public" ? "var(--neon-purple)" : "var(--border)"}`, color: tab === "public" ? "var(--neon-purple)" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-terminal)", fontSize: "16px" }}>
          Публичные
        </button>
        {user && (
          <button type="button" onClick={() => setTab("mine")} style={{ padding: "6px 14px", background: tab === "mine" ? "rgba(176,38,255,0.2)" : "transparent", border: `1px solid ${tab === "mine" ? "var(--neon-purple)" : "var(--border)"}`, color: tab === "mine" ? "var(--neon-purple)" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-terminal)", fontSize: "16px" }}>
            Мои темы
          </button>
        )}
      </div>

      {showCreate && (
        <Card style={{ marginBottom: "16px" }}>
          <Input placeholder="Название темы (мин. 2 символа)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <label>Акцент: <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} /></label>
            <label>Фон: <input type="color" value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })} /></label>
          </div>

          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "13px", marginBottom: "8px", color: "var(--text-muted)" }}>Шрифт</p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "8px" }}>
              <input type="radio" checked={!useCustomFont} onChange={() => setUseCustomFont(false)} />
              Из списка
            </label>
            {!useCustomFont && (
              <select
                value={form.fontFamily}
                onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                style={{ padding: "8px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)", width: "100%", maxWidth: "280px" }}
              >
                {PRESET_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginTop: "10px", marginBottom: "8px" }}>
              <input type="radio" checked={useCustomFont} onChange={() => setUseCustomFont(true)} />
              Загрузить свой шрифт
            </label>
            {useCustomFont && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Input placeholder="Название шрифта (необязательно)" value={customFontName} onChange={(e) => setCustomFontName(e.target.value)} />
                <input
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                  onChange={(e) => setFontFile(e.target.files?.[0] || null)}
                />
                {fontFile && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Файл: {fontFile.name}</span>}
              </div>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", fontSize: "13px" }}>
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
            Опубликовать для всех
          </label>
          <div style={{ marginTop: "12px", padding: "16px", border: `1px solid ${form.accentColor}`, fontFamily: previewFont, background: form.backgroundColor, color: "var(--text)" }}>
            Превью: Moonlace
          </div>
          <Button onClick={create} style={{ marginTop: "12px" }}>
            {form.isPublic ? "Создать и опубликовать" : "Создать тему"}
          </Button>
        </Card>
      )}

      <div style={{ display: "grid", gap: "12px" }}>
        {themes.length === 0 && (
          <Card><p style={{ color: "var(--text-muted)" }}>Тем пока нет</p></Card>
        )}
        {themes.map((t) => (
          <Card key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontFamily: t.fontUrl ? t.fontFamily : t.fontFamily, color: t.accentColor }}>{t.name}</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                  <Avatar url={t.author.avatarUrl} nickname={t.author.nickname} size={24} />
                  <Link href={`/profile/${t.author.nickname}`} style={{ fontSize: "12px" }}>{t.author.nickname}</Link>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {t.fontUrl ? `шрифт: ${t.fontFamily}` : t.fontFamily} · {t.usageCount} исп. · ★ {t.rating.toFixed(1)}
                  </span>
                  {tab === "mine" && (
                    <span style={{ fontSize: "11px", color: t.isPublic ? "var(--neon-cyan)" : "var(--text-muted)" }}>
                      {t.isPublic ? "· опубликована" : "· скрыта"}
                    </span>
                  )}
                </div>
                {tab === "mine" && user && (
                  <label style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Заменить шрифт:{" "}
                    <input
                      type="file"
                      accept=".woff,.woff2,.ttf,.otf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          await uploadThemeFont(t.id, f, t.fontFamily);
                          showToast("Шрифт обновлён");
                          loadThemes();
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : "Ошибка", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {user && tab === "mine" && (
                  <Button variant="ghost" onClick={() => togglePublic(t.id, t.isPublic)}>
                    {t.isPublic ? "Скрыть" : "Опубликовать"}
                  </Button>
                )}
                {user && <Button onClick={() => apply(t.id)}>Применить</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
