// A policy page (privacy, terms, cookies) inside the site's own chrome. On the Bible
// Teachers public site it sits in the BT header and footer, so a reader who follows a
// footer link is never stranded; every other church keeps the plain policy page.

import React from "react";
import type { Metadata } from "next";
import { PolicyPage } from "./PolicyPage";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import type { PolicySlug } from "@/helpers/AskMaryPolicies";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "@/app/[sdSlug]/(public)/(bt)/btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { btSeo } from "@/components/public-bt/btSeo";
import { BT } from "@/components/public-bt/btSiteContent";
import { btConfigSlug } from "@/components/public-bt/requestSite";

const TITLES: Record<PolicySlug, string> = { privacy: "Privacy Policy", terms: "Terms of Use", cookies: "Cookie Policy" };
const DESCRIPTIONS: Record<PolicySlug, string> = {
  privacy: "How Mary Banks Ministries and Bible Teachers International collect, use and protect your information.",
  terms: "The terms for using the Mary Banks Ministries and Bible Teachers International sites.",
  cookies: "The cookies the Mary Banks Ministries and Bible Teachers International sites use, and your choices."
};

export async function sitePolicyMetadata(sdSlug: string, slug: PolicySlug): Promise<Metadata> {
  if (!isBtPublicSite(sdSlug)) return { title: TITLES[slug] };
  const config = await loadBtConfig(btConfigSlug(sdSlug));
  const title = TITLES[slug] + " | " + (config.church?.name || BT.name);
  return btSeo({ title, description: DESCRIPTIONS[slug], openGraph: { type: "website", title, description: DESCRIPTIONS[slug] } }, "/" + slug);
}

export async function SitePolicyPage({ sdSlug, slug }: { sdSlug: string; slug: PolicySlug }) {
  if (!isBtPublicSite(sdSlug)) return <PolicyPage slug={slug} />;
  await EnvironmentHelper.initServerSide();
  const config = await loadBtConfig(btConfigSlug(sdSlug));
  const campuses = await loadVisibleCampuses(config.church?.id || "");
  return (
    <BtShell config={config} campuses={toLocationLinks(campuses)}>
      <PolicyPage slug={slug} />
    </BtShell>
  );
}
