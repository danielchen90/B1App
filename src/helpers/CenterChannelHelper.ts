// Server helper for each worship center's own YouTube channel — the Watch pages and the
// center pages read it.
//
// Where a center's channel comes from, first match wins:
//   1. "Sermon YouTube channel" on the center's Website tab in Huro (campusContent.sermonYoutubeChannel)
//   2. "YouTube page" on the same tab (campusContent.youtubeUrl)
//   3. the in-repo extras distilled from the ministry's published site (btSiteContent)
// Each value may be a UC… channel id, a youtube.com/channel/UC… link, an @handle, or a
// youtube.com/@handle (or /c/, /user/) link. Handles are looked up once a day from the
// channel page's canonical link, since the RSS feed only takes the UC… id.
//
// A center with no channel resolves to null; callers fall back to the ministry channel.

import { cache } from "react";
import type { PublicCampus } from "./PublicCampusHelper";
import { loadAllCampusContent, loadCampusContent } from "./LocatorCampusHelper";
import { loadSermonFeed, type FeedSermon } from "./SermonFeedHelper";
import { getCampusExtras } from "@/components/public-bt/btSiteContent";
import { contentText } from "@/components/public-bt/campusContentTypes";

export interface CenterChannel {
  channelId: string;
  /** youtube.com/channel/UC… (append /live, /videos, ?sub_confirmation=1). */
  channelUrl: string;
}

export interface CenterLatest {
  channel: CenterChannel;
  /** Every center streaming on this channel (usually one), first is the card's name. */
  centers: PublicCampus[];
  latest: FeedSermon;
}

/** Centers whose newest message is older than this drop off the "every center" grid. */
export const ACTIVE_CHANNEL_DAYS = 120;

const UC_RE = /\b(UC[A-Za-z0-9_-]{22})\b/;

const channelOf = (channelId: string): CenterChannel => ({ channelId, channelUrl: "https://www.youtube.com/channel/" + channelId });

/** The channel page to look a handle up on, or null when the value isn't a YouTube channel. */
const handlePageUrl = (raw: string): string | null => {
  const v = raw.trim();
  if (/^@[\w.-]+$/.test(v)) return "https://www.youtube.com/" + v;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
    if (!/(^|\.)youtube\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(@[\w.-]+|c\/[\w.-]+|user\/[\w.-]+)/);
    return m ? "https://www.youtube.com/" + m[1] : null;
  } catch {
    return null;
  }
};

/** A channel reference in any accepted form → its UC… id, or null. Never throws. */
export const resolveChannelId = cache(async (raw: string | null | undefined): Promise<string | null> => {
  if (!raw) return null;
  const direct = raw.match(UC_RE)?.[1];
  if (direct) return direct;
  const page = handlePageUrl(raw);
  if (!page) return null;
  try {
    const res = await fetch(page, {
      headers: { "Accept-Language": "en-US,en;q=0.8", "User-Agent": "Mozilla/5.0 (compatible; BibleTeachersSite/1.0)" },
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/)?.[1];
    return canonical || html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/)?.[1] || null;
  } catch {
    return null;
  }
});

/** One center's channel from its resolved public content (already loaded) + extras. */
export const channelFromContent = async (content: any, slug: string | null): Promise<CenterChannel | null> => {
  const extras = getCampusExtras(slug);
  const candidates = [contentText(content?.sermonYoutubeChannel), contentText(content?.youtubeUrl), extras?.youtubeChannelId, extras?.youtubeUrl];
  for (const c of candidates) {
    if (!c) continue;
    const id = await resolveChannelId(c);
    if (id) return channelOf(id);
  }
  return null;
};

/** One center's channel (loads its public content). */
export const loadCenterChannel = cache(async (churchId: string, campus: PublicCampus): Promise<CenterChannel | null> => {
  const content = await loadCampusContent(churchId, campus.id);
  return channelFromContent(content, campus.slug);
});

/** Every given center paired with its channel (null when it has none), in the given order. */
export const loadCenterChannels = cache(async (churchId: string, campuses: PublicCampus[]): Promise<{ campus: PublicCampus; channel: CenterChannel | null }[]> => {
  const rawBulk = await loadAllCampusContent(churchId);
  // An API that predates /all answers it as a single campus read: only trust a campus-keyed object.
  const bulk = rawBulk && campuses.some((c) => Object.prototype.hasOwnProperty.call(rawBulk, c.id)) ? rawBulk : null;
  return Promise.all(campuses.map(async (campus) => {
    const content = bulk ? (bulk[campus.id] || {}) : await loadCampusContent(churchId, campus.id);
    return { campus, channel: await channelFromContent(content, campus.slug) };
  }));
});

/**
 * The newest message on every center channel that has streamed in the last
 * ACTIVE_CHANNEL_DAYS, newest first. Centers sharing a channel share one card.
 */
export const loadActiveCenterLatest = cache(async (churchId: string, campuses: PublicCampus[]): Promise<CenterLatest[]> => {
  const paired = await loadCenterChannels(churchId, campuses);
  const byChannel = new Map<string, { channel: CenterChannel; centers: PublicCampus[] }>();
  for (const { campus, channel } of paired) {
    if (!channel) continue;
    const row = byChannel.get(channel.channelId);
    if (row) row.centers.push(campus);
    else byChannel.set(channel.channelId, { channel, centers: [campus] });
  }
  const cutoff = Date.now() - ACTIVE_CHANNEL_DAYS * 86400000;
  const rows = await Promise.all([...byChannel.values()].map(async (r) => {
    const [latest] = await loadSermonFeed(r.channel.channelId, 1);
    return latest && new Date(latest.publishedAt).getTime() >= cutoff ? { ...r, latest } : null;
  }));
  return rows.filter((r): r is CenterLatest => !!r).sort((a, b) => (b.latest.publishedAt || "").localeCompare(a.latest.publishedAt || ""));
});
