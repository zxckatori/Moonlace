"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUploadUrl } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/store";

export default function SettingsPage() {
  const { user, fetchMe } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api<{
      status?: string;
      profile?: {
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
  }, [user, router]);

  const save = async () => {
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
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("accessToken");
    await fetch(getUploadUrl("/profiles/me/avatar"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    fetchMe();
  };

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("accessToken");
    await fetch(getUploadUrl("/profiles/me/background"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  };

  const setNowPlaying = async (share = false) => {
    await api("/audio/now-playing", {
      method: "PUT",
      body: JSON.stringify({ ...track, share }),
    });
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", marginBottom: "var(--space-4)" }}>Настройки</h1>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>ПРОФИЛЬ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label>Аватар <input type="file" accept="image/*" onChange={uploadAvatar} /></label>
          <label>Фон профиля <input type="file" accept="image/*" onChange={uploadBackground} /></label>
          <Input placeholder="Статус" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input placeholder="Страна" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input placeholder="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="Timezone (IANA)" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </div>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h2 style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", marginBottom: "12px" }}>SETUP</h2>
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
        <Input placeholder="Twitch username" value={form.twitch} onChange={(e) => setForm({ ...form, twitch: e.target.value })} />
        <Input placeholder="YouTube channel" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} style={{ marginTop: "10px" }} />
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
