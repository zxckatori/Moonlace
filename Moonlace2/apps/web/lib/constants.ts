export const PRODUCTION_API_URL = "https://moonlace-api.onrender.com";

export type SiteTheme = "synthwave" | "darkwave";

export const SITE_THEMES: { id: SiteTheme; label: string }[] = [
  { id: "synthwave", label: "Синтвейв" },
  { id: "darkwave", label: "Дарквейв" },
];

export const THEME_STORAGE_KEY = "moonlace-site-theme";
