"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { applyUserTheme, type UserThemeData } from "@/lib/userTheme";
import { useAuth } from "@/lib/store";

export function UserThemeApplier() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      applyUserTheme(null);
      return;
    }
    api<{ profile?: { theme?: UserThemeData | null } }>("/users/me")
      .then((u) => applyUserTheme(u.profile?.theme ?? null))
      .catch(() => applyUserTheme(null));
  }, [user?.id]);

  return null;
}

export function refreshUserTheme() {
  api<{ profile?: { theme?: UserThemeData | null } }>("/users/me")
    .then((u) => applyUserTheme(u.profile?.theme ?? null))
    .catch(() => applyUserTheme(null));
}
