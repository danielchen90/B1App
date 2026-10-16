// The Bible Teachers home page ("/"). next.config rewrites "/" here for the Bible Teachers
// tenants (a bare /bt-home request is sent back to "/" by the middleware), so the shared
// stock index page and its ChurchApps / MUI client bundles stay off this page.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { isBtPublicSite } from "../isBtSite";
import { loadBtConfig } from "../btPageData";
import { BtLanding, buildBtMetadata } from "../BtLanding";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  if (!isBtPublicSite(sdSlug)) return {};
  return buildBtMetadata(await loadBtConfig(sdSlug));
}

export default async function BtHomePage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  if (!isBtPublicSite(sdSlug)) notFound();
  return <BtLanding config={await loadBtConfig(sdSlug)} />;
}
