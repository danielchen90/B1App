// My Church — /my. The member's church home, organized like the Faith Library and
// Global Training Center dashboards. Signed-in only (Mary Banks ID).

import React from "react";
import { notFound } from "next/navigation";
import { memberSignInEnabled } from "@/lib/memberSignIn";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { loadDailyVerse } from "@/helpers/DailyVerseHelper";
import { loadBtConfig, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { MyChurch } from "@/components/public-bt/my/MyChurch";
import { BT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const meta = MetaHelper.getMetaData("My Church | " + (config.church?.name || BT.name), "Your worship center, classes, serving and giving.", "", config.appearance);
  return { ...meta, robots: { index: false, follow: false } };
}

export default async function MyChurchPage({ params }: { params: Promise<PageParams> }) {
  // Hidden until member sign-in is switched on for this deployment.
  if (!memberSignInEnabled()) notFound();
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const [centers, sermons, dailyVerse] = await Promise.all([
    loadLocatorCampuses(churchId),
    loadSermonFeed(BT.youtubeChannelId, 1),
    loadDailyVerse()
  ]);
  return (
    <BtShell config={config} campuses={toLocationLinks(centers)}>
      <MyChurch subDomain={config.church?.subDomain || sdSlug} churchId={churchId} centers={centers} latest={sermons[0] || null} dailyVerse={dailyVerse} />
    </BtShell>
  );
}
