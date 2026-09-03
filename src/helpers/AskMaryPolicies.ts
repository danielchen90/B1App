/**
 * Ask Mary policies — the privacy policy, terms of use and cookie policy are
 * one text for every Mary Banks Ministries site, served by GTC
 * (mbmonline.global) from `GET /api/ask-mary/v1/policies/:slug?locale=xx`.
 * See lib/ask-mary/README.md in the GTC repo ("Consent, policies, and the
 * growth-path invitation") for the contract.
 *
 * Server-only: call from server components. Every failure is swallowed and
 * returns null so a policy outage never takes a page down; the page then
 * points the reader at the canonical copy on mbmonline.global.
 */

export const ASK_MARY_ORIGIN = (process.env.NEXT_PUBLIC_ASK_MARY_URL || "https://mbmonline.global").replace(/\/+$/, "");

export const POLICY_SLUGS = ["privacy", "terms", "cookies"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export interface Policy {
  slug: PolicySlug;
  title: string;
  locale: string;
  version: string;
  updatedAt: string;
  markdown: string;
  /** Sanitized HTML of the policy, ready for dangerouslySetInnerHTML. */
  html: string;
}

/** Where the canonical copy lives, for the fallback message. */
export function policyFallbackUrl(slug: PolicySlug): string {
  return `${ASK_MARY_ORIGIN}/${slug}`;
}

/** Fetch one policy in a locale; null when the service is down or answers non-200. */
export async function fetchPolicy(slug: PolicySlug, locale = "en"): Promise<Policy | null> {
  const url = `${ASK_MARY_ORIGIN}/api/ask-mary/v1/policies/${slug}?locale=${encodeURIComponent(locale)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      console.error(`[ask-mary] policy ${slug} (${locale}) answered ${res.status}`);
      return null;
    }
    const data = (await res.json()) as Partial<Policy> | null;
    if (!data || typeof data.html !== "string" || typeof data.title !== "string") {
      console.error(`[ask-mary] policy ${slug} (${locale}) returned an unexpected body`);
      return null;
    }
    return {
      slug,
      title: data.title,
      locale: data.locale || locale,
      version: data.version ?? "",
      updatedAt: data.updatedAt ?? "",
      markdown: data.markdown ?? "",
      html: data.html
    };
  } catch (error) {
    console.error(`[ask-mary] policy ${slug} (${locale}) could not be loaded:`, error);
    return null;
  }
}
