// Giving — /give. Display-only: every button is the hosted Stripe Payment Link for the
// org or a specific worship center (campusContent override → in-repo extras → org
// default). No Stripe SDK, no gift records — giving is entirely handed off.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { SectionOrnament } from "@/components/public-bt/BtOrnaments";
import { BT, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconGift, IconArrowRight } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Give | " + churchName;
  const description =
    "Your giving helps us bless many across the globe. Simple and secure online giving for " + churchName + " and for every worship center.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

export default async function GivePage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const campuses = await loadVisibleCampuses(churchId);
  const navLinks = toLocationLinks(campuses);

  // Centers with their own giving link, ahead of those on the org default.
  const centerGiving = campuses
    .filter((c) => c.slug)
    .map((c) => {
      const extras = getCampusExtras(c.slug);
      return { name: c.name, flag: extras?.flag || "📍", url: extras?.givingUrl || BT.giveUrl, own: !!extras?.givingUrl };
    })
    .sort((a, b) => Number(b.own) - Number(a.own) || a.name.localeCompare(b.name));

  return (
    <BtShell config={config} campuses={navLinks}>
      {/* Hero */}
      <section className="bt-dark" style={{ borderBottom: "1px solid var(--bt-line-dark)" }}>
        <div className="bt-section" style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>2 Corinthians 9:7</div>
          <h1 className="bt-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginTop: 16 }}>
            God loves a <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>cheerful giver.</em>
          </h1>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 620, margin: "20px auto 34px" }}>
            Your giving helps us bless many across the globe. Simple and secure: give a single gift,
            or schedule recurring giving using your debit or credit card. Every gift is processed
            securely through Stripe.
          </p>
          <a className="bt-btn" href={BT.giveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "1.05rem", padding: "16px 34px" }}>
            <IconGift size={20} /> Give to the Ministry
          </a>
          <p className="bt-muted-text" style={{ fontSize: "0.85rem", marginTop: 16 }}>
            Opens the ministry&rsquo;s secure Stripe giving page in a new tab.
          </p>
        </div>
      </section>

      {/* Give to your worship center */}
      <section className="bt-section">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionOrnament />
          <h2 className="bt-h2" style={{ marginTop: 36 }}>Give to Your Worship Center</h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 560, margin: "16px auto 0" }}>
            Support our mission in the way that works best for you. Give directly to the center you call home.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14, maxWidth: 1000, margin: "0 auto" }}>
          {centerGiving.map((c) => (
            <a
              key={c.name}
              className="bt-card"
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                <span aria-hidden>{c.flag}</span> {c.name}
              </span>
              <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconArrowRight size={17} /></span>
            </a>
          ))}
        </div>
      </section>

      {/* Reassurance band */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center" }}>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 680, margin: "0 auto" }}>
            {BT.ministry}{" "}and Bible Teachers International are dedicated to reaching the globe
            with the message of Jesus Christ. Bible Teachers International is a certified 501(c)(3)
            organization, recognized as a non-profit organization in the United States of America.
          </p>
          <p className="bt-muted-text" style={{ maxWidth: 640, margin: "18px auto 0" }}>
            Questions about giving, tithes, or receipts? Reach out through the{" "}
            <a href="/connect" style={{ color: "var(--bt-gold-deep)", fontWeight: 700 }}>Connect page</a>{" "}
            and your worship center&rsquo;s team will help.
          </p>
        </div>
      </section>
    </BtShell>
  );
}
