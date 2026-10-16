// Server helper for the ministry's sermon archive — reads the public YouTube RSS feed
// for the channel (no API key, no quota) and returns the latest full-length messages.
// Shorts are filtered by their /shorts/ link (or a "#shorts" title tag). Revalidates every 30 minutes via
// Next's fetch cache; any failure degrades to [] so the pages render without the grid.

import { cache } from "react";

export interface FeedSermon {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  /** The first part of the video's description (structured data). */
  description?: string;
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
  const fromRss = await loadFromRss(channelId, limit);
  // YouTube's RSS feed often answers 404/500 to data-center addresses (Railway); fall back to
  // the Data API's uploads playlist when a server key is configured (YOUTUBE_API_KEY).
  return fromRss.length ? fromRss : loadFromDataApi(channelId, limit);
});

// globalchurch.site has lapsed (it is a for-sale page now); older descriptions still point to it.
const globalChurchLink = (_: string, path = ""): string =>
  /^\/prayer\b/i.test(path) ? "https://globalchurch.marybanks.net/prayer" : "https://globalchurch.marybanks.net";

const cleanDescription = (raw: string): string =>
  decode(raw).replace(/(?:https?:\/\/)?(?:www\.)?globalchurch\.site(\/[^\s"<]*)?/gi, globalChurchLink)
    .replace(/\s+/g, " ").replace(/\u2014/g, ",")
    .replace(/\bDr\.?\s+Mary\s+Banks\b/g, "Apostle Mary Banks").replace(/\s*\(?\bKJV\b\)?/g, "").trim().slice(0, 300);

/** ISO 8601 duration ("PT1H2M3S") in seconds. */
const durationSeconds = (iso: string): number => {
  const m = (iso || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
};

async function loadFromDataApi(channelId: string, limit: number): Promise<FeedSermon[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !/^UC[\w-]{22}$/.test(channelId)) return [];
  try {
    const api = "https://www.googleapis.com/youtube/v3/";
    const list = await fetch(api + "playlistItems?part=snippet&maxResults=25&playlistId=UU" + channelId.slice(2) + "&key=" + encodeURIComponent(key), { next: { revalidate: 1800 } });
    if (!list.ok) return [];
    const items: any[] = ((await list.json()) as any).items || [];
    const ids = items.map((i) => i.snippet?.resourceId?.videoId).filter(Boolean);
    if (!ids.length) return [];
    // Durations, to leave out Shorts (3 minutes or less) the way the RSS path does by link.
    const vids = await fetch(api + "videos?part=contentDetails&id=" + ids.join(",") + "&key=" + encodeURIComponent(key), { next: { revalidate: 1800 } });
    const dur = new Map<string, number>();
    if (vids.ok) (((await vids.json()) as any).items || []).forEach((v: any) => dur.set(v.id, durationSeconds(v.contentDetails?.duration)));
    const sermons: FeedSermon[] = [];
    for (const i of items) {
      const sn = i.snippet || {};
      const videoId: string = sn.resourceId?.videoId;
      const title = String(sn.title || "");
      if (!videoId || /#shorts/i.test(title) || title === "Private video" || title === "Deleted video") continue;
      if (dur.has(videoId) && (dur.get(videoId) as number) <= 180) continue;
      const description = cleanDescription(String(sn.description || ""));
      sermons.push({
        videoId,
        title,
        publishedAt: String(sn.publishedAt || ""),
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        ...(description ? { description } : {})
      });
    }
    sermons.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    return sermons.slice(0, limit);
  } catch {
    return [];
  }
}

async function loadFromRss(channelId: string, limit: number): Promise<FeedSermon[]> {
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
      const rawDesc = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "";
      const description = cleanDescription(rawDesc);
      if (/#shorts/i.test(title) || /<link rel="alternate" href="[^"]*\/shorts\//.test(entry)) continue; // full messages only
      sermons.push({
        videoId,
        title,
        publishedAt,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        ...(description ? { description } : {})
      });
    }
    sermons.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    return sermons.slice(0, limit);
  } catch {
    return [];
  }
}
