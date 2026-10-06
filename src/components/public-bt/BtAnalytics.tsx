"use client";

// Mary Banks analytics on the Bible Teachers site: loads the shared script every Mary
// Banks site loads (ecosystem.mbmonline.global/analytics.js) and connects it to this
// site's own pieces:
//   consent   the site already asks through the Ask Mary banner (which also gates Google
//             Analytics), so the script runs with data-consent="external" and gets the
//             visitor's answer from here, on load and whenever it changes: one banner.
//   identity  a member is identified by their Mary Banks ID subject (the `bt_mbid`
//             cookie the sign-in callback sets), the same person on every Mary Banks
//             site; signing out (or the session ending) resets it.
//   clicks    links in server components carry data-mb-event / data-mb-props (see
//             trackAttrs in lib/analytics.ts); Mary Banks ID sign-in and sign-out links
//             are counted wherever they appear.

import React from "react";
import Script from "next/script";
import { identify, mbidSubject, resetAnalytics, setAnalyticsConsent, track } from "@/lib/analytics";
import { ASK_MARY_CONSENT_EVENT, readAskMaryConsent, type AskMaryConsent } from "@/components/askMary/useAskMaryConsent";

const SRC = process.env.NEXT_PUBLIC_MB_ANALYTICS_SRC || "https://ecosystem.mbmonline.global/analytics.js";
const IDENTIFIED_KEY = "bt.mbid";

const readCookie = (name: string): string | null => {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  if (!hit) return null;
  try { return decodeURIComponent(hit.slice(name.length + 1)) || null; } catch { return null; }
};

const store = {
  get: (): string | null => { try { return window.localStorage.getItem(IDENTIFIED_KEY); } catch { return null; } },
  set: (v: string | null) => { try { if (v) window.localStorage.setItem(IDENTIFIED_KEY, v); else window.localStorage.removeItem(IDENTIFIED_KEY); } catch { /* storage blocked */ } }
};

const onClick = (e: MouseEvent) => {
  const target = e.target as Element | null;
  if (!target?.closest) return;

  const tagged = target.closest("[data-mb-event]") as HTMLElement | null;
  if (tagged?.dataset.mbEvent) {
    let props: Record<string, any> | undefined;
    try { props = tagged.dataset.mbProps ? JSON.parse(tagged.dataset.mbProps) : undefined; } catch { props = undefined; }
    track(tagged.dataset.mbEvent, props);
  }

  const a = target.closest("a[href]") as HTMLAnchorElement | null;
  if (!a) return;
  let url: URL;
  try { url = new URL(a.href, window.location.href); } catch { return; }
  if (url.origin !== window.location.origin) return;
  if (url.pathname.endsWith("/api/auth/mbid/start")) {
    track("sign_in_started", { method: "mary_banks_id", target: url.searchParams.get("target") || "site", from_path: window.location.pathname });
  } else if (url.pathname.endsWith("/api/auth/mbid/logout")) {
    track("signed_out", { method: "mary_banks_id" });
    resetAnalytics();
    store.set(null);
  }
};

/** Sends one event when the page (or the props) first renders, e.g. church_viewed. */
export const TrackOnView: React.FC<{ event: string; props?: Record<string, string | number | boolean | null | undefined> }> = ({ event, props }) => {
  const key = event + JSON.stringify(props || {});
  React.useEffect(() => { track(event, props); }, [key]);
  return null;
};

export const BtAnalytics: React.FC = () => {
  // Consent: the stored answer on load, then every change from the Ask Mary banner.
  React.useEffect(() => {
    const apply = (c: AskMaryConsent | null) => { if (c) setAnalyticsConsent(c.analytics === true); };
    apply(readAskMaryConsent());
    const onConsent = (event: Event) => apply((event as CustomEvent<AskMaryConsent>).detail ?? null);
    window.addEventListener(ASK_MARY_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(ASK_MARY_CONSENT_EVENT, onConsent);
  }, []);

  // Identity: the Mary Banks ID subject when signed in; a reset once it is gone.
  React.useEffect(() => {
    const sub = mbidSubject();
    if (sub) {
      identify({ id: sub, name: readCookie("bt_member"), email: readCookie("email"), role: "member" });
      store.set(sub);
      if (readCookie("bt_signed_in")) {
        track("signed_in", { method: "mary_banks_id" });
        document.cookie = "bt_signed_in=; path=/; max-age=0; samesite=lax";
      }
    } else if (store.get()) {
      resetAnalytics();
      store.set(null);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <Script src={SRC} data-site="worship-centers" data-consent="external" strategy="afterInteractive" />;
};
