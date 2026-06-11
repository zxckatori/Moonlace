"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/store";
import { useSubmitLock } from "@/lib/useSubmitLock";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; nickname: string; avatarUrl?: string | null };
  reactions: { userId: string }[];
}

interface Topic {
  title: string;
  author: { nickname: string };
}

export default function TopicPage() {
  const { categorySlug, topicSlug } = useParams<{ categorySlug: string; topicSlug: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reply, setReply] = useState("");
  const { locked: replyLocked, run: runReply } = useSubmitLock();

  useEffect(() => {
    api<Topic>(`/forum/topics/${categorySlug}/${topicSlug}`).then(setTopic).catch(console.error);
    api<{ posts: Post[] }>(`/forum/topics/${categorySlug}/${topicSlug}/posts`).then((r) => setPosts(r.posts)).catch(console.error);
  }, [categorySlug, topicSlug]);

  const submitReply = () =>
    runReply(async () => {
      if (!reply.trim()) return;
      await api("/forum/posts", {
        method: "POST",
        body: JSON.stringify({ content: reply, topicSlug, categorySlug }),
      });
      setReply("");
      const r = await api<{ posts: Post[] }>(`/forum/topics/${categorySlug}/${topicSlug}/posts`);
      setPosts(r.posts);
    });

  const toggleLike = async (postId: string) => {
    await api(`/forum/posts/${postId}/react`, { method: "POST" });
    const r = await api<{ posts: Post[] }>(`/forum/topics/${categorySlug}/${topicSlug}/posts`);
    setPosts(r.posts);
  };

  if (!topic) return <p style={{ color: "var(--text-muted)" }}>Загрузка...</p>;

  return (
    <div>
      <Link href={`/forum/${categorySlug}`} style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        ← {categorySlug}
      </Link>
      <h1 style={{ fontFamily: "var(--font-editorial)", fontSize: "24px", margin: "12px 0" }}>{topic.title}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        {posts.map((post) => (
          <Card key={post.id}>
            <div style={{ display: "flex", gap: "12px" }}>
              <Avatar url={post.author.avatarUrl} nickname={post.author.nickname} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <Link href={`/profile/${post.author.nickname}`}>{post.author.nickname}</Link>
                  <time style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(post.createdAt).toLocaleString("ru-RU")}
                  </time>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    marginTop: "8px",
                    background: "none",
                    border: "none",
                    color: post.reactions.some((r) => r.userId === user?.id) ? "var(--neon-purple)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ♥ {post.reactions.length}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {user && (
        <Card>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Ваш ответ (markdown)..."
            rows={4}
            style={{
              width: "100%",
              background: "rgba(5,5,8,0.6)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "12px",
              marginBottom: "12px",
              resize: "vertical",
            }}
          />
          <Button onClick={submitReply} disabled={replyLocked || !reply.trim()}>
            {replyLocked ? "Отправка…" : "Ответить"}
          </Button>
        </Card>
      )}
    </div>
  );
}
