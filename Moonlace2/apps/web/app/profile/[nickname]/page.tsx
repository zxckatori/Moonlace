"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, getUploadUrl } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LiveWidget } from "@/components/stream/LiveWidget";
import { useAuth } from "@/lib/store";
import { useToast } from "@/components/providers/ToastProvider";
import { useSubmitLock } from "@/lib/useSubmitLock";

type Tab = "wall" | "gallery" | "audio" | "guestbook";

interface WallPost {
  id: string;
  content: string;
  author: { id: string; nickname: string; avatarUrl?: string | null };
  createdAt: string;
  reactions: { id: string; userId: string; type: string }[];
}

interface GalleryItem {
  id: string;
  url: string;
  type: string;
  title?: string | null;
  createdAt?: string;
}

interface AudioEntry {
  id: string;
  trackTitle: string;
  artist?: string | null;
  createdAt: string;
  isFavorite?: boolean;
}

interface AudioData {
  current?: AudioEntry | null;
  history: AudioEntry[];
  favorites: AudioEntry[];
  uploads: GalleryItem[];
}

function emptyAudio(): AudioData {
  return { current: null, history: [], favorites: [], uploads: [] };
}

function normalizeAudio(raw: Partial<AudioData> | null | undefined): AudioData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyAudio();
  return {
    current: raw.current ?? null,
    history: Array.isArray(raw.history) ? raw.history : [],
    favorites: Array.isArray(raw.favorites) ? raw.favorites : [],
    uploads: Array.isArray(raw.uploads) ? raw.uploads : [],
  };
}

interface GuestbookEntry {
  id: string;
  content: string;
  author: { nickname: string; avatarUrl?: string | null };
  createdAt: string;
}

interface ProfileVisit {
  id: string;
  createdAt: string;
  visitor: { nickname: string; avatarUrl?: string | null };
}

interface ProfileData {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  status?: string | null;
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
    theme?: { accentColor: string; fontFamily: string; backgroundColor?: string; scanlineIntensity: number };
  };
  streamStatus?: {
    isLive: boolean;
    title?: string;
    category?: string;
    thumbnailUrl?: string;
  };
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<Tab>("wall");
  const [wall, setWall] = useState<WallPost[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [visits, setVisits] = useState<ProfileVisit[]>([]);
  const [wallPost, setWallPost] = useState("");
  const [gbText, setGbText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [classPopId, setClassPopId] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const { locked: wallLocked, run: runWallPost } = useSubmitLock();
  const { locked: gbLocked, run: runGuestbook } = useSubmitLock();

  const isOwner = user?.nickname === nickname;

  useEffect(() => {
    api<ProfileData>(`/users/${nickname}`).then(setProfile).catch(console.error);
  }, [nickname]);

  useEffect(() => {
    if (user && user.nickname !== nickname) {
      api(`/profiles/${nickname}/visit`, { method: "POST" }).catch(() => {});
    }
  }, [user, nickname]);

  const loadWall = useCallback(
    () => api<WallPost[]>(`/profiles/${nickname}/wall`).then(setWall).catch(console.error),
    [nickname]
  );
  const loadGallery = useCallback(
    () => api<GalleryItem[]>(`/profiles/${nickname}/gallery`).then(setGallery).catch(console.error),
    [nickname]
  );
  const loadAudio = useCallback(() => {
    setAudioError(false);
    api<Partial<AudioData>>(`/audio/${nickname}`)
      .then((data) => setAudio(normalizeAudio(data)))
      .catch(() => {
        setAudio(emptyAudio());
        setAudioError(true);
      });
  }, [nickname]);
  const loadGuestbook = useCallback(() => {
    api<GuestbookEntry[]>(`/profiles/${nickname}/guestbook`).then(setGuestbook).catch(console.error);
    api<ProfileVisit[]>(`/profiles/${nickname}/visits`).then(setVisits).catch(console.error);
  }, [nickname]);

  useEffect(() => {
    if (tab === "wall") loadWall();
    if (tab === "gallery") loadGallery();
    if (tab === "audio") loadAudio();
    if (tab === "guestbook") loadGuestbook();
  }, [tab, loadWall, loadGallery, loadAudio, loadGuestbook]);

  const deletePost = async (postId: string) => {
    if (!confirm("Удалить пост?")) return;
    setBusy(`del-${postId}`);
    setRemovingId(postId);
    try {
      await api(`/profiles/me/wall/${postId}`, { method: "DELETE" });
      showToast("Пост удалён");
      await loadWall();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Не удалось удалить", "error");
    } finally {
      setBusy(null);
      setRemovingId(null);
    }
  };

  const toggleClass = async (postId: string) => {
    setBusy(`class-${postId}`);
    try {
      await api(`/profiles/wall/${postId}/react`, { method: "POST" });
      setClassPopId(postId);
      setTimeout(() => setClassPopId(null), 300);
      await loadWall();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(null);
    }
  };

  const uploadGallery = async (file: File) => {
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(getUploadUrl("/profiles/me/gallery"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Ошибка загрузки");
      }
      showToast("Добавлено в галерею");
      loadGallery();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка загрузки", "error");
    } finally {
      setUploadingGallery(false);
    }
  };

  const deleteGalleryItem = async (itemId: string) => {
    setBusy(`gal-${itemId}`);
    try {
      await api(`/profiles/me/gallery/${itemId}`, { method: "DELETE" });
      showToast("Удалено из галереи");
      loadGallery();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(null);
    }
  };

  const toggleFavorite = async (entryId: string) => {
    setBusy(`fav-${entryId}`);
    try {
      await api(`/audio/entries/${entryId}/favorite`, { method: "POST" });
      showToast("Избранное обновлено");
      loadAudio();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(null);
    }
  };

  if (!profile) return <p style={{ color: "var(--text-muted)" }}>Загрузка сигнала...</p>;

  const theme = profile.profile?.theme;
  const style: React.CSSProperties = theme
    ? { ["--profile-accent" as string]: theme.accentColor, fontFamily: theme.fontFamily }
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
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
        {(["wall", "gallery", "audio", "guestbook"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="btn-action"
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
          {isOwner && (
            <Card style={{ marginBottom: "12px" }}>
              <textarea
                value={wallPost}
                onChange={(e) => setWallPost(e.target.value)}
                placeholder="Написать на стене..."
                rows={3}
                style={{ width: "100%", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px", marginBottom: "8px" }}
              />
              <Button
                disabled={!wallPost.trim() || wallLocked}
                onClick={() =>
                  runWallPost(async () => {
                    try {
                      await api("/profiles/me/wall", { method: "POST", body: JSON.stringify({ content: wallPost }) });
                      setWallPost("");
                      showToast("Опубликовано");
                      loadWall();
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : "Ошибка", "error");
                    }
                  })
                }
              >
                {wallLocked ? "Публикация…" : "Опубликовать"}
              </Button>
            </Card>
          )}
          {wall.length === 0 && <Card><p style={{ color: "var(--text-muted)" }}>На стене пока пусто</p></Card>}
          {wall.map((p) => {
            const classCount = (p.reactions ?? []).filter((r) => r.type === "class").length;
            const userReacted = user && (p.reactions ?? []).some((r) => r.userId === user.id && r.type === "class");
            const canDelete = isOwner && (user?.id === p.author.id || user?.nickname === p.author.nickname);
            return (
              <Card key={p.id} style={{ marginBottom: "8px" }} className={removingId === p.id ? "post-removing" : undefined}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <Avatar url={p.author.avatarUrl} nickname={p.author.nickname} size={28} />
                      <Link href={`/profile/${p.author.nickname}`} style={{ fontWeight: 700, color: "var(--neon-cyan)" }}>
                        {p.author.nickname}
                      </Link>
                    </div>
                    <p style={{ marginBottom: "8px" }}>{p.content}</p>
                    <time style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</time>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className="btn-action btn-danger"
                      disabled={busy === `del-${p.id}`}
                      onClick={() => deletePost(p.id)}
                      style={{
                        background: busy === `del-${p.id}` ? "rgba(255,0,64,0.15)" : "none",
                        border: "1px solid var(--blood)",
                        color: "var(--blood)",
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "var(--font-terminal)",
                      }}
                    >
                      {busy === `del-${p.id}` ? "…" : "Удалить"}
                    </button>
                  )}
                </div>
                <div style={{ marginTop: "10px" }}>
                  {user ? (
                    <button
                      type="button"
                      className={`btn-action ${classPopId === p.id ? "btn-class-active" : ""}`}
                      disabled={busy === `class-${p.id}`}
                      onClick={() => toggleClass(p.id)}
                      style={{
                        background: userReacted ? "rgba(176,38,255,0.25)" : "transparent",
                        border: `1px solid ${userReacted ? "var(--neon-purple)" : "var(--border)"}`,
                        color: userReacted ? "var(--neon-purple)" : "var(--text-muted)",
                        padding: "4px 12px",
                        cursor: "pointer",
                        fontFamily: "var(--font-terminal)",
                        fontSize: "14px",
                      }}
                    >
                      ★ Класс{classCount > 0 ? ` · ${classCount}` : ""}
                    </button>
                  ) : classCount > 0 ? (
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-terminal)" }}>
                      ★ Класс · {classCount}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "gallery" && (
        <div>
          {isOwner && (
            <Card style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
                Загрузите изображения, GIF или видео
              </p>
              <label style={{ display: "inline-block", cursor: uploadingGallery ? "wait" : "pointer" }}>
                <span
                  className="btn-action"
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    border: "1px solid var(--neon-cyan)",
                    color: "var(--neon-cyan)",
                    fontFamily: "var(--font-terminal)",
                    fontSize: "16px",
                  }}
                >
                  {uploadingGallery ? "Загрузка…" : "+ Загрузить в галерею"}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*,.gif"
                  style={{ display: "none" }}
                  disabled={uploadingGallery}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadGallery(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </Card>
          )}
          {gallery.length === 0 ? (
            <Card><p style={{ color: "var(--text-muted)" }}>Галерея пуста</p></Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              {gallery.map((item) => (
                <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                  {item.type === "VIDEO" ? (
                    <video src={item.url} controls style={{ width: "100%", display: "block" }} />
                  ) : item.type === "AUDIO" ? (
                    <audio src={item.url} controls style={{ width: "100%" }} />
                  ) : (
                    <img src={item.url} alt="" style={{ width: "100%", display: "block", aspectRatio: "1", objectFit: "cover" }} />
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      className="btn-action btn-danger"
                      disabled={busy === `gal-${item.id}`}
                      onClick={() => deleteGalleryItem(item.id)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "rgba(5,5,8,0.85)",
                        border: "1px solid var(--blood)",
                        color: "var(--blood)",
                        padding: "2px 6px",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "var(--font-terminal)",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "audio" && (
        <div>
          {!audio ? (
            <p style={{ color: "var(--text-muted)" }}>Загрузка…</p>
          ) : (
            <>
              {audioError && (
                <Card style={{ marginBottom: "12px" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Не удалось загрузить аудио с сервера. Показаны пустые разделы.</p>
                </Card>
              )}
              {isOwner && (
                <Card style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>Загрузить аудиофайл</p>
                  <label style={{ cursor: "pointer" }}>
                    <span style={{ padding: "8px 16px", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", fontFamily: "var(--font-terminal)", display: "inline-block" }}>
                      + Загрузить трек
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setUploadingGallery(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", f);
                          const token = localStorage.getItem("accessToken");
                          const res = await fetch(getUploadUrl("/profiles/me/gallery"), {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          });
                          if (!res.ok) throw new Error("Ошибка загрузки");
                          showToast("Трек загружен");
                          loadAudio();
                        } catch {
                          showToast("Не удалось загрузить", "error");
                        } finally {
                          setUploadingGallery(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </Card>
              )}
              {audio.current?.trackTitle && (
                <Card style={{ marginBottom: "12px" }}>
                  <Badge variant="live">СЕЙЧАС СЛУШАЕТ</Badge>
                  <p style={{ marginTop: "8px" }}>
                    {audio.current.artist ? `${audio.current.artist} — ` : ""}
                    {audio.current.trackTitle}
                  </p>
                </Card>
              )}
              {audio.uploads.length > 0 && (
                <>
                  <h3 style={{ fontFamily: "var(--font-terminal)", marginBottom: "8px", color: "var(--neon-cyan)" }}>Загруженные</h3>
                  {audio.uploads.map((u) => (
                    <Card key={u.id} style={{ marginBottom: "8px" }}>
                      <audio src={u.url} controls style={{ width: "100%" }} />
                    </Card>
                  ))}
                </>
              )}
              {audio.favorites.length > 0 && (
                <>
                  <h3 style={{ fontFamily: "var(--font-terminal)", margin: "16px 0 8px", color: "var(--neon-purple)" }}>Избранное</h3>
                  {audio.favorites.map((e) => (
                    <div key={e.id} style={{ fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{e.artist ? `${e.artist} — ` : ""}{e.trackTitle}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{formatDate(e.createdAt)}</span>
                    </div>
                  ))}
                </>
              )}
              <h3 style={{ fontFamily: "var(--font-terminal)", margin: "16px 0 8px" }}>История прослушивания</h3>
              {audio.history.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>История пуста</p>
              ) : (
                audio.history.map((e) => (
                  <div key={e.id} style={{ fontSize: "13px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      {e.artist ? `${e.artist} — ` : ""}{e.trackTitle}
                      <span style={{ fontSize: "11px", marginLeft: "8px" }}>{formatDate(e.createdAt)}</span>
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        className="btn-action"
                        disabled={busy === `fav-${e.id}`}
                        onClick={() => toggleFavorite(e.id)}
                        style={{
                          background: e.isFavorite ? "rgba(176,38,255,0.2)" : "transparent",
                          border: `1px solid ${e.isFavorite ? "var(--neon-purple)" : "var(--border)"}`,
                          color: e.isFavorite ? "var(--neon-purple)" : "var(--text-muted)",
                          padding: "2px 8px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "var(--font-terminal)",
                        }}
                      >
                        {e.isFavorite ? "★ в избранном" : "☆ в избранное"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {tab === "guestbook" && (
        <div>
          <h3 style={{ fontFamily: "var(--font-terminal)", marginBottom: "8px", color: "var(--neon-cyan)" }}>Кто заходил</h3>
          {visits.length === 0 ? (
            <Card style={{ marginBottom: "12px" }}><p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Пока никто не заходил</p></Card>
          ) : (
            <Card style={{ marginBottom: "16px" }}>
              {visits.map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <Avatar url={v.visitor.avatarUrl} nickname={v.visitor.nickname} size={28} />
                  <div>
                    <Link href={`/profile/${v.visitor.nickname}`} style={{ fontWeight: 600 }}>{v.visitor.nickname}</Link>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>был(а) {formatDate(v.createdAt)}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          <h3 style={{ fontFamily: "var(--font-terminal)", marginBottom: "8px" }}>Записи</h3>
          {user && !isOwner && (
            <Card style={{ marginBottom: "12px" }}>
              <Input placeholder="Запись в гостевую..." value={gbText} onChange={(e) => setGbText(e.target.value)} />
              <Button
                style={{ marginTop: "8px" }}
                disabled={!gbText.trim() || gbLocked}
                onClick={() =>
                  runGuestbook(async () => {
                    try {
                      await api(`/profiles/${nickname}/guestbook`, { method: "POST", body: JSON.stringify({ content: gbText }) });
                      setGbText("");
                      showToast("Запись добавлена");
                      loadGuestbook();
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : "Ошибка", "error");
                    }
                  })
                }
              >
                {gbLocked ? "Отправка…" : "Написать"}
              </Button>
            </Card>
          )}
          {guestbook.length === 0 ? (
            <Card><p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Записей пока нет</p></Card>
          ) : (
            guestbook.map((e) => (
              <Card key={e.id} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Avatar url={e.author.avatarUrl} nickname={e.author.nickname} size={24} />
                  <strong>{e.author.nickname}</strong>
                  <time style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formatDate(e.createdAt)}</time>
                </div>
                <p>{e.content}</p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
