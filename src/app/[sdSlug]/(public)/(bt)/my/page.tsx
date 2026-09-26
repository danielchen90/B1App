// My Church — /my. The member's own side of the church: their center, details,
// emails, giving, partnership, classes, serving, requests and credentials. Signed-in
// only (Mary Banks ID); signed-out visitors get a short explanation and Sign in.

import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { MyChurch } from "@/components/public-bt/my/MyChurch";
import { BT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const title = "My Church | " + (config.church?.name || BT.name);
  const meta = MetaHelper.getMetaData(title, "Your worship center, details, giving and more.", "", config.appearance);
  return { ...meta, robots: { index: false, follow: false } };
}

export default async function MyChurchPage({ params }: { params: Promise<PageParams> }) {
  // Hidden until member sign-in is switched on for this deployment.
  if (process.env.NEXT_PUBLIC_BT_MEMBER_SIGNIN !== "1") notFound();
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const centers = await loadLocatorCampuses(churchId);
  return (
    <BtShell config={config} campuses={toLocationLinks(centers)}>
      <MyChurch subDomain={config.church?.subDomain || sdSlug} churchId={churchId} centers={centers} />
    </BtShell>
  );
}
