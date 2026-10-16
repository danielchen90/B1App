// The stock ChurchApps CMS home page (every church except the Bible Teachers site, which
// renders BtLanding). Kept in its own module and wrapped in the stock client providers
// (the shared public layout no longer adds them).

import ClientLayout from "@/app/ClientLayout";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { ChurchJsonLd } from "@/components/seo/ChurchJsonLd";
import "@/styles/vendor/animations.css";
import { Animate } from "@churchapps/apphelper/website";
import type { PageInterface } from "@/helpers/interfaces";
import type { ConfigurationInterface } from "@/helpers/ConfigHelper";

export function StockHome({ config, pageData }: { config: ConfigurationInterface; pageData: PageInterface }) {
  return (<ClientLayout>
    <Theme config={config} />
    <ChurchJsonLd config={config} />
    <PageLayout config={config} pageData={pageData} />
    <Animate />
  </ClientLayout>);
}
