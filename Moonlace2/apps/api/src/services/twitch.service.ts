import { config } from "../config";
import { getRedis } from "../lib/redis";

interface TwitchStream {
  user_login: string;
  title: string;
  game_name: string;
  thumbnail_url: string;
}

let appToken: { token: string; expires: number } | null = null;

async function getAppToken(): Promise<string | null> {
  if (!config.twitch.clientId || !config.twitch.clientSecret) return null;
  if (appToken && Date.now() < appToken.expires) return appToken.token;

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.twitch.clientId,
      client_secret: config.twitch.clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };
  appToken = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 - 60000 };
  return appToken.token;
}

export async function fetchLiveStreams(logins: string[]): Promise<TwitchStream[]> {
  if (!logins.length) return [];
  const redis = getRedis();
  const cacheKey = `twitch:live:${logins.sort().join(",")}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const token = await getAppToken();
  if (!token) return [];

  const params = new URLSearchParams();
  logins.forEach((l) => params.append("user_login", l));

  const res = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
    headers: {
      "Client-ID": config.twitch.clientId,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data: TwitchStream[] };
  await redis.setex(cacheKey, 60, JSON.stringify(data.data));
  return data.data;
}
