// My details — /my/profile. Part of My Church; signed-in only.

import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { memberSignInEnabled } from "@/lib/memberSignIn";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { MyProfile } from "@/components/public-bt/my/MyProfile";
import { BT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const meta = MetaHelper.getMetaData("My details | " + (config.church?.name || BT.name), "My details in My Church.", "", config.appearance);
  return { ...meta, robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<PageParams> }) {
  if (!memberSignInEnabled()) notFound();
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const centers = await loadLocatorCampuses(config.church?.id || "");
  return (
    <BtShell config={config} campuses={toLocationLinks(centers)}>
      <MyProfile subDomain={config.church?.subDomain || sdSlug} centers={centers} />
    </BtShell>
  );
}
