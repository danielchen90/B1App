// A CRM event's public page: /e/<slug>. Planned in Huro (CRM > Events): the message and topics,
// who is ministering, the time (shown in the visitor's own zone), the flyer to download and share,
// questions and answers, and the registration form. Sign-ups land in the CRM.

import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo } from "@/components/public-bt/btSeo";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { EventRegisterForm, type EventQuestion } from "@/components/public-bt/events/EventRegisterForm";
import { LocalEventTime } from "@/components/public-bt/events/LocalEventTime";

type PageParams = { sdSlug: string; slug: string };

interface PublicEvent {
  slug: string; kind: string; kindLabel: string; title: string; subtitle: string | null; startsAt: string | null; endsAt: string | null; timezone: string;
  schedule: string | null; location: string | null; languages: string | null; topics: { title: string; detail: string }[]; speakers: { name: string; role: string }[];
  page: { headline: string; intro: string; highlights: string[]; topics: { title: string; detail: string }[]; whoShouldCome: string; faq: { q: string; a: string }[]; closing: string } | null;
  questions: EventQuestion[]; flyerUrl: string | null; imageUrl: string | null; registrationOpen: boolean; full: boolean; closed: boolean; roles: string[];
}

async function loadEvent(slug: string): Promise<PublicEvent | null> {
  try {
    return (await ApiHelper.getAnonymous("/crm/public/events/" + encodeURIComponent(slug), "MembershipApi")) as PublicEvent;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, slug } = await params;
  const [config, ev] = await Promise.all([loadBtConfig(sdSlug), loadEvent(slug)]);
  if (!ev) return {};
  const description = ev.page?.intro || ev.subtitle || ev.title;
  const meta = btSeo(MetaHelper.getMetaData(ev.title, description, description, config.appearance), "/e/" + ev.slug);
  if (ev.imageUrl) meta.openGraph = { ...(meta.openGraph || {}), images: [{ url: ev.imageUrl }] };
  return meta;
}

const CSS = `
.ev-hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: clamp(24px, 4vw, 56px); align-items: center; }
.ev-hero img { width: 100%; border-radius: var(--bt-radius); box-shadow: 0 18px 50px rgba(11,29,58,.18); }
.ev-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr); gap: clamp(24px, 4vw, 56px); align-items: start; }
.ev-sticky { position: sticky; top: 84px; }
.ev-list { display: grid; gap: 12px; margin: 14px 0 0; padding: 0; list-style: none; }
.ev-list li { display: grid; gap: 2px; }
.ev-faq details { border-top: 1px solid var(--bt-line); padding: 12px 0; }
.ev-faq summary { cursor: pointer; font-weight: 600; color: var(--bt-ink); }
@media (max-width: 900px) { .ev-hero, .ev-body { grid-template-columns: 1fr; } .ev-sticky { position: static; } }
`;

export default async function EventPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, slug } = await params;
  const [config, ev] = await Promise.all([loadBtConfig(sdSlug), loadEvent(slug)]);
  if (!ev) notFound();
  const campuses = await loadVisibleCampuses(config.church?.id || "");
  const p = ev.page;
  const topics = p?.topics?.length ? p.topics : ev.topics;

  return (
    <BtShell config={config} campuses={toLocationLinks(campuses)}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="bt-section">
        <div className="ev-hero">
          <div>
            <div className="bt-eyebrow">{ev.kindLabel}</div>
            <h1 className="bt-display" style={{ marginTop: 12 }}>{ev.title}</h1>
            {(p?.headline || ev.subtitle) && <p className="bt-lede" style={{ marginTop: 14 }}>{p?.headline && p.headline !== ev.title ? p.headline : ev.subtitle}</p>}
            <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
              {ev.startsAt && <LocalEventTime startsAt={ev.startsAt} endsAt={ev.endsAt} hostZone={ev.timezone} />}
              {ev.schedule && <p style={{ color: "var(--bt-body)" }}>{ev.schedule}</p>}
              {ev.location && <p style={{ color: "var(--bt-body)" }}>{ev.location}</p>}
              {ev.languages && <p style={{ color: "var(--bt-body)" }}>Languages: {ev.languages}</p>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {ev.registrationOpen && <a className="bt-btn" href="#register">Register</a>}
              {ev.flyerUrl && <a className="bt-btn bt-btn-outline" href={ev.flyerUrl} target="_blank" rel="noopener noreferrer" download>Download the flyer</a>}
            </div>
          </div>
          {ev.imageUrl && <img src={ev.imageUrl} alt={"Flyer: " + ev.title} />}
        </div>
      </section>

      <section className="bt-section" style={{ paddingTop: 0 }}>
        <div className="ev-body">
          <div style={{ display: "grid", gap: 36 }}>
            {p?.intro && <p className="bt-lede">{p.intro}</p>}
            {p?.highlights?.length ? (
              <div>
                <h2 className="bt-h3">What to expect</h2>
                <ul className="ev-list">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              </div>
            ) : null}
            {topics.length > 0 && (
              <div>
                <h2 className="bt-h3">What will be taught</h2>
                <ul className="ev-list">
                  {topics.map((t) => <li key={t.title}><b style={{ color: "var(--bt-ink)" }}>{t.title}</b>{t.detail && <span>{t.detail}</span>}</li>)}
                </ul>
              </div>
            )}
            {ev.speakers.length > 0 && (
              <div>
                <h2 className="bt-h3">Ministering</h2>
                <ul className="ev-list">{ev.speakers.map((s) => <li key={s.name}><b style={{ color: "var(--bt-ink)" }}>{s.name}</b>{s.role && <span>{s.role}</span>}</li>)}</ul>
              </div>
            )}
            {p?.whoShouldCome && (
              <div>
                <h2 className="bt-h3">Who should come</h2>
                <p style={{ marginTop: 10 }}>{p.whoShouldCome}</p>
              </div>
            )}
            {p?.faq?.length ? (
              <div className="ev-faq">
                <h2 className="bt-h3" style={{ marginBottom: 8 }}>Questions</h2>
                {p.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p style={{ marginTop: 8 }}>{f.a}</p></details>)}
              </div>
            ) : null}
            {p?.closing && <p className="bt-lede">{p.closing}</p>}
          </div>
          <div className="ev-sticky">
            {ev.registrationOpen ? (
              <EventRegisterForm slug={ev.slug} title={ev.title} roles={ev.roles} questions={ev.questions} languages={ev.languages} />
            ) : (
              <div className="bt-card" style={{ padding: "24px 22px" }}>
                <h2 className="bt-h3">{ev.full ? "This event is full" : "Registration is closed"}</h2>
                <p style={{ marginTop: 8 }}>{ev.full ? "Every place has been taken. " : ""}Watch for the next one on our events page.</p>
                <p style={{ marginTop: 14 }}><a className="bt-btn bt-btn-sm" href="/events">See events</a></p>
              </div>
            )}
          </div>
        </div>
      </section>
    </BtShell>
  );
}
