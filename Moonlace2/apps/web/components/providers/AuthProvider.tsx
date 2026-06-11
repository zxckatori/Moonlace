"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store";
import { joinUserRoom, getSocket } from "@/lib/ws";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchMe, user, setUnread } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!user) return;
    joinUserRoom(user.id);
    const socket = getSocket();
    socket.on("message:new", () => {
      useAuth.getState().fetchMe();
    });
    socket.on("notification:count", (data: { count: number }) => {
      setUnread(data.count);
    });
    return () => {
      socket.off("message:new");
      socket.off("notification:count");
    };
  }, [user, setUnread]);

  return <>{children}</>;
}
