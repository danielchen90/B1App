// Giving — /give.
//
// When the church's giving is set up in B1Admin (a Stripe gateway and funds), the page
// embeds the ChurchApps giving form: gifts are recorded per person and per fund, so
// members get history, recurring-gift management and statements in My Church. Until
// then it falls back to the hosted Stripe Payment Links for the ministry and each
// center (campusContent override → in-repo extras → org default), as before.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { BT, BT_LINKS, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconGift, IconArrowRight } from "@/components/public-bt/BtIcons";
import { GiveEmbed, type GiveFund } from "@/components/public-bt/GiveEmbed";
import { ApiHelper } from "@churchapps/apphelper";

/** Online giving is live once the church has a payment gateway and at least one fund. */
const loadGiving = async (churchId: string): Promise<{ enabled: boolean; funds: GiveFund[] }> => {
  if (!churchId) return { enabled: false, funds: [] };
  try {
    const [gateways, funds] = await Promise.all([
      ApiHelper.getAnonymous("/gateways/churchId/" + churchId, "GivingApi"),
      ApiHelper.getAnonymous("/funds/churchId/" + churchId, "GivingApi")
    ]);
    const list: GiveFund[] = Array.isArray(funds) ? funds.filter((f: any) => f && f.id && !f.removed).map((f: any) => ({ id: f.id, name: f.name })) : [];
    return { enabled: Array.isArray(gateways) && gateways.length > 0 && list.length > 0, funds: list };
  } catch {
    return { enabled: false, funds: [] };
  }
};

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
  const giving = await loadGiving(churchId);

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
      <BtPageHead
        eyebrow="2 Corinthians 9:7"
        title={<>God loves a <em style={{ fontStyle: "italic", color: "var(--bt-gold-deep)" }}>cheerful giver.</em></>}
        lede="Your giving helps us bless many across the globe. Give a single gift, or schedule recurring giving with your debit or credit card. Every gift is processed securely through Stripe."
        actions={
          <>
            {giving.enabled
              ? <a className="bt-btn" href="#give-now"><IconGift size={19} /> Give now</a>
              : <a className="bt-btn" href={BT.giveUrl} target="_blank" rel="noopener noreferrer"><IconGift size={19} /> Give to the ministry</a>}
            <a className="bt-btn bt-btn-outline" href={BT_LINKS.partners}>Become a partner</a>
          </>
        }
      />

      {giving.enabled && (
        <section id="give-now" className="bt-section-tight" style={{ maxWidth: 820 }}>
          <GiveEmbed churchId={churchId} funds={giving.funds} centers={campuses.map((c) => ({ slug: c.slug, name: c.name }))} />
        </section>
      )}

      {/* Give to your worship center (payment links, until online giving is set up) */}
      {!giving.enabled && <section className="bt-section">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
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
      </section>}

      {/* Reassurance band */}
      <section style={{ background: "var(--bt-sunk)", borderTop: "1px solid var(--bt-line)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center" }}>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 680, margin: "0 auto" }}>
            {BT.ministry}{" "}and Bible Teachers International are dedicated to reaching the globe
            with the message of Jesus Christ. Bible Teachers International is a certified 501(c)(3)
            organization, recognized as a non-profit organization in the United States of America.
          </p>
          <p className="bt-muted-text" style={{ maxWidth: 640, margin: "18px auto 0" }}>
            Questions about giving, tithes, or receipts? Reach out through the{" "}
            <a href="/next-steps#contact" style={{ color: "var(--bt-gold-deep)", fontWeight: 700 }}>Next Steps page</a>{" "}
            and your worship center&rsquo;s team will help.
          </p>
        </div>
      </section>
    </BtShell>
  );
}
