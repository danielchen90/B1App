// The tenant slug for the current request, for server code that gets no route params
// (the root layout's metadata, not-found pages): the x-site header the custom-domain
// middleware sets, else the host's first label.

import { headers } from "next/headers";

export async function requestSiteSlug(): Promise<string> {
  const h = await headers();
  const site = h.get("x-site") || h.get("x-forwarded-host") || h.get("host") || "";
  return site.split(",")[0].trim().split(".")[0].toLowerCase();
}

/** The Bible Teachers church's subdomain for a stand-in host label ("church" for church.chensolutions.com). */
export const btConfigSlug = (slug: string): string => (slug === "church" || slug === "chensolutions" ? "bti" : slug);
