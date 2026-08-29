// Server helper for the ministry's sermon archive — reads the public YouTube RSS feed
// for the channel (no API key, no quota) and returns the latest full-length messages.
// Shorts are filtered by their "#shorts" title tag. Revalidates every 30 minutes via
// Next's fetch cache; any failure degrades to [] so the pages render without the grid.

import { cache } from "react";

export interface FeedSermon {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

const decode = (s: string): string =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * Latest full-length messages from a channel's RSS feed (max ~15 upstream), newest
 * first. `limit` trims the filtered list.
 */
export const loadSermonFeed = cache(async (channelId: string, limit = 12): Promise<FeedSermon[]> => {
  if (!channelId) return [];
  try {
    const res = await fetch(
      "https://www.youtube.com/feeds/videos.xml?channel_id=" + encodeURIComponent(channelId),
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const xml = await res.text();

    const entries = xml.split("<entry>").slice(1);
    const sermons: FeedSermon[] = [];
    for (const entry of entries) {
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const rawTitle = entry.match(/<media:title>([^<]*)<\/media:title>/)?.[1] ?? "";
      const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      if (!videoId) continue;
      const title = decode(rawTitle);
      if (/#shorts/i.test(title)) continue; // full messages only
      sermons.push({
        videoId,
        title,
        publishedAt,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      });
    }
    sermons.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    return sermons.slice(0, limit);
  } catch {
    return [];
  }
});
