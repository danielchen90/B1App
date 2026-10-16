import React from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";
import { JsonLd, btOrganizationNode } from "@/components/public-bt/BtJsonLd";

interface Props { config: ConfigurationInterface; }

/** The church's public address: its own site for Bible Teachers, else its ChurchApps subdomain. */
const churchUrl = (config: ConfigurationInterface): string =>
  "https://" + (config.church?.subDomain || config.keyName) + ".huro.church";

export function ChurchJsonLd({ config }: Props) {
  const church = config.church;
  if (!church?.name) return null;

  // Bible Teachers International has its own organization node on its own domain.
  if (isBtPublicSite(church.subDomain || config.keyName)) {
    return <JsonLd data={{ "@context": "https://schema.org", ...btOrganizationNode() }} />;
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: church.name,
    url: churchUrl(config)
  };

  const logo = config.appearance?.logoLight || config.appearance?.logoDark;
  if (logo) data.logo = logo;

  if (church.address1) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: church.address2 ? church.address1 + ", " + church.address2 : church.address1,
      addressLocality: church.city,
      addressRegion: church.state,
      postalCode: church.zip,
      addressCountry: church.country
    };
  }

  return <JsonLd data={data} />;
}
