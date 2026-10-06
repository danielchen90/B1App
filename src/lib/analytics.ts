// Mary Banks analytics (one PostHog project for every Mary Banks site). The hosted
// script (https://ecosystem.mbmonline.global/analytics.js, loaded by BtAnalytics) owns
// PostHog itself; this helper only queues calls on window.mbaq until it has loaded.
// Event and property names follow ~/mb-ecosystem/ANALYTICS.md. Never put prayer text,
// messages, notes or passwords in properties: ids, titles, counts and categories only.

type Props = Record<string, string | number | boolean | null | undefined | string[]>;
const q = () => ((window as any).mbaq = (window as any).mbaq || []);
export const track = (event: string, props?: Props) => { if (typeof window !== "undefined") q().push(["track", event, props]); };
export const identify = (user: { id: string; email?: string | null; name?: string | null; [k: string]: unknown }) => { if (typeof window !== "undefined") q().push(["identify", user]); };
export const resetAnalytics = () => { if (typeof window !== "undefined") q().push(["reset"]); };

/** Hands the visitor's answer from this site's own consent banner (Ask Mary's) to the script; only acts when it differs. */
export const setAnalyticsConsent = (granted: boolean) => {
  if (typeof window === "undefined") return;
  const apply = (p: { get_explicit_consent_status?: () => string }) => {
    if (p.get_explicit_consent_status?.() === (granted ? "granted" : "denied")) return;
    (window as any).mbAnalytics?.consent(granted);
  };
  q().push(["ready", apply]);
};

/** The signed-in member's Mary Banks ID subject (the `bt_mbid` cookie set at sign-in), or null. */
export const mbidSubject = (): string | null => {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith("bt_mbid="));
  return hit ? decodeURIComponent(hit.slice("bt_mbid=".length)) || null : null;
};

/**
 * Data attributes that make an element send an event when clicked, for links in server
 * components (BtAnalytics listens for clicks on [data-mb-event]).
 */
export const trackAttrs = (event: string, props?: Props): Record<string, string> => {
  const attrs: Record<string, string> = { "data-mb-event": event };
  if (props) attrs["data-mb-props"] = JSON.stringify(props);
  return attrs;
};
