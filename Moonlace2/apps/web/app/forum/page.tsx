"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/store";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count: { topics: number };
}

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    api<Category[]>("/forum/categories").then(setCategories).catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontFamily: "var(--font-editorial)", fontSize: "28px", letterSpacing: "0.05em" }}>
          Форум
        </h1>
        {user && (
          <Link href="/forum/new" style={{ fontFamily: "var(--font-terminal)", fontSize: "18px", color: "var(--neon-cyan)" }}>
            + Новая тема
          </Link>
        )}
      </div>
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/forum/${cat.slug}`}>
            <Card>
              <h2 style={{ fontFamily: "var(--font-editorial)", fontSize: "20px", marginBottom: "4px" }}>
                {cat.name}
              </h2>
              {cat.description && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "8px" }}>{cat.description}</p>
              )}
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: "14px", color: "var(--neon-purple)" }}>
                {cat._count.topics} тем
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
