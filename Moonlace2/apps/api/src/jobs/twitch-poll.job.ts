import { prisma } from "@moonlace/db";
import { fetchLiveStreams } from "../services/twitch.service";
import { createFeedEvent } from "../services/feed.service";
import type { Server } from "socket.io";

export function startTwitchPollJob(io: Server) {
  const poll = async () => {
    try {
      const statuses = await prisma.streamStatus.findMany({
        where: { platform: "twitch", platformId: { not: "" } },
        include: { user: { select: { id: true, nickname: true } } },
      });

      if (!statuses.length) return;

      const logins = statuses.map((s) => s.platformId);
      const liveStreams = await fetchLiveStreams(logins);
      const liveMap = new Map(liveStreams.map((s) => [s.user_login.toLowerCase(), s]));

      for (const status of statuses) {
        const live = liveMap.get(status.platformId.toLowerCase());
        const wasLive = status.isLive;
        const isLive = !!live;

        await prisma.streamStatus.update({
          where: { userId: status.userId },
          data: {
            isLive,
            title: live?.title || null,
            category: live?.game_name || null,
            thumbnailUrl: live?.thumbnail_url?.replace("{width}", "440").replace("{height}", "248") || null,
          },
        });

        if (isLive && !wasLive) {
          await createFeedEvent(
            "STREAM_LIVE",
            status.userId,
            {
              title: live?.title,
              category: live?.game_name,
              nickname: status.user.nickname,
            },
            io
          );
          io.emit("stream:live", {
            userId: status.userId,
            nickname: status.user.nickname,
            title: live?.title,
            category: live?.game_name,
          });
        } else if (!isLive && wasLive) {
          io.emit("stream:offline", { userId: status.userId });
        }
      }
    } catch (err) {
      console.error("Twitch poll error:", err);
    }
  };

  poll();
  setInterval(poll, 60_000);
}
