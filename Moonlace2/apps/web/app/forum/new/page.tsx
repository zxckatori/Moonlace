"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/store";

interface Category {
  slug: string;
  name: string;
}

function NewTopicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") || "");

  useEffect(() => {
    if (!user) router.push("/login");
    api<Category[]>("/forum/categories").then(setCategories).catch(console.error);
  }, [user, router]);

  const submit = async () => {
    const topic = await api<{ slug: string; category: { slug: string } }>("/forum/topics", {
      method: "POST",
      body: JSON.stringify({ title, content, categorySlug }),
    });
    router.push(`/forum/${topic.category.slug}/${topic.slug}`);
  };

  return (
    <Card>
      <h1 style={{ fontFamily: "var(--font-editorial)", marginBottom: "var(--space-3)" }}>Новая тема</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          style={{ padding: "10px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          <option value="">Выберите категорию</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <Input placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Первый пост (markdown)..."
          rows={8}
          style={{ padding: "12px", background: "var(--abyss)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        <Button onClick={submit} disabled={!title || !content || !categorySlug}>
          Создать
        </Button>
      </div>
    </Card>
  );
}

export default function NewTopicPage() {
  return (
    <Suspense>
      <NewTopicForm />
    </Suspense>
  );
}
