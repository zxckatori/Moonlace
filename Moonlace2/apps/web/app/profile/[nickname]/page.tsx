"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LiveWidget } from "@/components/stream/LiveWidget";
import { useAuth } from "@/lib/store";

type Tab = "wall" | "gallery" | "audio" | "guestbook";

interface WallPost {
  id: string;
  content: string;
  author: { nickname: string };
  createdAt: string;
}

interface GalleryItem {
  id: string;
  url: string;
  type: string;
}

interface AudioData {
  current?: { trackTitle: string; artist?: string };
  history: { trackTitle: string; artist?: string; createdAt: string }[];
}

interface GuestbookEntry {
  id: string;
  content: string;
  author: { nickname: string };
  createdAt: string;
}

interface ProfileData {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  status?: string | null;
  createdAt: string;
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
    theme?: {
      accentColor: string;
      fontFamily: string;
      backgroundColor?: string;
      scanlineIntensity: number;
    };
  };
  streamStatus?: {
    isLive: boolean;
    title?: string;
    category?: string;
    thumbnailUrl?: string;
    platformId?: string;
  };
  listeningHistory?: { trackTitle: string; artist?: string }[];
  _count?: { posts: number; galleryItems: number; topics: number };
}

export default function ProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<Tab>("wall");
  const [wall, setWall] = useState<WallPost[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [wallPost, setWallPost] = useState("");
  const [gbText, setGbText] = useState("");

  useEffect(() => {
    api<ProfileData>(`/users/${nickname}`).then(setProfile).catch(console.error);
  }, [nickname]);

  useEffect(() => {
    if (tab === "wall") api<WallPost[]>(`/profiles/${nickname}/wall`).then(setWall).catch(console.error);
    if (tab === "gallery") api<GalleryItem[]>(`/profiles/${nickname}/gallery`).then(setGallery).catch(console.error);
    if (tab === "audio") api<AudioData>(`/audio/${nickname}`).then(setAudio).catch(console.error);
    if (tab === "guestbook") api<GuestbookEntry[]>(`/profiles/${nickname}/guestbook`).then(setGuestbook).catch(console.error);
  }, [tab, nickname]);

  if (!profile) return <p style={{ color: "var(--text-muted)" }}>Загрузка сигнала...</p>;

  const theme = profile.profile?.theme;
  const style: React.CSSProperties = theme
    ? {
        ["--profile-accent" as string]: theme.accentColor,
        fontFamily: theme.fontFamily,
      }
    : {};

  const mskTime = profile.profile?.timezone
    ? new Date().toLocaleString("ru-RU", { timeZone: profile.profile.timezone, hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={style}>
      <div
        style={{
          background: profile.profile?.backgroundUrl
            ? `linear-gradient(rgba(5,5,8,0.7), rgba(5,5,8,0.9)), url(${profile.profile.backgroundUrl}) center/cover`
            : "linear-gradient(135deg, var(--abyss), var(--void))",
          borderRadius: "4px",
          padding: "var(--space-5)",
          marginBottom: "var(--space-4)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <Avatar url={profile.avatarUrl} nickname={profile.nickname} size={80} />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px" }} className="glow-purple">
              {profile.nickname}
            </h1>
            {profile.status && <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{profile.status}</p>}
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {profile.profile?.city && `${profile.profile.city}, `}
              {profile.profile?.country}
              {mskTime && ` · ${mskTime}`}
            </div>
          </div>
        </div>

        {profile.streamStatus?.isLive && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <LiveWidget
              stream={{
                userId: profile.id,
                title: profile.streamStatus.title,
                category: profile.streamStatus.category,
                thumbnailUrl: profile.streamStatus.thumbnailUrl,
                user: { nickname: profile.nickname, avatarUrl: profile.avatarUrl },
              }}
              full
            />
            {profile.profile?.socialLinks?.twitch && (
              <a
                href={`https://twitch.tv/${profile.profile.socialLinks.twitch}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: "8px", fontFamily: "var(--font-terminal)", fontSize: "16px" }}
              >
                Смотреть на Twitch →
              </a>
            )}
          </div>
        )}
      </div>

      {profile.profile?.setupPc && (
        <Card style={{ marginBottom: "var(--space-3)" }}>
          <h3 style={{ fontFamily: "var(--font-terminal)", fontSize: "16px", color: "var(--neon-cyan)", marginBottom: "8px" }}>SETUP</h3>
          <div style={{ fontSize: "13px", display: "grid", gap: "4px" }}>
            {profile.profile.setupPc && <div>PC: {profile.profile.setupPc}</div>}
            {profile.profile.setupKeyboard && <div>Клавиатура: {profile.profile.setupKeyboard}</div>}
            {profile.profile.setupMouse && <div>Мышь: {profile.profile.setupMouse}</div>}
            {profile.profile.setupComponents && <div>{profile.profile.setupComponents}</div>}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
        {(["wall", "gallery", "audio", "guestbook"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 14px",
              background: tab === t ? "rgba(176,38,255,0.2)" : "transparent",
              border: `1px solid ${tab === t ? "var(--neon-purple)" : "var(--border)"}`,
              color: tab === t ? "var(--neon-purple)" : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-terminal)",
              fontSize: "16px",
            }}
          >
            {t === "wall" ? "Посты" : t === "gallery" ? "Галерея" : t === "audio" ? "Аудио" : "Гостевая"}
          </button>
        ))}
      </div>

      {tab === "wall" && (
        <div>
          {user?.nickname === nickname && (
            <Card style={{ marginBottom: "12px" }}>
              <textarea
                value={wallPost}
                onChange={(e) => setWallPost(e.target.value)}
                placeholder="Написать на стене..."
                rows={3}
                style={{ width: "100%", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px", marginBottom: "8px" }}
              />
              <Button onClick={async () => {
                await api("/profiles/me/wall", { method: "POST", body: JSON.stringify({ content: wallPost }) });
                setWallPost("");
                api<WallPost[]>(`/profiles/${nickname}/wall`).then(setWall);
              }}>Опубликовать</Button>
            </Card>
          )}
          {wall.map((p) => (
            <Card key={p.id} style={{ marginBottom: "8px" }}>
              <p>{p.content}</p>
              <time style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(p.createdAt).toLocaleString("ru-RU")}</time>
            </Card>
          ))}
        </div>
      )}

      {tab === "gallery" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
          {gallery.map((item) => (
            <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>
              {item.type === "VIDEO" ? (
                <video src={item.url} controls style={{ width: "100%" }} />
              ) : item.type === "AUDIO" ? (
                <audio src={item.url} controls style={{ width: "100%" }} />
              ) : (
                <img src={item.url} alt="" style={{ width: "100%", display: "block" }} />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "audio" && audio && (
        <div>
          {audio.current && (
            <Card style={{ marginBottom: "12px" }}>
              <Badge variant="live">СЕЙЧАС СЛУШАЕТ</Badge>
              <p style={{ marginTop: "8px" }}>
                {audio.current.artist ? `${audio.current.artist} — ` : ""}{audio.current.trackTitle}
              </p>
            </Card>
          )}
          <h3 style={{ fontFamily: "var(--font-terminal)", marginBottom: "8px" }}>История</h3>
          {audio.history.map((e, i) => (
            <div key={i} style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              {e.artist ? `${e.artist} — ` : ""}{e.trackTitle}
            </div>
          ))}
        </div>
      )}

      {tab === "guestbook" && (
        <div>
          {user && user.nickname !== nickname && (
            <Card style={{ marginBottom: "12px" }}>
              <Input placeholder="Запись в гостевую..." value={gbText} onChange={(e) => setGbText(e.target.value)} />
              <Button style={{ marginTop: "8px" }} onClick={async () => {
                await api(`/profiles/${nickname}/guestbook`, { method: "POST", body: JSON.stringify({ content: gbText }) });
                setGbText("");
                api<GuestbookEntry[]>(`/profiles/${nickname}/guestbook`).then(setGuestbook);
              }}>Написать</Button>
            </Card>
          )}
          {guestbook.map((e) => (
            <Card key={e.id} style={{ marginBottom: "8px" }}>
              <strong>{e.author.nickname}</strong>
              <p>{e.content}</p>
              <time style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(e.createdAt).toLocaleString("ru-RU")}</time>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
