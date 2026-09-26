// Watch — /watch (replaces /sermons, which now redirects here).
//
// Live first: what's on this week in the viewer's own time zone (ThisWeek, driven by
// the admin's stream schedule) and a way to the live stream; then the latest message,
// then the library with series and speaker filters. The site reads the channel's
// public RSS feed (the newest ~15 uploads, no API key); the full archive is linked.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { ThisWeek } from "@/components/public-bt/ThisWeek";
import { LiveIndicator } from "@/components/public-bt/LiveIndicator";
import { MessageCard } from "@/components/public-bt/MessageCard";
import { MessageLibrary } from "@/components/public-bt/MessageLibrary";
import { BT } from "@/components/public-bt/btSiteContent";
import { IconYouTube, IconLive, IconArrowRight } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Watch | " + churchName;
  const description =
    "Watch live and on demand: Sunday Morning Live, Tuesday and Friday Night Discipleship and live prayer with " +
    BT.founder + " and the " + churchName + " teaching ministry.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

export default async function WatchPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const [campuses, sermons] = await Promise.all([
    loadVisibleCampuses(churchId),
    loadSermonFeed(BT.youtubeChannelId, 15)
  ]);
  const [latest, ...rest] = sermons;
  const streamKey = config.church?.subDomain || null;

  return (
    <BtShell config={config} campuses={toLocationLinks(campuses)}>
      <BtPageHead
        eyebrow="Watch"
        title="Sit under the Word, live or on demand."
        lede={"Sunday worship, weeknight discipleship and live prayer with " + BT.founder + " and the ministry's teachers, streamed every week and kept here for whenever you're ready to study."}
        actions={
          <>
            <a className="bt-btn" href={BT.youtubeUrl + "/live"} target="_blank" rel="noopener noreferrer"><IconLive size={18} /> Watch live</a>
            <a className="bt-btn bt-btn-outline" href={BT.youtubeUrl + "?sub_confirmation=1"} target="_blank" rel="noopener noreferrer"><IconYouTube size={18} /> Subscribe on YouTube</a>
          </>
        }
      >
        <div style={{ marginTop: 18 }}><LiveIndicator streamKey={streamKey} /></div>
      </BtPageHead>

      <section className="bt-section-tight">
        <div className="bt-section-head">
          <div>
            <div className="bt-eyebrow">This week</div>
            <h2 className="bt-h2">When we gather</h2>
          </div>
        </div>
        <ThisWeek streamKey={streamKey} />
      </section>

      {latest && (
        <section className="bt-band">
          <div className="bt-section-tight" style={{ maxWidth: 980 }}>
            <div className="bt-eyebrow" style={{ marginBottom: 14 }}>The latest message</div>
            <MessageCard sermon={latest} feature />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="bt-section">
          <div className="bt-section-head">
            <div>
              <div className="bt-eyebrow">The library</div>
              <h2 className="bt-h2">Recent messages</h2>
            </div>
            <a className="bt-link" href={BT.youtubeUrl + "/videos"} target="_blank" rel="noopener noreferrer">
              Full archive on YouTube <IconArrowRight size={15} />
            </a>
          </div>
          <MessageLibrary sermons={rest} />
        </section>
      )}
    </BtShell>
  );
}
