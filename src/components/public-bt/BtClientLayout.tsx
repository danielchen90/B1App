"use client";

// Client root for the Bible Teachers public pages. The stock ClientLayout brings the
// MUI theme, the ChurchApps error/locale/user providers and their bundles (several
// hundred KB of script) to every page; the BT pages are server-rendered and use none of
// it. Routes that still need the stock providers (giving, My Church, the leftover
// ChurchApps screens) add <StockProviders> from their own layout.
//
// The ChurchApps API helpers are configured from the page's API base (window.__API_BASE__)
// in a separate chunk after first paint; the BT forms also configure them on load.

import React from "react";

if (typeof window !== "undefined") {
  import("@/helpers/EnvironmentHelper").then((m) => m.EnvironmentHelper.init()).catch(() => { /* forms init on their own */ });
}

export default function BtClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
