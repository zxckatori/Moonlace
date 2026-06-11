"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/ws";

interface Conversation {
  partner: { id: string; nickname: string; avatarUrl?: string | null };
  lastMessage: { content: string; createdAt: string };
  unread: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api<Conversation[]>("/messages/conversations").then(setConversations).catch(console.error);
  }, [user, router]);

  useEffect(() => {
    if (!activePartner) return;
    api<Message[]>(`/messages/${activePartner}`).then(setMessages).catch(console.error);
  }, [activePartner]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("message:new", (msg: Message & { senderId: string; receiverId: string }) => {
      if (activePartner && (msg.senderId === activePartner || msg.receiverId === activePartner)) {
        setMessages((prev) => [...prev, msg]);
      }
      api<Conversation[]>("/messages/conversations").then(setConversations);
    });
    return () => { socket.off("message:new"); };
  }, [activePartner]);

  const send = async () => {
    if (!text.trim() || !activePartner) return;
    await api(`/messages/${activePartner}`, {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });
    setText("");
    const msgs = await api<Message[]>(`/messages/${activePartner}`);
    setMessages(msgs);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "var(--space-3)", minHeight: "500px" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-terminal)", fontSize: "20px", marginBottom: "12px" }}>ДИАЛОГИ</h1>
        {conversations.map((c) => (
          <Card
            key={c.partner.id}
            style={{
              marginBottom: "8px",
              cursor: "pointer",
              borderColor: activePartner === c.partner.id ? "var(--neon-cyan)" : undefined,
            }}
            className=""
          >
            <div onClick={() => setActivePartner(c.partner.id)} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Avatar url={c.partner.avatarUrl} nickname={c.partner.nickname} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>
                  {c.partner.nickname}
                  {c.unread > 0 && <span style={{ color: "var(--blood)", marginLeft: "4px" }}>({c.unread})</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMessage.content}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        {activePartner ? (
          <>
            <div style={{ height: "400px", overflowY: "auto", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.senderId === user?.id ? "flex-end" : "flex-start",
                    background: m.senderId === user?.id ? "rgba(0,240,255,0.1)" : "rgba(176,38,255,0.1)",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    maxWidth: "70%",
                    fontSize: "13px",
                  }}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение..." onKeyDown={(e) => e.key === "Enter" && send()} />
              <Button onClick={send}>→</Button>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Выберите диалог</p>
        )}
      </Card>
    </div>
  );
}
