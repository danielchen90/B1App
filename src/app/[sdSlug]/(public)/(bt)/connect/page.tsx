// Connect — /connect. Login-free prayer + contact forms (tagged to the Online Church's
// inbox so they reach the org team), plus a directory of every worship center's own
// phone and email for people who want to reach their local team directly.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { PrayerForm } from "@/components/public-bt/forms/PrayerForm";
import { ContactForm } from "@/components/public-bt/forms/ContactForm";
import { BT, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconPin, IconPhone, IconMail } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Connect — " + churchName;
  const description =
    "Send a prayer request or a message to " + churchName + " — no account needed. Or reach your local worship center directly.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

export default async function ConnectPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const campuses = await loadVisibleCampuses(churchId);
  const navLinks = toLocationLinks(campuses);

  // Org-wide submissions land in the Online Church's inbox (the org team's home),
  // falling back to the first campus if it's ever renamed.
  const inboxCampus = campuses.find((c) => c.slug === "online-church") || campuses[0];

  // Directory rows: centers with a published phone or email.
  const directory = campuses
    .filter((c) => c.slug)
    .map((c) => ({ name: c.name, slug: c.slug as string, extras: getCampusExtras(c.slug) }))
    .filter((r) => r.extras?.phone || r.extras?.email);

  return (
    <BtShell config={config} campuses={navLinks}>
      {/* Header band */}
      <section className="bt-dark" style={{ borderBottom: "1px solid var(--bt-line-dark)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center", paddingTop: 64, paddingBottom: 56 }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>We&rsquo;d Love to Hear From You</div>
          <h1 className="bt-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginTop: 16 }}>
            Let&rsquo;s <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>connect.</em>
          </h1>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 600, margin: "18px auto 0" }}>
            Share a prayer request, ask a question, or plan your first visit —
            no account needed, and a real person reads every message.
          </p>
        </div>
      </section>

      {/* Forms */}
      {inboxCampus && (
        <section className="bt-section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24, alignItems: "start", maxWidth: 1000, margin: "0 auto" }}>
            <PrayerForm churchId={churchId} campusId={inboxCampus.id} />
            <ContactForm churchId={churchId} campusId={inboxCampus.id} />
          </div>
        </section>
      )}

      {/* Plan a visit strip */}
      <section className="bt-dark">
        <div className="bt-section-tight" style={{ textAlign: "center" }}>
          <h2 className="bt-h2">Ready to visit?</h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 540, margin: "14px auto 26px" }}>
            Find your nearest worship center — service times, directions, and a seat saved for you.
          </p>
          <Link className="bt-btn" href="/locations"><IconPin size={18} /> Find a Worship Center</Link>
        </div>
      </section>

      {/* Local directory */}
      {directory.length > 0 && (
        <section className="bt-section">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="bt-eyebrow" style={{ justifyContent: "center" }}>Reach Your Local Team</div>
            <h2 className="bt-h2" style={{ marginTop: 14 }}>Worship Center Contacts</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {directory.map(({ name, slug, extras }) => (
              <div key={slug} className="bt-card" style={{ padding: "20px 22px" }}>
                <Link href={`/locations/${slug}`} style={{ fontFamily: "var(--bt-display-font)", fontWeight: 600, fontSize: "1.3rem" }}>
                  <span aria-hidden style={{ marginRight: 8 }}>{extras?.flag}</span>{name}
                </Link>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                  {extras?.phone && (
                    <a href={"tel:" + extras.phone.replace(/[^+\d]/g, "")} className="bt-muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.93rem" }}>
                      <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconPhone size={16} /></span>
                      {extras.phone}
                    </a>
                  )}
                  {extras?.email && (
                    <a href={"mailto:" + extras.email} className="bt-muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.93rem", wordBreak: "break-all" }}>
                      <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconMail size={16} /></span>
                      {extras.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </BtShell>
  );
}
