import type { Metadata } from "next";
import { SitePolicyPage, sitePolicyMetadata } from "@/components/policies/SitePolicyPage";

type PageParams = Promise<{ sdSlug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  return sitePolicyMetadata(sdSlug, "terms");
}

export default async function TermsPage({ params }: { params: PageParams }) {
  const { sdSlug } = await params;
  return <SitePolicyPage sdSlug={sdSlug} slug="terms" />;
}
