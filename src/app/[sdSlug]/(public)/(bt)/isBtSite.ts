// BT public-site tenant selector (Phase 20, Plan 04).
//
// The single seam that decides whether a given tenant renders the hardcoded Bible
// Teachers public brochure (this phase) instead of the CMS PageLayout / mobile
// redirect. Driven by an env allowlist of subdomains so no other tenant is affected
// and DNS cutover stays deferred — the stand-in (church.chensolutions.com) and any
// *.up.railway.app preview subdomain can be listed without touching code.
//
// churchId-scoping stays underneath; this only picks the RENDER. When Phase 21 adds
// data-driven per-tenant theming this selector is where "is this a BT-branded public
// site" generalizes (e.g. a church flag) — one place to change.

const DEFAULT_BT_SUBDOMAINS = ["bibleteachers", "bti", "church", "chensolutions"];

/**
 * True when `sdSlug` is a configured Bible Teachers public subdomain. Reads
 * NEXT_PUBLIC_BT_SUBDOMAINS (comma-separated) and falls back to the known stand-in
 * subdomains. Case-insensitive.
 */
export function isBtPublicSite(sdSlug: string | undefined | null): boolean {
  if (!sdSlug) return false;
  const raw = process.env.NEXT_PUBLIC_BT_SUBDOMAINS;
  const list = (raw && raw.trim())
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_BT_SUBDOMAINS;
  return list.includes(sdSlug.toLowerCase());
}
