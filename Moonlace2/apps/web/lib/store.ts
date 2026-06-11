import { create } from "zustand";
import { setToken, clearToken, api } from "./api";

interface User {
  id: string;
  login?: string;
  nickname: string;
  email?: string;
  avatarUrl?: string | null;
  status?: string | null;
}

interface AuthState {
  user: User | null;
  unreadMessages: number;
  setUser: (user: User | null) => void;
  login: (login: string, password: string) => Promise<void>;
  register: (data: {
    login: string;
    nickname: string;
    email: string;
    password: string;
  }) => Promise<string | undefined>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUnread: (n: number) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  unreadMessages: 0,

  setUser: (user) => set({ user }),

  login: async (login, password) => {
    const res = await api<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
    setToken(res.accessToken);
    set({ user: res.user });
  },

  register: async (data) => {
    const res = await api<{ user: User; accessToken: string; warning?: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) }
    );
    setToken(res.accessToken);
    set({ user: res.user });
    return res.warning;
  },

  logout: async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearToken();
    set({ user: null, unreadMessages: 0 });
  },

  fetchMe: async () => {
    try {
      const user = await api<User>("/users/me");
      set({ user });
      const { count } = await api<{ count: number }>("/messages/unread-count");
      set({ unreadMessages: count });
    } catch {
      set({ user: null });
    }
  },

  setUnread: (n) => set({ unreadMessages: n }),
}));
