// Bible Teachers public-site SEO seam: canonical URL, Open Graph / Twitter cards and the
// ministry's own icons, layered on the stock MetaHelper output.
//
// The public origin comes from BT_SITE_URL (a runtime server variable on the B1App
// service). Today that is https://churches.marybanks.net; at the bibleteachers.com
// cutover change BT_SITE_URL to https://bibleteachers.com and canonical links, og:url,
// the sitemap and robots.txt all follow without a code change.

import type { Metadata } from "next";
import { BT } from "./btSiteContent";

const FALLBACK_SITE_URL = "https://churches.marybanks.net";

/** The site's public origin, no trailing slash. */
export const btSiteUrl = (): string => {
  const raw = (process.env.BT_SITE_URL || "").trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(raw) ? raw : FALLBACK_SITE_URL;
};

export const BT_OG_IMAGE = "/bt/og.jpg";

/** Brand suffix on every page title, and the og:site_name. */
export const BT_SITE_BRAND = "Worship Centers";
export const BT_SITE_NAME = "Bible Teachers International Worship Centers";

/** "<page> | Worship Centers", dropping the suffix when the whole title would pass 65 characters. */
export const btTitle = (page: string): string => {
  const full = page + " | " + BT_SITE_BRAND;
  return full.length <= 65 ? full : page;
};

/** Trim a description to at most `max` characters on a word boundary. */
export const btDescription = (text: string, max = 160): string => {
  const clean = (text || "").replace(/\s+/g, " ").replace(/\u2014/g, ",").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return (at > 80 ? cut.slice(0, at) : cut).replace(/[,;:.\s]+$/, "") + "\u2026";
};

// Shared identity across the Mary Banks Ministries sites (fixed @ids).
export const MBM_ORG_ID = "https://marybanks.net/#organization";
export const APOSTLE_ID = "https://marybanks.net/#apostle-mary-banks";
export const APOSTLE_REF = { "@type": "Person", "@id": APOSTLE_ID, name: "Apostle Mary Banks", url: "https://marybanks.net/apostle-mary-banks" };
export const btOrgId = (): string => btSiteUrl() + "/#organization";

export const BT_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/bt/favicon-32.png", sizes: "32x32", type: "image/png" },
    { url: "/bt/favicon-48.png", sizes: "48x48", type: "image/png" },
    { url: "/bt/icon-192.png", sizes: "192x192", type: "image/png" }
  ],
  shortcut: "/bt/favicon-32.png",
  apple: [{ url: "/bt/apple-touch-icon.png", sizes: "180x180" }]
};

/**
 * Adds the BT canonical URL, og:url / site name / image, a large Twitter card and
 * the ministry icons to a page's metadata. `path` is the public path ("/about");
 * `opts.image` is the page's own share photo (absolute or site-relative), when it has one.
 */
export function btSeo(meta: Metadata, path: string, opts: { image?: string | null; imageAlt?: string } = {}): Metadata {
  const base = btSiteUrl();
  const url = base + (path === "/" ? "/" : path.replace(/\/+$/, ""));
  const og = (meta.openGraph || {}) as NonNullable<Metadata["openGraph"]>;
  // The stock fallback image is ChurchApps' own card; use the ministry's instead.
  const ogImages = (og as any).images as { url?: string }[] | undefined;
  const stockImage = !ogImages?.length || String(ogImages[0]?.url || "").includes("content.churchapps.org/40/");
  // A page's own photograph (a worship center's campus photo) wins over the shared card.
  const own = (opts.image || "").trim();
  const ownUrl = own ? (/^https?:\/\//.test(own) ? own : base + (own.startsWith("/") ? own : "/" + own)) : "";
  const images = ownUrl
    ? [{ url: ownUrl, alt: opts.imageAlt || BT.name }]
    : stockImage ? [{ url: base + BT_OG_IMAGE, width: 1200, height: 630, alt: BT.name }] : ogImages;
  const title = typeof meta.title === "string" ? meta.title : BT.name;
  const description = meta.description || undefined;
  return {
    ...meta,
    // Absolute: page titles already end with the site name, so skip the layout template.
    title: { absolute: title },
    metadataBase: new URL(base),
    alternates: { ...(meta.alternates || {}), canonical: url },
    openGraph: { ...og, url, siteName: BT_SITE_NAME, locale: "en_US", images } as Metadata["openGraph"],
    twitter: { card: "summary_large_image", title, description, images: images?.map((i: any) => i.url) },
    icons: BT_ICONS
  };
}
