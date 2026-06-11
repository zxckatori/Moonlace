"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUploadUrl } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/store";
import { useToast } from "@/components/providers/ToastProvider";
import { useAppearance } from "@/components/providers/AppearanceProvider";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import Link from "next/link";

export default function SettingsPage() {
  const { user, fetchMe } = useAuth();
  const { showToast } = useToast();
  const { resetToBase, customMeta } = useAppearance();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "",
    country: "",
    city: "",
    timezone: "Europe/Moscow",
    setupKeyboard: "",
    setupMouse: "",
    setupPc: "",
    setupComponents: "",
    twitch: "",
    youtube: "",
    guestbook: "all" as "all" | "friends" | "none",
    showSetup: true,
    showListening: true,
  });
  const [track, setTrack] = useState({ trackTitle: "", artist: "" });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "background" | null>(null);

  const loadProfile = () => {
    api<{
      status?: string;
      avatarUrl?: string | null;
      profile?: {
        backgroundUrl?: string | null;
        country?: string;
        city?: string;
        timezone?: string;
        setupKeyboard?: string;
        setupMouse?: string;
        setupPc?: string;
        setupComponents?: string;
        socialLinks?: Record<string, string>;
        privacySettings?: { guestbook: string; showSetup: boolean; showListening: boolean };
      };
    }>("/users/me").then((u) => {
      setAvatarUrl(u.avatarUrl ?? null);
      setBackgroundUrl(u.profile?.backgroundUrl ?? null);
      setForm({
        status: u.status || "",
        country: u.profile?.country || "",
        city: u.profile?.city || "",
        timezone: u.profile?.timezone || "Europe/Moscow",
        setupKeyboard: u.profile?.setupKeyboard || "",
        setupMouse: u.profile?.setupMouse || "",
        setupPc: u.profile?.setupPc || "",
        setupComponents: u.profile?.setupComponents || "",
        twitch: u.profile?.socialLinks?.twitch || "",
        youtube: u.profile?.socialLinks?.youtube || "",
        guestbook: (u.profile?.privacySettings?.guestbook as "all") || "all",
        showSetup: u.profile?.privacySettings?.showSetup ?? true,
        showListening: u.profile?.privacySettings?.showListening ?? true,
      });
    });
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    loadProfile();
  }, [user, router]);

  const save = async () => {
    try {
      await api("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          country: form.country,
          city: form.city,
          timezone: form.timezone,
          setupKeyboard: form.setupKeyboard,
          setupMouse: form.setupMouse,
          setupPc: form.setupPc,
          setupComponents: form.setupComponents,
          socialLinks: { twitch: form.twitch, youtube: form.youtube },
          privacySettings: {
            guestbook: form.guestbook,
            showLogin: false,
            showSetup: form.showSetup,
            showListening: form.showListening,
          },
        }),
      });
      await api("/profiles/me/stream-links", {
        method: "PUT",
        body: JSON.stringify({ twitch: form.twitch, youtube: form.youtube }),
      });
      setSaved(true);
      fetchMe();
      showToast("Настройки сохранены");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка сохранения", "error");
    }
  };

  const uploadFile = async (file: File, endpoint: string, kind: "avatar" | "background") => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(getUploadUrl(endpoint), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Ошибка загрузки" }));
        throw new Error(typeof err.error === "string" ? err.error : "Ошибка загрузки");
      }
      const data = await res.json();
      if (kind === "avatar" && data.avatarUrl) setAvatarUrl(data.avatarUrl);
      if (kind === "background" && data.backgroundUrl) setBackgroundUrl(data.backgroundUrl);
      await fetchMe();
      loadProfile();
      showToast(kind === "avatar" ? "Аватар обновлён" : "Фон профиля обновлён");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Не удалось загрузить файл", "error");
    } finally {
      setUploading(null);
    }
  };

  const uploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "/profiles/me/avatar", "avatar");
    e.target.value = "";
  };

  const uploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "/profiles/me/background", "background");
    e.target.value = "";
  };

  const setNowPlaying = async (share = false) => {
    await api("/audio/now-playing", {
      method: "PUT",
      body: JSON.stringify({ ...track, share }),
    });
    showToast(share ? "Трек опубликован в ленте" : "Сейчас слушаю обновлено");
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", marginBottom: "var(--space-4)" }}>Настройки</h1>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>ОФОРМЛЕНИЕ САЙТА</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
          Синтвейв и Дарквейв — базовые темы. Кастомные темы создаются в{" "}
          <Link href="/themes" style={{ color: "var(--neon-cyan)" }}>разделе «Темы»</Link>.
        </p>
        <ThemeSwitcher />
        {customMeta && (
          <p style={{ fontSize: "13px", marginTop: "10px", color: "var(--text-muted)" }}>
            Кастомная тема: <strong style={{ color: "var(--neon-purple)" }}>{customMeta.name}</strong>
          </p>
        )}
        <Button
          variant="ghost"
          style={{ marginTop: "12px" }}
          onClick={async () => {
            try {
              await resetToBase();
              showToast("Базовая тема Синтвейв восстановлена");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Ошибка", "error");
            }
          }}
        >
          Вернуть базовую тему (Синтвейв)
        </Button>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>ПРОФИЛЬ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar url={avatarUrl} nickname={user?.nickname || "?"} size={64} />
            <label style={{ fontSize: "13px" }}>
              Аватар
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading === "avatar"} style={{ display: "block", marginTop: "4px" }} />
              {uploading === "avatar" && <span style={{ color: "var(--text-muted)" }}>Загрузка...</span>}
            </label>
          </div>
          <div>
            <label style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>Фон профиля</label>
            {backgroundUrl && (
              <div
                style={{
                  height: "80px",
                  borderRadius: "4px",
                  background: `url(${backgroundUrl}) center/cover`,
                  border: "1px solid var(--border)",
                  marginBottom: "8px",
                }}
              />
            )}
            <input type="file" accept="image/*" onChange={uploadBackground} disabled={uploading === "background"} />
            {uploading === "background" && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}> Загрузка...</span>}
          </div>
          <Input placeholder="Статус" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input placeholder="Страна" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input placeholder="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="Часовой пояс (IANA)" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </div>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>СЕТАП</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Input placeholder="Клавиатура" value={form.setupKeyboard} onChange={(e) => setForm({ ...form, setupKeyboard: e.target.value })} />
          <Input placeholder="Мышь" value={form.setupMouse} onChange={(e) => setForm({ ...form, setupMouse: e.target.value })} />
          <Input placeholder="Компьютер" value={form.setupPc} onChange={(e) => setForm({ ...form, setupPc: e.target.value })} />
          <textarea
            placeholder="Комплектующие"
            value={form.setupComponents}
            onChange={(e) => setForm({ ...form, setupComponents: e.target.value })}
            rows={3}
            style={{ padding: "10px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>СТРИМЫ</h2>
        <Input placeholder="Имя на Twitch" value={form.twitch} onChange={(e) => setForm({ ...form, twitch: e.target.value })} />
        <Input placeholder="Канал YouTube" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} style={{ marginTop: "10px" }} />
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>СЕЙЧАС СЛУШАЮ</h2>
        <Input placeholder="Артист" value={track.artist} onChange={(e) => setTrack({ ...track, artist: e.target.value })} />
        <Input placeholder="Трек" value={track.trackTitle} onChange={(e) => setTrack({ ...track, trackTitle: e.target.value })} style={{ marginTop: "10px" }} />
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <Button onClick={() => setNowPlaying(false)}>Установить</Button>
          <Button onClick={() => setNowPlaying(true)}>Поделиться в ленте</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>ПРИВАТНОСТЬ</h2>
        <select
          value={form.guestbook}
          onChange={(e) => setForm({ ...form, guestbook: e.target.value as "all" | "friends" | "none" })}
          style={{ padding: "10px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)", width: "100%" }}
        >
          <option value="all">Гостевая: все</option>
          <option value="friends">Гостевая: друзья</option>
          <option value="none">Гостевая: никто</option>
        </select>
      </Card>

      <Button onClick={save}>{saved ? "Сохранено ✓" : "Сохранить"}</Button>
    </div>
  );
}
