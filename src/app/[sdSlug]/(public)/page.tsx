import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { ChurchJsonLd } from "@/components/seo/ChurchJsonLd";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import "@/styles/vendor/animations.css";
import { Animate } from "@churchapps/apphelper/website";
import { redirect } from "next/navigation";
import { isBtPublicSite } from "./(bt)/isBtSite";
import { BtLanding, buildBtMetadata } from "./(bt)/BtLanding";

type PageParams = { sdSlug: string; }


const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
};


export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  // BT public tenant → distinct BT landing SEO (SITE-03), sharing the cached loaders.
  if (isBtPublicSite(sdSlug)) return buildBtMetadata(props.config);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.config.church.name, props.pageData.title, undefined, props.config.appearance);
}

const loadData = async (sdSlug: string) => {
  const config = await ConfigHelper.load(sdSlug, "website");
  // Use the homePage already loaded in ConfigHelper instead of fetching it again
  const pageData: PageInterface = config.homePage || { url: null } as PageInterface;
  return { pageData, config };
};

export default async function Home({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);

  // BT public tenant → render the hardcoded Bible Teachers org-brochure landing
  // (Phase 20). A route group cannot own a second index page.tsx without a hard
  // parallel-route collision, so the shared index delegates the render here (per
  // the phase RESEARCH: "new BT landing ... replaces render for BT churchId").
  if (isBtPublicSite(sdSlug)) {
    return <BtLanding config={props.config} />;
  }

  if (!props.pageData?.url) {
    redirect("/mobile");
  } else {
    return (<>
      <Theme config={props.config} />
      <ChurchJsonLd config={props.config} />
      <PageLayout config={props.config} pageData={props.pageData} />
      <Animate />
    </>);
  }
}
