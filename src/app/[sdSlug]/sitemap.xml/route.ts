import { NextRequest } from "next/server";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";
import { isBtPublicSite } from "../(public)/(bt)/isBtSite";
import { btSiteUrl } from "@/components/public-bt/btSeo";
import { isHiddenCampusSlug } from "@/components/public-bt/btSiteContent";

// The Bible Teachers public pages that are not CMS pages.
const BT_SITEMAP_PAGES = ["/locations", "/watch", "/events", "/next-steps", "/about", "/give", "/privacy", "/terms", "/cookies"];

interface SitemapPage { url?: string; title?: string; }

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const getBaseUrl = (request: NextRequest, sdSlug: string) => {
  // The Bible Teachers site lists its canonical origin (BT_SITE_URL), whatever host asked.
  if (isBtPublicSite(sdSlug)) return btSiteUrl();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || sdSlug + ".huro.church";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return proto + "://" + host;
};

export async function GET(request: NextRequest, context: { params: Promise<{ sdSlug: string }> }) {
  const { sdSlug } = await context.params;
  EnvironmentHelper.init();
  const base = getBaseUrl(request, sdSlug);
  const urls = new Set<string>(["/"]);
  if (isBtPublicSite(sdSlug)) BT_SITEMAP_PAGES.forEach((p) => urls.add(p));

  try {
    const membershipApi = ApiHelper.getConfig("MembershipApi")?.url;
    const contentApi = ApiHelper.getConfig("ContentApi")?.url;
    const churchResponse = await fetch(membershipApi + "/churches/lookup/?subDomain=" + sdSlug, { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
    const church = churchResponse.ok ? await churchResponse.json() : null;
    if (church?.id) {
      // Endpoint added alongside this route; older API deploys 404 and we fall back to the home page.
      const pagesResponse = await fetch(contentApi + "/pages/public/" + church.id, { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
      if (pagesResponse.ok) {
        const pages: SitemapPage[] = await pagesResponse.json();
        pages.forEach((p) => { if (p.url?.startsWith("/")) urls.add(p.url); });
      }

      // Public campus slugs → /locations/{slug} (Phase 20, SITE-03: per-campus pages crawlable).
      // membershipApi already ends in "/membership"; the 20-01 controller is
      // @controller("/membership/public") route "/:churchId/campuses" → client path "/public/...".
      // Older API deploys 404 here too and we keep whatever urls we already gathered.
      const campusesResponse = await fetch(membershipApi + "/public/" + church.id + "/campuses", { next: { revalidate: 3600, tags: [sdSlug] } } as RequestInit);
      if (campusesResponse.ok) {
        const campuses: { slug?: string | null }[] = await campusesResponse.json();
        campuses.forEach((c) => { if (c.slug && !isHiddenCampusSlug(c.slug)) urls.add("/locations/" + c.slug); });
      }
    }
  } catch { /* fall back to home page only */ }

  const body = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    + "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    + Array.from(urls).map((u) => "  <url><loc>" + escapeXml(base + u) + "</loc></url>").join("\n")
    + "\n</urlset>";
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
