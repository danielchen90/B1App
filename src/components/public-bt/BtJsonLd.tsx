// Structured data (JSON-LD) for the Bible Teachers International public site: the site's
// own Organization and WebSite nodes, a Church node per worship center, VideoObject
// lists for the Watch pages and Event nodes for HURO event pages. Every node points at
// the shared Mary Banks Ministries identity (fixed @ids on marybanks.net). Only real data
// goes in: a field the center has not published is left out, never guessed.

import React from "react";
import { BT } from "./btSiteContent";
import { btSiteUrl, btOrgId, BT_SITE_NAME, BT_OG_IMAGE, MBM_ORG_ID, APOSTLE_REF } from "./btSeo";
import type { BtServiceTime } from "./btSiteContent";
import type { FeedSermon } from "@/helpers/SermonFeedHelper";

// "<" escaped so a value can never close the script tag.
export const JsonLd: React.FC<{ data: unknown }> = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
);

export const MINISTRY_SAME_AS = [
  "https://www.youtube.com/@MaryBanksMinistries",
  "https://www.facebook.com/marybanksministries",
  "https://www.instagram.com/marybanksministries",
  "https://www.tiktok.com/@marybanksministries",
  "https://t.me/iammarybanks",
  "https://apps.apple.com/app/id729245041"
];

/** The site's own brand node: Bible Teachers International, a division of Mary Banks Ministries. */
export const btOrganizationNode = () => {
  const base = btSiteUrl();
  return {
    "@type": "Organization",
    "@id": btOrgId(),
    name: BT.name,
    alternateName: BT_SITE_NAME,
    url: base + "/",
    logo: base + "/bt/icon-512.png",
    image: base + BT_OG_IMAGE,
    slogan: BT.tagline,
    founder: APOSTLE_REF,
    parentOrganization: { "@id": MBM_ORG_ID, name: BT.ministry, url: "https://marybanks.net" },
    sameAs: [BT.youtubeUrl]
  };
};

export const btWebSiteNode = () => {
  const base = btSiteUrl();
  return {
    "@type": "WebSite",
    "@id": base + "/#website",
    name: BT_SITE_NAME,
    url: base + "/",
    inLanguage: "en",
    publisher: { "@id": btOrgId() }
  };
};

/** Home page graph: WebSite + Organization + the ministry it belongs to. */
export const BtSiteJsonLd: React.FC = () => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@graph": [
        btWebSiteNode(),
        btOrganizationNode(),
        { "@type": "Organization", "@id": MBM_ORG_ID, name: BT.ministry, url: "https://marybanks.net", sameAs: MINISTRY_SAME_AS }
      ]
    }}
  />
);

export const breadcrumbs = (items: { name: string; path: string }[]) => {
  const base = btSiteUrl();
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: base + it.path }))
  };
};

// ── Worship centers ───────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, string[]> = { sun: ["Sunday"], mon: ["Monday"], tue: ["Tuesday"], wed: ["Wednesday"], thu: ["Thursday"], fri: ["Friday"], sat: ["Saturday"] };
const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Sunday" -> [Sunday]; "Wed & Fri" -> [Wednesday, Friday]; "Mon to Fri" -> Monday..Friday. Unknown -> []. */
const parseDays = (day: string): string[] => {
  const d = (day || "").toLowerCase();
  const range = d.match(/^(\w{3})\w*\s+(?:to|-)\s+(\w{3})/);
  if (range && DAY_MAP[range[1]] && DAY_MAP[range[2]]) {
    const a = DAY_ORDER.indexOf(DAY_MAP[range[1]][0]);
    const b = DAY_ORDER.indexOf(DAY_MAP[range[2]][0]);
    return a <= b ? DAY_ORDER.slice(a, b + 1) : [];
  }
  return d.split(/\s*(?:&|,|and)\s*/).flatMap((p) => DAY_MAP[p.trim().slice(0, 3)] || []);
};

/**
 * The next date a weekly service meets, written as local wall time ("2026-10-18T09:30"), from its
 * own days and start time only. "Today" is taken in Eastern time, where most centers are; a
 * service later today counts as the next one.
 */
const nextOccurrence = (days: string[], startTime: string): string => {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "long" })
      .formatToParts(now).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const todayIdx = DAY_ORDER.indexOf(parts.weekday);
  const nowHm = parts.hour + ":" + parts.minute;
  const offsets = days.map((d) => {
    let diff = (DAY_ORDER.indexOf(d) - todayIdx + 7) % 7;
    if (diff === 0 && startTime <= nowHm) diff = 7;
    return diff;
  });
  const base = Date.UTC(+parts.year, +parts.month - 1, +parts.day) + Math.min(...offsets) * 86400000;
  return new Date(base).toISOString().slice(0, 10) + "T" + startTime;
};

/** "9:00 AM ET" -> "09:00"; "9:00 & 11:00 AM" -> ["09:00", "11:00"]. Unparseable -> []. */
const parseTimes = (time: string): string[] => {
  const t = (time || "").toUpperCase();
  const ampm = t.match(/\b(AM|PM)\b/)?.[1];
  if (!ampm) return [];
  return Array.from(t.matchAll(/\b(\d{1,2}):(\d{2})\b/g)).map((m) => {
    let h = parseInt(m[1], 10) % 12;
    if (ampm === "PM") h += 12;
    return String(h).padStart(2, "0") + ":" + m[2];
  });
};

const US_STATES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY"
};
export const usStateAbbr = (state: string | null | undefined): string => {
  const s = (state || "").trim();
  if (/^[A-Z]{2}$/.test(s)) return s;
  return US_STATES[s.toLowerCase()] || s;
};

const COUNTRY_CODES: Record<string, string> = { "United States": "US", Jamaica: "JM", Bahamas: "BS", "Trinidad & Tobago": "TT", "Cayman Islands": "KY", Canada: "CA" };

export interface ChurchLdInput {
  slug: string;
  name: string;
  description: string;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  image?: string;
  website?: string;
  virtual?: boolean;
  serviceTimes: BtServiceTime[];
  sameAs: string[];
}

/** A Church node for one worship center, with breadcrumbs. */
export const btChurchGraph = (c: ChurchLdInput) => {
  const base = btSiteUrl();
  const url = base + "/locations/" + c.slug;
  const node: Record<string, unknown> = {
    // A worship center is both the place (Church) and the congregation that meets there.
    "@type": ["Church", "Organization"],
    "@id": url + "#church",
    name: BT.name + " " + c.name,
    alternateName: c.name,
    description: c.description,
    url,
    parentOrganization: { "@id": btOrgId(), name: BT.name },
    image: c.image ? (c.image.startsWith("http") ? c.image : base + c.image) : base + BT_OG_IMAGE
  };
  const street = (c.address1 || "").trim();
  // A P.O. box is a mailing address, not where people gather: leave it out of the place.
  const isPoBox = /^p\.?\s*o\.?\s*box\b/i.test(street);
  if (!c.virtual && (street || c.city)) {
    const country = COUNTRY_CODES[c.country || ""] || undefined;
    node.address = {
      "@type": "PostalAddress",
      ...(street && !isPoBox ? { streetAddress: street } : {}),
      ...(c.city ? { addressLocality: c.city.trim() } : {}),
      ...(c.state ? { addressRegion: country === "US" ? usStateAbbr(c.state) : c.state.trim() } : {}),
      ...(c.zip ? { postalCode: c.zip.trim() } : {}),
      ...(country ? { addressCountry: country } : {})
    };
  }
  if (!c.virtual && typeof c.latitude === "number" && typeof c.longitude === "number") {
    node.geo = { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude };
  }
  if (c.phone) node.telephone = c.phone.replace(/[^+\d]/g, "").replace(/^(\d)/, "+$1");
  if (c.email) node.email = c.email;
  if (c.sameAs.length) node.sameAs = Array.from(new Set(c.sameAs));
  if (c.website && c.virtual) node.sameAs = Array.from(new Set([...(node.sameAs as string[] || []), c.website]));

  // Weekly services, only when the day and the start time are both readable. No center
  // publishes when its services end, so these are not opening hours (which need a closing
  // time): each is a weekly Event with a Schedule (day + start time) and no end time.
  const services = c.serviceTimes.flatMap((t) => {
    const days = parseDays(t.day);
    const times = parseTimes(t.time);
    if (!days.length || !times.length) return [];
    return times.map((startTime) => ({
      "@type": "Event",
      name: (t.label || "Service") + ", " + BT.name + " " + c.name,
      startDate: nextOccurrence(days, startTime),
      eventSchedule: { "@type": "Schedule", repeatFrequency: "P1W", byDay: days.map((d) => "https://schema.org/" + d), startTime },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: c.virtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      location: c.virtual ? { "@type": "VirtualLocation", url } : { "@type": "Church", "@id": url + "#church", name: node.name, ...(node.address ? { address: node.address } : {}) },
      organizer: { "@id": url + "#church" },
      url,
      isAccessibleForFree: true
    }));
  });
  if (services.length) node.event = services;

  return {
    "@context": "https://schema.org",
    "@graph": [
      node,
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }, { name: c.name, path: "/locations/" + c.slug }])
    ]
  };
};

// ── Videos ────────────────────────────────────────────────────────────────────────

export const videoObject = (s: FeedSermon) => ({
  "@type": "VideoObject",
  "@id": "https://www.youtube.com/watch?v=" + s.videoId,
  name: s.title,
  description: s.description || s.title,
  thumbnailUrl: ["https://i.ytimg.com/vi/" + s.videoId + "/hqdefault.jpg"],
  uploadDate: s.publishedAt,
  embedUrl: "https://www.youtube.com/embed/" + s.videoId,
  contentUrl: "https://www.youtube.com/watch?v=" + s.videoId,
  publisher: { "@id": btOrgId() }
});

/** An ItemList of the page's messages as VideoObjects. */
export const btVideoListGraph = (path: string, name: string, sermons: FeedSermon[]) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      "@id": btSiteUrl() + path + "#videos",
      name,
      itemListElement: sermons.filter((s) => s.publishedAt).map((s, i) => ({ "@type": "ListItem", position: i + 1, item: videoObject(s) }))
    }
  ]
});

// ── Events ────────────────────────────────────────────────────────────────────────

/** An instant written in the event's own zone with its offset: "2026-11-14T19:00:00-05:00". */
export const isoInZone = (iso: string, timeZone: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(d).map((p) => [p.type, p.value])
    ) as Record<string, string>;
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    const offMin = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000);
    const sign = offMin < 0 ? "-" : "+";
    const abs = Math.abs(offMin);
    const off = sign + String(Math.floor(abs / 60)).padStart(2, "0") + ":" + String(abs % 60).padStart(2, "0");
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${off}`;
  } catch {
    return d.toISOString();
  }
};

const ONLINE_RE = /\b(online|zoom|virtual|live ?stream|youtube|facebook live|global church)\b/i;

export interface EventLdInput {
  slug: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  location: string | null;
  imageUrl: string | null;
  speakers?: { name: string; role: string }[];
  full?: boolean;
  registrationOpen?: boolean;
}

export const btEventNode = (e: EventLdInput) => {
  const base = btSiteUrl();
  const url = base + "/e/" + e.slug;
  const loc = (e.location || "").trim();
  const online = !loc || ONLINE_RE.test(loc);
  const inPerson = !!loc && !/^\s*(online|zoom|virtual)\s*$/i.test(loc);
  const mode = online && inPerson ? "MixedEventAttendanceMode" : online ? "OnlineEventAttendanceMode" : "OfflineEventAttendanceMode";
  const locations: unknown[] = [];
  if (online) locations.push({ "@type": "VirtualLocation", url });
  if (inPerson) locations.push({ "@type": "Place", name: loc, address: loc });
  const performers = (e.speakers || []).map((s) =>
    /\bmary banks\b/i.test(s.name) ? APOSTLE_REF : { "@type": "Person", name: s.name, ...(s.role ? { jobTitle: s.role } : {}) });
  const node: Record<string, unknown> = {
    "@type": "Event",
    "@id": url + "#event",
    name: e.title,
    description: e.description,
    url,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/" + mode,
    location: locations.length === 1 ? locations[0] : locations,
    image: [e.imageUrl || base + BT_OG_IMAGE],
    organizer: { "@type": "Organization", "@id": btOrgId(), name: BT.name, url: base + "/" },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      url,
      ...(e.full ? { availability: "https://schema.org/SoldOut" } : e.registrationOpen !== false ? { availability: "https://schema.org/InStock" } : {})
    },
    isAccessibleForFree: true
  };
  if (e.startsAt) node.startDate = isoInZone(e.startsAt, e.timezone);
  if (e.endsAt) node.endDate = isoInZone(e.endsAt, e.timezone);
  if (performers.length) node.performer = performers;
  return node;
};

// ── About and Give ────────────────────────────────────────────────────────────────

/** /about: an AboutPage about the site's own organization (a division of Mary Banks Ministries). */
export const btAboutPageGraph = (name: string, description: string) => {
  const base = btSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": base + "/about#webpage",
        url: base + "/about",
        name,
        description,
        inLanguage: "en",
        isPartOf: { "@id": base + "/#website" },
        about: { "@id": btOrgId() },
        mainEntity: { "@id": btOrgId() }
      },
      btOrganizationNode(),
      breadcrumbs([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])
    ]
  };
};

/** Where every gift to the ministry is made. */
export const MINISTRY_GIVE_URL = "https://marybanks.net/give";

/** /give: a WebPage whose action is a DonateAction to the ministry's giving page. */
export const btGivePageGraph = (name: string, description: string) => {
  const base = btSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": base + "/give#webpage",
        url: base + "/give",
        name,
        description,
        inLanguage: "en",
        isPartOf: { "@id": base + "/#website" },
        about: { "@id": btOrgId() },
        potentialAction: {
          "@type": "DonateAction",
          name: "Give to " + BT.name,
          target: { "@type": "EntryPoint", urlTemplate: MINISTRY_GIVE_URL },
          recipient: { "@id": btOrgId(), name: BT.name }
        }
      },
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Give", path: "/give" }])
    ]
  };
};
