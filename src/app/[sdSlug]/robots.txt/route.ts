import { NextRequest } from "next/server";
import { isBtPublicSite } from "../(public)/(bt)/isBtSite";
import { btSiteUrl } from "@/components/public-bt/btSeo";

export async function GET(request: NextRequest, context: { params: Promise<{ sdSlug: string }> }) {
  const { sdSlug } = await context.params;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || sdSlug + ".huro.church").split(",")[0].trim();
  const proto = request.headers.get("x-forwarded-proto") || "https";
  // Railway preview/internal hosts must never be indexed.
  if (/\.railway\.app(:\d+)?$/i.test(host)) {
    return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  }
  const bt = isBtPublicSite(sdSlug);
  const base = bt ? btSiteUrl() : proto + "://" + host;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /mobile/",
    "Disallow: /login",
    "Disallow: /logout",
    ...(bt ? ["Disallow: /my", "Disallow: /api/"] : []),
    "",
    "Sitemap: " + base + "/sitemap.xml"
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
