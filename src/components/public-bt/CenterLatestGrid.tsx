// The newest message from every worship center that streams on its own channel, one
// card per channel, newest first. Each card leads to that center's Watch page.

import React from "react";
import Link from "next/link";
import type { CenterLatest } from "@/helpers/CenterChannelHelper";
import { getCampusExtras } from "./btSiteContent";
import { MessageCard } from "./MessageCard";
import { IconArrowRight } from "./BtIcons";

export const CenterLatestGrid: React.FC<{ rows: CenterLatest[] }> = ({ rows }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 30 }}>
    {rows.map((r) => {
      const first = r.centers[0];
      const flag = getCampusExtras(first.slug)?.flag;
      const names = r.centers.map((c) => c.name).join(" & ");
      return (
        <div key={r.channel.channelId} style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <div className="bt-eyebrow">{(flag ? flag + " " : "") + names}</div>
          <MessageCard sermon={r.latest} placement="watch_every_center" churchId={first.id} />
          {first.slug && (
            <Link className="bt-link" href={"/watch/" + first.slug} style={{ fontSize: ".92rem" }}>
              More from {first.name} <IconArrowRight size={14} />
            </Link>
          )}
        </div>
      );
    })}
  </div>
);
