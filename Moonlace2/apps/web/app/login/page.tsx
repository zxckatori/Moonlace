"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: doLogin } = useAuth();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await doLogin(login, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <Card>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", marginBottom: "var(--space-4)", textAlign: "center" }} className="glow-purple">
          ВХОД
        </h1>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
          <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "var(--blood)", fontSize: "13px" }}>{error}</p>}
          <Button type="submit">Войти</Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
          Нет аккаунта? <Link href="/register">Регистрация</Link>
        </p>
      </Card>
    </div>
  );
}
