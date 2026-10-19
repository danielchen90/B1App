// Shared page chrome for every BT public page: the `.bt-root` wrapper, theme injection,
// sticky header (with the popout sidebar) and the closing footer. RSC — pages pass the
// tenant config plus the nav campus list they already loaded.

import React from "react";
import { BtTheme } from "./BtTheme";
import { BtHeader } from "./BtHeader";
import { BtFooter } from "./BtFooter";
import type { LocationLink } from "./LocationsMenu";
import type { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface;
  campuses: LocationLink[];
  /** A worship center's own giving link: the menu's Give opens it. */
  giveUrl?: string | null;
  /** Leave Give out of the top bar (a center page offers it in its hero instead). */
  hideHeaderGive?: boolean;
  children: React.ReactNode;
}

export const BtShell: React.FC<Props> = ({ config, campuses, giveUrl, hideHeaderGive, children }) => (
  <div className="bt-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <BtTheme />
    <BtHeader campuses={campuses} giveUrl={giveUrl} hideGive={hideHeaderGive} />
    <main style={{ flex: 1 }}>{children}</main>
    <BtFooter campuses={campuses} churchName={config.church?.name} />
  </div>
);
