export const CUSTOM_THEME_META_KEY = "moonlace-custom-theme-meta";
export const CUSTOM_THEME_VISIBLE_KEY = "moonlace-custom-visible";
export const CUSTOM_THEME_VIEW_KEY = "moonlace-custom-view";

export interface CustomThemeMeta {
  id: string;
  name: string;
}

export function getCustomThemeMeta(): CustomThemeMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomThemeMeta;
    if (parsed?.id && parsed?.name) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function setCustomThemeMeta(meta: CustomThemeMeta | null) {
  if (typeof window === "undefined") return;
  if (meta) localStorage.setItem(CUSTOM_THEME_META_KEY, JSON.stringify(meta));
  else localStorage.removeItem(CUSTOM_THEME_META_KEY);
}

export function isCustomThemeVisible(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CUSTOM_THEME_VISIBLE_KEY) === "true";
}

export function setCustomThemeVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_THEME_VISIBLE_KEY, visible ? "true" : "false");
}

export type ThemeView = "site" | "custom";

export function getThemeView(): ThemeView {
  if (typeof window === "undefined") return "site";
  return localStorage.getItem(CUSTOM_THEME_VIEW_KEY) === "custom" ? "custom" : "site";
}

export function setThemeView(view: ThemeView) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_THEME_VIEW_KEY, view);
}

export function clearCustomThemeStorage() {
  setCustomThemeMeta(null);
  setCustomThemeVisible(false);
  setThemeView("site");
}
