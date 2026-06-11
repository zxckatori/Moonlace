"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count: { topics: number };
}

export function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<Category[]>("/forum/categories").then(setCategories).catch(console.error);
  }, []);

  return (
    <aside
      style={{
        padding: "var(--space-3)",
        borderRight: "1px solid var(--border)",
        minWidth: "200px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-editorial)",
          fontSize: "14px",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "var(--space-3)",
        }}
      >
        КАТЕГОРИИ
      </h2>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/forum/${cat.slug}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-terminal)",
                fontSize: "18px",
              }}
            >
              <span>{cat.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>{cat._count.topics}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
