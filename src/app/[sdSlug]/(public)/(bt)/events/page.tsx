// Events — /events. Everything the worship centers and the ministry have published
// in B1Admin (Calendars, "Show on the public website"), soonest first, filterable
// by center. Until anything is published, the page says so and shows the weekly
// rhythm instead of an empty grid.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadPublicEvents } from "@/helpers/PublicEventsHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { EventsBrowser } from "@/components/public-bt/EventsBrowser";
import { ThisWeek } from "@/components/public-bt/ThisWeek";
import { BT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Events | " + churchName;
  const description = "Conferences, revivals, classes and gatherings at every " + churchName + " worship center.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

export default async function EventsPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const [campuses, events] = await Promise.all([loadVisibleCampuses(churchId), loadPublicEvents(churchId)]);

  return (
    <BtShell config={config} campuses={toLocationLinks(campuses)}>
      <BtPageHead
        eyebrow="Events"
        title="What's coming up"
        lede="Conferences, revivals, classes and gatherings across the worship centers and the ministry."
      />
      <section className="bt-section">
        {events.length > 0 ? (
          <EventsBrowser events={events} />
        ) : (
          <div style={{ display: "grid", gap: 28 }}>
            <div className="bt-card" style={{ padding: "24px 26px", maxWidth: 720 }}>
              <h2 className="bt-h3">No events are published yet</h2>
              <p style={{ marginTop: 8 }}>
                The worship centers are adding their calendars. Until then, here&rsquo;s how we gather every week, and your center can tell you what&rsquo;s coming up.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                <Link className="bt-btn bt-btn-sm" href="/locations">Find your center</Link>
                <Link className="bt-btn bt-btn-sm bt-btn-outline" href="/next-steps#contact">Ask your center</Link>
              </div>
            </div>
            <ThisWeek streamKey={config.church?.subDomain || null} />
          </div>
        )}
      </section>
    </BtShell>
  );
}
