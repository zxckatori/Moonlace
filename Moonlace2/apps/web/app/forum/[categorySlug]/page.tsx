"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

interface Topic {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  createdAt: string;
  author: { nickname: string; avatarUrl?: string | null };
  _count: { posts: number };
}

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    api<Topic[]>(`/forum/categories/${categorySlug}/topics`).then(setTopics).catch(console.error);
  }, [categorySlug]);

  return (
    <div>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/forum" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          ← Форум
        </Link>
        <h1 style={{ fontFamily: "var(--font-editorial)", fontSize: "28px", marginTop: "8px", textTransform: "capitalize" }}>
          {categorySlug}
        </h1>
        <Link
          href={`/forum/new?category=${categorySlug}`}
          style={{ fontFamily: "var(--font-terminal)", fontSize: "16px", color: "var(--neon-cyan)" }}
        >
          + Создать тему
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {topics.map((topic) => (
          <Link key={topic.id} href={`/forum/${categorySlug}/${topic.slug}`}>
            <Card>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <Avatar url={topic.author.avatarUrl} nickname={topic.author.nickname} size={32} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "15px" }}>{topic.title}</h2>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {topic.author.nickname} · {topic._count.posts} постов ·{" "}
                    {new Date(topic.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {topics.length === 0 && (
          <Card><p style={{ color: "var(--text-muted)" }}>Тем пока нет. Создайте первую!</p></Card>
        )}
      </div>
    </div>
  );
}
