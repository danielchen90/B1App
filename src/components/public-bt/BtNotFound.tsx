// Branded "page not found" for the Bible Teachers public site. not-found files get no
// route params, so the tenant is read from the request: the x-site header the custom
// domain middleware sets, else the host's first label. Other churches get a plain page.

import React from "react";
import Link from "next/link";
import { requestSiteSlug, btConfigSlug } from "./requestSite";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "@/app/[sdSlug]/(public)/(bt)/btPageData";
import { BtShell } from "./BtShell";
import { BtPageHead } from "./BtPageHead";
import { IconPin, IconPlay } from "./BtIcons";

const PlainNotFound = () => (
  <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center", fontFamily: "Roboto, Helvetica, Arial, sans-serif" }}>
    <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>Page not found</h1>
    <p style={{ color: "#555", margin: "0 0 24px" }}>The page you were looking for isn&rsquo;t here.</p>
    <a href="/" style={{ color: "#1a5fb4", fontWeight: 700 }}>Go to the home page</a>
  </div>
);

export async function BtNotFound() {
  const slug = await requestSiteSlug();
  if (!isBtPublicSite(slug)) return <PlainNotFound />;
  let config;
  let campuses: ReturnType<typeof toLocationLinks> = [];
  try {
    await EnvironmentHelper.initServerSide();
    config = await loadBtConfig(btConfigSlug(slug));
    campuses = toLocationLinks(await loadVisibleCampuses(config.church?.id || ""));
  } catch {
    return <PlainNotFound />;
  }
  return (
    <BtShell config={config} campuses={campuses}>
      <BtPageHead
        eyebrow="Page not found"
        title={<>This page <em style={{ fontStyle: "italic", color: "var(--bt-gold-deep)" }}>isn&rsquo;t here.</em></>}
        lede="The link may be old, or the page may have moved. These will take you somewhere good."
        actions={
          <>
            <Link className="bt-btn" href="/">Go to the home page</Link>
            <Link className="bt-btn bt-btn-outline" href="/locations"><IconPin size={17} /> Find a worship center</Link>
            <Link className="bt-btn bt-btn-outline" href="/watch"><IconPlay size={17} /> Watch</Link>
          </>
        }
      />
    </BtShell>
  );
}
