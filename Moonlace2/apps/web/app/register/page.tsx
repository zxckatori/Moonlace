"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [form, setForm] = useState({ login: "", nickname: "", email: "", password: "" });
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    try {
      const w = await register(form);
      if (w === "LOGIN_NICKNAME_MATCH") {
        setWarning("Логин и никнейм совпадают — это небезопасно, но регистрация прошла.");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <Card>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", marginBottom: "var(--space-4)", textAlign: "center" }} className="glow-cyan">
          РЕГИСТРАЦИЯ
        </h1>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input placeholder="Логин (приватный)" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
          <Input placeholder="Никнейм (публичный)" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required />
          {form.login && form.nickname && form.login === form.nickname && (
            <p style={{ color: "var(--blood)", fontSize: "12px" }}>
              ⚠ Логин и никнейм совпадают — рекомендуем разные значения
            </p>
          )}
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input type="password" placeholder="Пароль (мин. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          {error && <p style={{ color: "var(--blood)", fontSize: "13px" }}>{error}</p>}
          {warning && <p style={{ color: "var(--neon-magenta)", fontSize: "13px" }}>{warning}</p>}
          <Button type="submit">Создать аккаунт</Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
          Уже есть? <Link href="/login">Вход</Link>
        </p>
      </Card>
    </div>
  );
}
