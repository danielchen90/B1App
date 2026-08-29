// About the ministry — /about. Mission, story, what to expect, and the path into
// discipleship. Copy comes from the org campusContent when authored; the in-repo
// authored voice fills every gap.

import React from "react";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { SectionOrnament } from "@/components/public-bt/BtOrnaments";
import { BT, BT_COPY, BT_NATION_COUNT } from "@/components/public-bt/btSiteContent";
import { IconPin, IconPlay, IconBook, IconHeart, IconGlobe, IconClock } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

const loadOrgContent = cache(async (churchId: string): Promise<{ mission?: string; about?: string }> => {
  if (!churchId) return {};
  try {
    const data = await ApiHelper.getAnonymous("/campusContent/public/" + churchId, "MembershipApi");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
});

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "About Us | " + churchName;
  const description = BT_COPY.mission;
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

const EXPECT = [
  {
    icon: IconBook,
    title: "Teaching that opens the Book",
    copy: "Messages walk through the Scriptures plainly and in depth, with no private interpretation: the Bible interprets itself. Bring your Bible, you'll use it."
  },
  {
    icon: IconHeart,
    title: "Worship and real prayer",
    copy: "Services are warm and unhurried. People pray with you and for you, by name, not in general."
  },
  {
    icon: IconClock,
    title: "Discipleship through the week",
    copy: "Midweek classes and prayer meetings are where the Word settles in. Every center gathers beyond Sunday."
  }
];

export default async function AboutPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const [campuses, content] = await Promise.all([loadVisibleCampuses(churchId), loadOrgContent(churchId)]);
  const navLinks = toLocationLinks(campuses);

  return (
    <BtShell config={config} campuses={navLinks}>
      {/* Hero */}
      <section className="bt-dark" style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--bt-line-dark)" }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(180deg, rgba(18,16,11,0.88) 0%, rgba(18,16,11,0.7) 60%, rgba(18,16,11,0.95) 100%), url('/bt/gathering.jpg')",
            backgroundSize: "cover", backgroundPosition: "center 35%"
          }}
        />
        <div className="bt-section" style={{ position: "relative", textAlign: "center", paddingTop: 90, paddingBottom: 90 }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>Who We Are</div>
          <h1 className="bt-display" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)", maxWidth: 860, margin: "20px auto 0" }}>
            God&rsquo;s influence<br />
            <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>in the earth.</em>
          </h1>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 620, margin: "20px auto 0" }}>
            A voice of truth to gather the ignorant into the knowledge of God.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bt-section" style={{ textAlign: "center" }}>
        <SectionOrnament />
        <div className="bt-eyebrow" style={{ justifyContent: "center", marginTop: 40 }}>Our Mission</div>
        <p
          style={{
            fontFamily: "var(--bt-display-font)", fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
            lineHeight: 1.45, maxWidth: 880, margin: "26px auto 0", fontWeight: 500
          }}
        >
          {content.mission || BT_COPY.mission}
        </p>
      </section>

      {/* Story */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)", borderBottom: "1px solid var(--bt-line)" }}>
        <div className="bt-section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
            <div
              aria-hidden
              style={{
                backgroundImage: "url('/bt/worship.jpg')",
                backgroundSize: "cover", backgroundPosition: "center",
                borderRadius: "var(--bt-radius-lg)", border: "1px solid var(--bt-line)",
                minHeight: 380, boxShadow: "0 24px 60px rgba(34,29,20,.16)"
              }}
            />
            <div>
              <div className="bt-eyebrow">Our Story</div>
              <h2 className="bt-h2" style={{ marginTop: 14 }}>The Bible interprets itself</h2>
              <p className="bt-lede bt-muted-text" style={{ marginTop: 20 }}>
                {content.about || BT_COPY.aboutShort}
              </p>
              <p className="bt-lede bt-muted-text" style={{ marginTop: 16 }}>
                Today, worship centers gather under{" "}{BT.ministry}{" "}in{" "}{BT_NATION_COUNT}{" "}nations,
                each one locally pastored and all of them fed from the same table of the Word.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="bt-section">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="bt-eyebrow">Your First Visit</div>
          <h2 className="bt-h2" style={{ marginTop: 14 }}>What to Expect</h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 620, margin: "16px auto 0" }}>
            Come as you are. You&rsquo;ll be welcomed, not watched.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 22 }}>
          {EXPECT.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="bt-card" style={{ padding: "32px 28px" }}>
              <span style={{ color: "var(--bt-gold-deep)" }}><Icon size={28} strokeWidth={1.3} /></span>
              <h3 style={{ fontSize: "1.5rem", margin: "14px 0 10px" }}>{title}</h3>
              <p className="bt-muted-text" style={{ lineHeight: 1.7 }}>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we believe */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)", borderBottom: "1px solid var(--bt-line)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center" }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>What We Believe</div>
          <p
            style={{
              fontFamily: "var(--bt-display-font)", fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)",
              lineHeight: 1.5, maxWidth: 780, margin: "22px auto 0", fontWeight: 500
            }}
          >
            {BT_COPY.beliefs}
          </p>
          <div className="bt-eyebrow" style={{ justifyContent: "center", marginTop: 18 }}>{BT_COPY.beliefsRef}</div>
        </div>
      </section>

      {/* The founder / teaching voice */}
      <section className="bt-dark">
        <div className="bt-section" style={{ textAlign: "center" }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>The Teaching Ministry</div>
          <h2 className="bt-h2" style={{ marginTop: 16 }}>
            Founded and led by<br />
            <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>{BT.founder}</em>
          </h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 680, margin: "20px auto 0" }}>
            {BT_COPY.discipleship}{" "}Sunday services, Tuesday and Friday night discipleship, and a
            library of teaching reaching back decades are open to everyone, anywhere, at no cost.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
            <Link className="bt-btn" href="/sermons"><IconPlay size={17} /> Hear the Teaching</Link>
            <a className="bt-btn bt-btn-ghost" href={BT.onlineChurchUrl} target="_blank" rel="noopener noreferrer">
              <IconGlobe size={17} /> Visit the Online Church
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bt-section" style={{ textAlign: "center" }}>
        <h2 className="bt-h2">Come and see.</h2>
        <p className="bt-lede bt-muted-text" style={{ maxWidth: 560, margin: "16px auto 28px" }}>
          There&rsquo;s a seat for you at the nearest worship center this Sunday.
        </p>
        <Link className="bt-btn" href="/locations"><IconPin size={18} /> Find a Worship Center</Link>
      </section>
    </BtShell>
  );
}
