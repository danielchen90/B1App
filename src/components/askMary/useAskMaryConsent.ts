"use client";

import { useEffect, useState } from "react";

/** One consent for every Mary Banks Ministries site, kept on the Ask Mary profile. */
export interface AskMaryConsent {
  version: number;
  necessary: true;
  personalization: boolean;
  analytics: boolean;
  acceptedAt: string;
  site: string;
}

/** Fired on `window` (detail = AskMaryConsent) whenever the visitor's consent changes. */
export const ASK_MARY_CONSENT_EVENT = "askmary:consent";

/** Where the embed keeps the answer in this browser (same origin as the page). */
const ASK_MARY_CONSENT_KEY = "ask-mary:consent";

/** The answer stored on an earlier visit, so it applies before the embed has loaded. */
function readStoredConsent(): AskMaryConsent | null {
  try {
    const raw = window.localStorage.getItem(ASK_MARY_CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.analytics === "boolean" && typeof v.personalization === "boolean" ? (v as AskMaryConsent) : null;
  } catch {
    return null;
  }
}

/** The consent the embed currently holds (or stored on an earlier visit); null when no choice is made. */
export function readAskMaryConsent(): AskMaryConsent | null {
  if (typeof window === "undefined") return null;
  try {
    return window.AskMary?.consent?.() ?? readStoredConsent();
  } catch {
    return readStoredConsent();
  }
}

/**
 * The visitor's Ask Mary consent, live. Hosts gate their own analytics on
 * `consent.analytics`; nothing should load until it is true.
 */
export function useAskMaryConsent(): AskMaryConsent | null {
  const [consent, setConsent] = useState<AskMaryConsent | null>(null);

  useEffect(() => {
    setConsent(readAskMaryConsent());
    const onConsent = (event: Event) => setConsent((event as CustomEvent<AskMaryConsent>).detail ?? null);
    window.addEventListener(ASK_MARY_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(ASK_MARY_CONSENT_EVENT, onConsent);
  }, []);

  return consent;
}
