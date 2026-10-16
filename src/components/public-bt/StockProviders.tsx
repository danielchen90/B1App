// The stock ChurchApps client providers (MUI theme, user context, locale, error
// messages) for the routes that use them. The shared public layout no longer brings them
// (that put their bundles on every Bible Teachers page), so each stock route adds them
// from its own layout.tsx.

import React from "react";
import ClientLayout from "@/app/ClientLayout";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";

export async function StockProviders({ params, children }: { params: Promise<{ sdSlug: string }>; children: React.ReactNode }) {
  const { sdSlug } = await params;
  return (
    <>
      {/* The public layout loads the icon font for other churches; the Bible Teachers pages draw SVG icons. */}
      {isBtPublicSite(sdSlug) && <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />}
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
