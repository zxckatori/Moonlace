"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  SITE_THEMES,
  THEME_STORAGE_KEY,
  type SiteTheme,
} from "@/lib/constants";
import {
  clearCustomThemeStorage,
  getCustomThemeMeta,
  getThemeView,
  isCustomThemeVisible,
  setCustomThemeMeta,
  setCustomThemeVisible,
  setThemeView,
  type CustomThemeMeta,
  type ThemeView,
} from "@/lib/customTheme";
import { applyUserTheme, clearUserTheme, type UserThemeData } from "@/lib/userTheme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store";

interface AppearanceContextValue {
  siteTheme: SiteTheme;
  view: ThemeView;
  customMeta: CustomThemeMeta | null;
  customVisible: boolean;
  setSiteTheme: (theme: SiteTheme) => void;
  selectCustom: () => void;
  syncFromProfile: (theme: UserThemeData | null | undefined, themeId?: string | null, themeName?: string) => void;
  disableCustomInHeader: () => void;
  enableCustomInHeader: () => void;
  resetToBase: () => Promise<void>;
  onThemeDeleted: (id: string) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function readSiteTheme(): SiteTheme {
  if (typeof window === "undefined") return "synthwave";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "darkwave" || stored === "synthwave") return stored;
  return "synthwave";
}

function applySiteTheme(theme: SiteTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [siteTheme, setSiteThemeState] = useState<SiteTheme>("synthwave");
  const [view, setViewState] = useState<ThemeView>("site");
  const [customMeta, setCustomMetaState] = useState<CustomThemeMeta | null>(null);
  const [customVisible, setCustomVisibleState] = useState(false);

  const applyView = useCallback(
    async (nextView: ThemeView, meta: CustomThemeMeta | null) => {
      setViewState(nextView);
      setThemeView(nextView);
      if (nextView === "custom" && meta) {
        try {
          const themes = await api<Array<UserThemeData & { id: string; name: string }>>("/themes/mine");
          const t = themes.find((x) => x.id === meta.id);
          if (t) applyUserTheme(t);
          else {
            const me = await api<{ profile?: { theme?: UserThemeData } }>("/users/me");
            applyUserTheme(me.profile?.theme ?? null);
          }
        } catch {
          clearUserTheme();
        }
      } else {
        clearUserTheme();
        applySiteTheme(readSiteTheme());
      }
    },
    []
  );

  useEffect(() => {
    const base = readSiteTheme();
    setSiteThemeState(base);
    applySiteTheme(base);
    setCustomMetaState(getCustomThemeMeta());
    setCustomVisibleState(isCustomThemeVisible());
    setViewState(getThemeView());
  }, []);

  useEffect(() => {
    if (!user) {
      clearUserTheme();
      applySiteTheme(readSiteTheme());
      return;
    }
    api<{ profile?: { activeThemeId?: string | null; theme?: UserThemeData & { name?: string } } }>("/users/me")
      .then((me) => {
        const activeId = me.profile?.activeThemeId;
        const theme = me.profile?.theme;
        if (activeId && theme) {
          const meta = { id: activeId, name: theme.name || "Моя тема" };
          setCustomThemeMeta(meta);
          setCustomMetaState(meta);
          if (isCustomThemeVisible()) {
            setCustomVisibleState(true);
            if (getThemeView() === "custom") {
              applyUserTheme(theme);
              setViewState("custom");
            }
          }
        } else {
          clearCustomThemeStorage();
          setCustomMetaState(null);
          setCustomVisibleState(false);
          setViewState("site");
          clearUserTheme();
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const setSiteTheme = (next: SiteTheme) => {
    setSiteThemeState(next);
    applySiteTheme(next);
    setViewState("site");
    setThemeView("site");
    clearUserTheme();
  };

  const selectCustom = () => {
    const meta = getCustomThemeMeta();
    if (!meta) return;
    setCustomThemeVisible(true);
    setCustomVisibleState(true);
    applyView("custom", meta);
  };

  const syncFromProfile = (theme: UserThemeData | null | undefined, themeId?: string | null, themeName?: string) => {
    if (themeId && theme && themeName) {
      const meta = { id: themeId, name: themeName };
      setCustomThemeMeta(meta);
      setCustomMetaState(meta);
      setCustomThemeVisible(true);
      setCustomVisibleState(true);
      setViewState("custom");
      setThemeView("custom");
      applyUserTheme(theme);
    }
  };

  const disableCustomInHeader = () => {
    setCustomThemeVisible(false);
    setCustomVisibleState(false);
    setViewState("site");
    setThemeView("site");
    clearUserTheme();
    applySiteTheme(readSiteTheme());
  };

  const enableCustomInHeader = () => {
    const meta = getCustomThemeMeta();
    if (!meta) return;
    setCustomThemeVisible(true);
    setCustomVisibleState(true);
  };

  const resetToBase = async () => {
    try {
      await api("/themes/reset", { method: "POST" });
    } catch {
      /* сброс локально даже если API недоступен */
    }
    clearCustomThemeStorage();
    setCustomMetaState(null);
    setCustomVisibleState(false);
    setViewState("site");
    setThemeView("site");
    clearUserTheme();
    setSiteThemeState("synthwave");
    applySiteTheme("synthwave");
  };

  const onThemeDeleted = (id: string) => {
    const meta = getCustomThemeMeta();
    if (meta?.id !== id) return;
    clearCustomThemeStorage();
    setCustomMetaState(null);
    setCustomVisibleState(false);
    setViewState("site");
    setThemeView("site");
    clearUserTheme();
    applySiteTheme(readSiteTheme());
  };

  return (
    <AppearanceContext.Provider
      value={{
        siteTheme,
        view,
        customMeta,
        customVisible,
        setSiteTheme,
        selectCustom,
        syncFromProfile,
        disableCustomInHeader,
        enableCustomInHeader,
        resetToBase,
        onThemeDeleted,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}

export { SITE_THEMES };
