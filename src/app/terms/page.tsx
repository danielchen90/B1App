import type { Metadata } from "next";
import { SitePolicyPage, sitePolicyMetadata } from "@/components/policies/SitePolicyPage";
import { requestSiteSlug } from "@/components/public-bt/requestSite";

// Served straight from the filesystem (ahead of the tenant rewrite), so the church is
// read from the request host.
export async function generateMetadata(): Promise<Metadata> {
  return sitePolicyMetadata(await requestSiteSlug(), "terms");
}

export default async function TermsPage() {
  return <SitePolicyPage sdSlug={await requestSiteSlug()} slug="terms" />;
}
