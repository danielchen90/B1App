"use client";

import Script from "next/script";
import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AskMaryConsent } from "./useAskMaryConsent";

/**
 * Ask Mary — the Mary Banks Ministries assistant, hosted by the Global
 * Training Center (mbmonline.global) and embedded here as a script. This site
 * has no shared sign-in yet, so Mary runs in guest mode; a visitor who follows
 * her into GTC or the Faith Library and signs in keeps the conversation.
 */

const ASK_MARY_URL = process.env.NEXT_PUBLIC_ASK_MARY_URL || "https://mbmonline.global";
const SITE_ID = "huro";

type AskMaryGlobal = {
  configure: (cfg: Record<string, unknown>) => void;
  setContext: (ctx: Record<string, unknown> | null) => void;
  /** The visitor's current consent (see useAskMaryConsent), or null before they have chosen. */
  consent?: () => AskMaryConsent | null;
  q?: unknown[];
};

declare global {
  interface Window {
    AskMary?: AskMaryGlobal;
  }
}

function contextFor(pathname: string) {
  // Huro pages are /[churchSlug]/... ; the first segment names the church.
  const [slug, ...rest] = pathname.split("/").filter(Boolean);
  return {
    path: pathname,
    url: typeof window !== "undefined" ? window.location.href : pathname,
    title: typeof document !== "undefined" ? document.title : "",
    entity: slug ? { type: "church", slug, page: rest.join("/") || "home" } : undefined,
  };
}

export function AskMary() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const configure = useCallback(() => {
    if (typeof window === "undefined") return;
    // Queue calls until the embed loads (it replays window.AskMary.q).
    if (!window.AskMary) {
      const q: unknown[] = [];
      const stub = { q } as unknown as AskMaryGlobal;
      for (const m of ["configure", "open", "close", "ask", "setContext", "hide", "show"]) {
        (stub as unknown as Record<string, unknown>)[m] = (...args: unknown[]) => q.push([m, ...args]);
      }
      window.AskMary = stub;
    }
    window.AskMary.configure({
      site: SITE_ID,
      context: () => contextFor(window.location.pathname),
      onNavigate: (href: string) => {
        try {
          const target = new URL(href, window.location.href);
          if (target.origin === window.location.origin) router.push(target.pathname + target.search + target.hash);
          else window.location.assign(target.toString());
        } catch {
          /* ignore malformed hrefs */
        }
      },
    });
  }, [router]);

  useEffect(() => {
    configure();
  }, [configure]);

  useEffect(() => {
    window.AskMary?.setContext?.(contextFor(pathname));
  }, [pathname]);

  return <Script src={`${ASK_MARY_URL}/ask-mary/embed.js`} strategy="afterInteractive" onReady={configure} />;
}
