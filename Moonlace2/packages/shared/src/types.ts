export interface PrivacySettings {
  guestbook: "all" | "friends" | "none";
  showLogin: boolean;
  showSetup: boolean;
  showListening: boolean;
}

export interface SocialLinks {
  twitch?: string;
  youtube?: string;
  kick?: string;
  spotify?: string;
  soundcloud?: string;
  discord?: string;
  telegram?: string;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  guestbook: "all",
  showLogin: false,
  showSetup: true,
  showListening: true,
};
