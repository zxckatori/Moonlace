export interface UserThemeData {
  accentColor: string;
  fontFamily: string;
  backgroundColor?: string | null;
  backgroundUrl?: string | null;
  scanlineIntensity?: number;
}

const FONT_MAP: Record<string, string> = {
  "Space Mono": '"Space Mono", monospace',
  VT323: '"VT323", monospace',
  Orbitron: '"Orbitron", sans-serif',
  Cinzel: '"Cinzel", serif',
};

const USER_THEME_VARS = [
  "--neon-purple",
  "--neon-cyan",
  "--neon-magenta",
  "--font-body",
  "--font-display",
  "--font-terminal",
  "--void",
  "--abyss",
  "--user-bg-image",
  "--scanline-opacity",
] as const;

export function applyUserTheme(theme: UserThemeData | null) {
  const root = document.documentElement;
  if (!theme) {
    USER_THEME_VARS.forEach((v) => root.style.removeProperty(v));
    document.body.style.removeProperty("background-image");
    return;
  }

  const font = FONT_MAP[theme.fontFamily] || FONT_MAP["Space Mono"];
  root.style.setProperty("--neon-purple", theme.accentColor);
  root.style.setProperty("--neon-cyan", theme.accentColor);
  root.style.setProperty("--neon-magenta", theme.accentColor);
  root.style.setProperty("--font-body", font);
  root.style.setProperty("--font-display", font);
  root.style.setProperty("--font-terminal", font);

  if (theme.backgroundColor) {
    root.style.setProperty("--void", theme.backgroundColor);
    root.style.setProperty("--abyss", theme.backgroundColor);
  }

  if (theme.backgroundUrl) {
    root.style.setProperty("--user-bg-image", `url(${theme.backgroundUrl})`);
    document.body.style.backgroundImage = `linear-gradient(rgba(5,5,8,0.85), rgba(5,5,8,0.92)), url(${theme.backgroundUrl})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.removeProperty("background-image");
    document.body.style.removeProperty("background-size");
    document.body.style.removeProperty("background-attachment");
  }

  const scanlines = document.body.classList.contains("scanlines");
  if (theme.scanlineIntensity !== undefined && scanlines) {
    root.style.setProperty("--scanline-opacity", String(theme.scanlineIntensity));
  }
}

export function clearUserTheme() {
  applyUserTheme(null);
}
