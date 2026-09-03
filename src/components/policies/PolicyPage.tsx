import React from "react";
import { fetchPolicy, policyFallbackUrl, type PolicySlug } from "@/helpers/AskMaryPolicies";

const FALLBACK_TITLES: Record<PolicySlug, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Use",
  cookies: "Cookie Policy"
};

// Plain, readable document styling: a centered column in the site's Roboto,
// independent of any church's theme. RSC-safe (no client hooks).
const container: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "48px 24px 96px",
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  color: "#222",
  lineHeight: 1.7,
  fontSize: "1rem"
};

const PROSE_CSS = `
.mbm-policy h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 0 0 8px; }
.mbm-policy .mbm-policy-updated { color: #666; font-size: 0.9rem; margin: 0 0 32px; padding-bottom: 20px; border-bottom: 1px solid #e3e3e3; }
.mbm-policy h2 { font-size: 1.35rem; font-weight: 700; margin: 36px 0 12px; }
.mbm-policy h3 { font-size: 1.1rem; font-weight: 700; margin: 28px 0 8px; }
.mbm-policy p { margin: 0 0 16px; }
.mbm-policy ul, .mbm-policy ol { margin: 0 0 16px; padding-left: 28px; }
.mbm-policy li { margin: 4px 0; }
.mbm-policy a { color: #1a5fb4; text-decoration: underline; }
.mbm-policy table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.mbm-policy th, .mbm-policy td { text-align: left; padding: 8px; border-top: 1px solid #e3e3e3; vertical-align: top; }
`;

/**
 * Server-rendered page for one of the ecosystem-wide policies (privacy,
 * terms, cookies) fetched from Ask Mary. Locale is English on this site.
 */
export async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const policy = await fetchPolicy(slug, "en");
  const title = policy?.title || FALLBACK_TITLES[slug];
  const updated = formatUpdated(policy?.updatedAt);
  const fallbackUrl = policyFallbackUrl(slug);

  return (
    <div className="mbm-policy" style={container}>
      <style>{PROSE_CSS}</style>
      <h1>{title}</h1>
      {updated && <p className="mbm-policy-updated">Updated {updated}</p>}
      {policy ? (
        <div dangerouslySetInnerHTML={{ __html: policy.html }} />
      ) : (
        <p>
          The policy could not be loaded right now; read it at{" "}
          <a href={fallbackUrl} rel="noopener noreferrer">{fallbackUrl}</a>.
        </p>
      )}
    </div>
  );
}

function formatUpdated(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}
