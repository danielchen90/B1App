// Sermon library — /sermons. Featured latest message + a grid of recent full-length
// teachings from the ministry's YouTube channel (public RSS feed — no key), with the
// channel itself as the deep archive.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BT } from "@/components/public-bt/btSiteContent";
import { IconYouTube, IconClock } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Sermons — " + churchName;
  const description =
    "Watch the latest messages from " + BT.founder + " and the " + churchName +
    " teaching ministry — Sunday services and weeknight discipleship, free to everyone.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default async function SermonsPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const [campuses, sermons] = await Promise.all([
    loadVisibleCampuses(churchId),
    loadSermonFeed(BT.youtubeChannelId, 13)
  ]);
  const navLinks = toLocationLinks(campuses);
  const [latest, ...rest] = sermons;

  return (
    <BtShell config={config} campuses={navLinks}>
      {/* Header band + featured message */}
      <section className="bt-dark" style={{ borderBottom: "1px solid var(--bt-line-dark)" }}>
        <div className="bt-section" style={{ paddingTop: 64, paddingBottom: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="bt-eyebrow" style={{ justifyContent: "center" }}>The Teaching Library</div>
            <h1 className="bt-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginTop: 16 }}>
              Sit under <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>the Word.</em>
            </h1>
            <p className="bt-lede bt-muted-text" style={{ maxWidth: 600, margin: "18px auto 0" }}>
              Sunday services and weeknight discipleship with{" "}{BT.founder}{" "}— streamed live,
              kept here for whenever you&rsquo;re ready to study.
            </p>
          </div>

          {latest ? (
            <div style={{ maxWidth: 940, margin: "0 auto" }}>
              <div
                style={{
                  position: "relative", width: "100%", aspectRatio: "16 / 9",
                  borderRadius: "var(--bt-radius-lg)", overflow: "hidden",
                  border: "1px solid var(--bt-line-dark)", background: "#000",
                  boxShadow: "0 30px 80px rgba(0,0,0,.5)"
                }}
              >
                <iframe
                  src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(latest.videoId)}
                  title={latest.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginTop: 20 }}>
                <div>
                  <div style={{ fontFamily: "var(--bt-eyebrow-font)", fontSize: "0.66rem", letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--bt-gold-bright)", marginBottom: 6 }}>
                    Latest Message
                  </div>
                  <div style={{ fontFamily: "var(--bt-display-font)", fontSize: "1.5rem", fontWeight: 600 }}>{latest.title}</div>
                  {latest.publishedAt && (
                    <div className="bt-muted-text" style={{ fontSize: "0.9rem", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <IconClock size={14} /> {formatDate(latest.publishedAt)}
                    </div>
                  )}
                </div>
                <a className="bt-btn bt-btn-ghost" href={BT.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "11px 20px", fontSize: "0.9rem" }}>
                  <IconYouTube size={17} /> Subscribe on YouTube
                </a>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p className="bt-muted-text" style={{ marginBottom: 20 }}>
                The library is loading slowly right now — every message is always available on the channel.
              </p>
              <a className="bt-btn" href={BT.youtubeUrl} target="_blank" rel="noopener noreferrer">
                <IconYouTube size={18} /> Watch on YouTube
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Recent messages grid */}
      {rest.length > 0 && (
        <section className="bt-section">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 30 }}>
            <h2 className="bt-h2">Recent Messages</h2>
            <a href={BT.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--bt-gold-deep)", fontWeight: 700 }}>
              Full archive on YouTube →
            </a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
            {rest.map((s) => (
              <a
                key={s.videoId}
                className="bt-card"
                href={"https://www.youtube.com/watch?v=" + s.videoId}
                target="_blank"
                rel="noopener noreferrer"
                style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#0F0C08" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.thumbnail}
                    alt=""
                    loading="lazy"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    aria-hidden
                    style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(180deg, transparent 55%, rgba(18,16,11,.55))"
                    }}
                  >
                    <span
                      style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: "rgba(18,16,11,.72)", border: "1px solid var(--bt-gold)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bt-gold-bright)"
                      }}
                    >
                      ▶
                    </span>
                  </span>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontWeight: 700, lineHeight: 1.45, fontSize: "0.98rem" }}>{s.title}</div>
                  {s.publishedAt && <div className="bt-muted-text" style={{ fontSize: "0.84rem", marginTop: 6 }}>{formatDate(s.publishedAt)}</div>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Weekly rhythm */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center" }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>The Weekly Rhythm</div>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 640, margin: "16px auto 0" }}>
            Sunday morning worship, Tuesday and Friday night discipleship — live on the ministry&rsquo;s
            channel, then kept here. Join a service from your nearest worship center, or from anywhere.
          </p>
        </div>
      </section>
    </BtShell>
  );
}
