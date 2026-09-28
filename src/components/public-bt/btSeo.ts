// Bible Teachers public-site SEO seam: canonical URL, Open Graph / Twitter cards and the
// ministry's own icons, layered on the stock MetaHelper output.
//
// The public origin comes from BT_SITE_URL (a runtime server variable on the B1App
// service). Today that is https://church.chensolutions.com; at the bibleteachers.com
// cutover change BT_SITE_URL to https://bibleteachers.com and canonical links, og:url,
// the sitemap and robots.txt all follow without a code change.

import type { Metadata } from "next";
import { BT } from "./btSiteContent";

const FALLBACK_SITE_URL = "https://church.chensolutions.com";

/** The site's public origin, no trailing slash. */
export const btSiteUrl = (): string => {
  const raw = (process.env.BT_SITE_URL || "").trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(raw) ? raw : FALLBACK_SITE_URL;
};

export const BT_OG_IMAGE = "/bt/og.jpg";

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
 * the ministry icons to a page's metadata. `path` is the public path ("/about").
 */
export function btSeo(meta: Metadata, path: string): Metadata {
  const base = btSiteUrl();
  const url = base + (path === "/" ? "/" : path.replace(/\/+$/, ""));
  const og = (meta.openGraph || {}) as NonNullable<Metadata["openGraph"]>;
  // The stock fallback image is ChurchApps' own card; use the ministry's instead.
  const ogImages = (og as any).images as { url?: string }[] | undefined;
  const stockImage = !ogImages?.length || String(ogImages[0]?.url || "").includes("content.churchapps.org/40/");
  const images = stockImage ? [{ url: base + BT_OG_IMAGE, width: 1200, height: 630, alt: BT.name }] : ogImages;
  const title = typeof meta.title === "string" ? meta.title : BT.name;
  const description = meta.description || undefined;
  return {
    ...meta,
    // Absolute: page titles already end with the site name, so skip the layout template.
    title: { absolute: title },
    metadataBase: new URL(base),
    alternates: { ...(meta.alternates || {}), canonical: url },
    openGraph: { ...og, url, siteName: BT.name, locale: "en_US", images } as Metadata["openGraph"],
    twitter: { card: "summary_large_image", title, description, images: images?.map((i: any) => i.url) },
    icons: BT_ICONS
  };
}
