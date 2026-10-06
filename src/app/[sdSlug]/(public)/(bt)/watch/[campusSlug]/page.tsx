// A worship center's Watch page: /watch/[campusSlug].
//
// The center's own YouTube channel (CenterChannelHelper: Huro's Website tab first, then
// the in-repo extras): the latest message, then every recent message the channel's RSS
// feed carries (~15), with watch live, subscribe and the full archive on YouTube. A
// center without its own channel shows the ministry channel and says so.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo } from "@/components/public-bt/btSeo";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { loadCenterChannel } from "@/helpers/CenterChannelHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { MessageCard } from "@/components/public-bt/MessageCard";
import { MessageLibrary } from "@/components/public-bt/MessageLibrary";
import { BT, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconYouTube, IconLive, IconArrowRight, IconPin } from "@/components/public-bt/BtIcons";
import { trackAttrs } from "@/lib/analytics";

type PageParams = { sdSlug: string; campusSlug: string };

const findCampus = async (churchId: string, slug: string) => {
  const campuses = await loadVisibleCampuses(churchId);
  const wanted = (slug || "").toLowerCase();
  return { campuses, campus: campuses.find((c) => (c.slug || "").toLowerCase() === wanted) || null };
};

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug, campusSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const { campus } = await findCampus(config.church?.id || "", campusSlug);
  if (!campus) return { ...MetaHelper.getMetaData("Watch | " + churchName, churchName, churchName, config.appearance), robots: { index: false } };
  const title = "Watch " + campus.name + " | " + churchName;
  const description = "The latest messages from " + campus.name + ", streamed every week. Watch live or catch up on recent services.";
  return btSeo(MetaHelper.getMetaData(title, description, description, config.appearance), "/watch/" + campus.slug);
}

export default async function CenterWatchPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, campusSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const { campuses, campus } = await findCampus(churchId, campusSlug);
  if (!campus) notFound();

  const own = await loadCenterChannel(churchId, campus);
  const channelId = own?.channelId || BT.youtubeChannelId;
  const channelUrl = own?.channelUrl || BT.youtubeUrl;
  const sermons = await loadSermonFeed(channelId, 15);
  const [latest, ...rest] = sermons;
  const flag = getCampusExtras(campus.slug)?.flag;
  const churchProps = { church_id: campus.id, church_slug: campus.slug || "", church_name: campus.name };

  return (
    <BtShell config={config} campuses={toLocationLinks(campuses)}>
      <BtPageHead
        eyebrow={(flag ? flag + " " : "") + "Watch " + campus.name}
        title={own ? "Messages from " + campus.name + "." : "Watch with " + campus.name + "."}
        lede={own
          ? "Every service streamed from " + campus.name + ", newest first. Watch live when we gather, or catch up on a recent message."
          : campus.name + " worships with the ministry's channel. Here are the latest messages from " + BT.founder + " and the ministry's teachers."}
        actions={
          <>
            <a className="bt-btn" href={channelUrl + "/live"} target="_blank" rel="noopener noreferrer" {...trackAttrs("live_service_joined", { ...churchProps, service_id: "youtube_live", placement: "center_watch_page" })}><IconLive size={18} /> Watch live</a>
            <a className="bt-btn bt-btn-outline" href={channelUrl + "?sub_confirmation=1"} target="_blank" rel="noopener noreferrer"><IconYouTube size={18} /> Subscribe on YouTube</a>
            <Link className="bt-btn bt-btn-outline" href={"/locations/" + campus.slug}><IconPin size={17} /> Visit {campus.name}</Link>
          </>
        }
      />

      {latest ? (
        <section className="bt-band">
          <div className="bt-section-tight" style={{ maxWidth: 980 }}>
            <div className="bt-eyebrow" style={{ marginBottom: 14 }}>The latest message</div>
            <MessageCard sermon={latest} feature placement="center_watch_latest" churchId={campus.id} />
          </div>
        </section>
      ) : (
        <section className="bt-section-tight">
          <p>Messages from {campus.name} will appear here once they are streamed. In the meantime, every service is on the channel.</p>
          <a className="bt-btn" href={channelUrl + "/videos"} target="_blank" rel="noopener noreferrer"><IconYouTube size={18} /> Watch on YouTube</a>
        </section>
      )}

      {rest.length > 0 && (
        <section className="bt-section">
          <div className="bt-section-head">
            <div>
              <div className="bt-eyebrow">Past services</div>
              <h2 className="bt-h2">Recent messages</h2>
            </div>
            <a className="bt-link" href={channelUrl + "/streams"} target="_blank" rel="noopener noreferrer">
              Full archive on YouTube <IconArrowRight size={15} />
            </a>
          </div>
          <MessageLibrary sermons={rest} placement="center_watch_library" churchId={campus.id} />
        </section>
      )}

      <section className="bt-section-tight" style={{ paddingTop: 0 }}>
        <Link className="bt-link" href="/watch">Watch every worship center <IconArrowRight size={15} /></Link>
      </section>
    </BtShell>
  );
}
