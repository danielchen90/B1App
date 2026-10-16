"use client";

// The "We're live now" badge, loaded after the page is interactive. It draws nothing until
// a service is live, and its streaming helpers (ChurchApps packages) would otherwise be
// part of the first download of every page that shows it.

import dynamic from "next/dynamic";

export const LiveIndicator = dynamic(() => import("./LiveIndicator").then((m) => m.LiveIndicator), { ssr: false });
