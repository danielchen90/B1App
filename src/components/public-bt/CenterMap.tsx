"use client";

// One center on the shared Leaflet map (a single pin opens at street level). Leaflet
// touches window at import, so it loads in the browser only, behind a quiet placeholder.

import React from "react";
import dynamic from "next/dynamic";
import type { LocatorCampus } from "./LeafletLocatorMap";

const LeafletLocatorMap = dynamic(() => import("./LeafletLocatorMap"), {
  ssr: false,
  loading: () => <div aria-hidden style={{ width: "100%", height: "100%", background: "var(--bt-sunk)" }} />
});

export const CenterMap: React.FC<{ campus: LocatorCampus }> = ({ campus }) => (
  <LeafletLocatorMap campuses={[campus]} height="100%" />
);
