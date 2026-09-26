"use client";

// My Church: the member's church home, organized like the Faith Library and Global
// Training Center dashboards so the three feel like one family:
//   greeting + the day's verse
//   a dark hero for "your center" (its photo, next gathering, plan a visit / watch)
//   beside "My walk" (classes, serving, giving this year, requests)
//   five quick ways in
//   center news and events | recent activity
//   classes and groups | serving schedule
//   the latest message | giving
//   ministers' credentials, then partnership
// The church is personal in a way the others aren't: most of this page is about the
// member's own worship center.

import React from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import type { LocatorCampus } from "../LeafletLocatorMap";
import type { PublicEvent } from "@/helpers/PublicEventsHelper";
import type { FeedSermon } from "@/helpers/SermonFeedHelper";
import { tryGet } from "./useMemberSession";
import { useMyChurch } from "./useMyChurch";
import { MyFrame, Card, CardHead, Greeting, money, shortDate, ago } from "./MyUi";
import { SignedOutCard } from "./SignedOutCard";
import { MessageCard } from "../MessageCard";
import { saveCenter } from "../MyCenter";
import { BT_LINKS } from "../btSiteContent";
import {
  IconPlay, IconCalendar, IconGift, IconStep, IconHeart, IconUsers, IconHands, IconMail, IconPin, IconClock,
  IconChevronRight, IconBell, IconAward, IconCheck, IconLive
} from "../BtIcons";

export interface MePerson {
  id: string; firstName?: string; lastName?: string; displayName?: string; photo?: string | null;
  email?: string; phone?: string; address1?: string; address2?: string; city?: string; state?: string; zip?: string;
  campusId?: string | null; campusName?: string | null; campusSlug?: string | null; membershipStatus?: string | null; householdId?: string | null;
}

export interface MeOverview {
  user: { firstName: string; lastName: string; email: string };
  person: MePerson | null;
  household: { personId: string; displayName: string; role?: string; photo?: string | null }[];
  verifiedEmails: string[];
  partner: { tier?: string; status?: string; since?: string } | null;
  credentials: { type: string; ordainedOn?: string; status?: string; licenseNumber?: string; licenseExpires?: string }[];
  staff: { isAdmin: boolean; campuses: { id: string; name: string }[] };
  candidates: { personId: string; displayName: string; campusName?: string | null }[];
}

interface Announcement { id?: string; title: string; body: string; startsOn?: string }

interface Props {
  subDomain: string;
  churchId: string;
  centers: LocatorCampus[];
  latest: FeedSermon | null;
  dailyVerse: { reference: string; text: string } | null;
}

const CSS = `
.myd-top { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: flex-end; justify-content: space-between; }
.myd-verse { max-width: 380px; text-align: right; }
.myd-verse blockquote { margin: 0; font-family: var(--bt-display-font); font-style: italic; font-size: 1.15rem; line-height: 1.35; color: var(--bt-body); }
.myd-verse figcaption { margin-top: 8px; font-size: 11px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--bt-gold-deep); }
@media (max-width: 1023px) { .myd-verse { text-align: left; } }
.myd-banner { border-radius: 16px; border: 1px solid rgba(184,145,42,.35); background: var(--bt-gold-soft); padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; font-size: 15px; }
.myd-hero { position: relative; overflow: hidden; border-radius: 16px; background: #1d1a17; color: #fff; box-shadow: 0 18px 48px rgba(24,24,32,.18); min-height: 260px; }
.myd-hero-bg { position: absolute; inset: -20px; background: center / cover no-repeat; opacity: .45; filter: blur(28px); transform: scale(1.1); }
.myd-hero-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.5) 55%, rgba(0,0,0,.3)); }
.myd-hero-in { position: relative; display: flex; gap: 24px; padding: 32px; }
@media (max-width: 640px) { .myd-hero-in { flex-direction: column; padding: 24px; } }
.myd-hero-photo { flex: none; width: 176px; aspect-ratio: 4 / 5; border-radius: 12px; background: #333 center / cover no-repeat; box-shadow: 0 10px 28px rgba(0,0,0,.4); }
@media (max-width: 640px) { .myd-hero-photo { width: 100%; aspect-ratio: 16 / 9; } }
.myd-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.75); }
.myd-hero h2 { color: #fff; font-size: clamp(1.7rem, 3vw, 2.1rem); margin-top: 10px; }
.myd-hero-meta { display: grid; gap: 6px; margin-top: 10px; color: rgba(255,255,255,.85); font-size: 14px; }
.myd-hero-meta div { display: flex; gap: 8px; align-items: flex-start; }
.myd-hero-meta svg { margin-top: 2px; color: #F0BF4C; }
.myd-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
.bt-root .myd-gold { display: inline-flex; align-items: center; gap: 8px; border-radius: 12px; background: var(--bt-gold); color: #1B1408; padding: 12px 20px; font-size: 14px; font-weight: 600; }
.bt-root .myd-gold:hover { background: #F0BF4C; }
.bt-root .myd-white { display: inline-flex; align-items: center; gap: 12px; border-radius: 12px; background: #fff; color: var(--bt-ink); padding: 8px 16px 8px 8px; }
.bt-root .myd-white:hover { background: #F5E9C8; }
.myd-white-dot { width: 32px; height: 32px; border-radius: 50%; background: #1d1a17; color: #fff; display: grid; place-items: center; }
.myd-white b { display: block; font-size: 14px; font-weight: 600; line-height: 1.2; }
.myd-white span span { display: block; font-size: 12px; color: var(--bt-muted); }
.myd-hero-links { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.15); font-size: 12px; color: rgba(255,255,255,.8); }
.myd-hero-links a { display: inline-flex; align-items: center; gap: 6px; }
.myd-hero-links a:hover { color: #fff; }
.myd-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.myd-tile { border-radius: 12px; background: var(--bt-ivory); padding: 16px; }
.myd-tile-top { display: flex; align-items: center; gap: 8px; }
.myd-tile-top b { font-family: var(--bt-display-font); font-size: 1.6rem; font-weight: 400; color: var(--bt-ink); font-variant-numeric: tabular-nums; line-height: 1.1; }
.myd-tile p { margin-top: 4px; font-size: 12px; color: var(--bt-body); }
.myd-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; border-radius: 12px; background: var(--bt-ivory); padding: 12px; }
.myd-row:hover { background: var(--bt-sunk); }
.myd-actions { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 1023px) { .myd-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .myd-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } .myd-actions > :last-child { grid-column: span 2; } }
.myd-action { display: flex; flex-direction: column; align-items: center; text-align: center; border-radius: 16px; border: 1px solid transparent; padding: 20px 12px; transition: transform .2s, box-shadow .2s; }
.myd-action:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -10px rgba(24,24,32,.35); }
.myd-action b { margin-top: 8px; font-family: var(--bt-display-font); font-size: 1.1rem; font-weight: 600; color: var(--bt-ink); }
.myd-action span { margin-top: 4px; font-size: 12px; line-height: 1.35; color: var(--bt-body); }
.myd-activity a, .myd-activity > div { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; }
.myd-activity a:hover .myd-act-title { color: var(--bt-gold-deep); }
.myd-dot { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; }
.myd-act-title { display: block; font-size: 14px; font-weight: 500; color: var(--bt-ink); }
.myd-act-sub { display: block; font-size: 12px; color: var(--bt-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.myd-act-when { display: block; font-size: 11px; color: var(--bt-muted); }
.myd-ann { border-radius: 12px; border: 1px solid var(--bt-line); background: var(--bt-ivory); padding: 14px 16px; position: relative; }
.myd-ann b { display: block; font-family: var(--bt-display-font); font-size: 1.1rem; font-weight: 600; color: var(--bt-ink); padding-right: 22px; }
.myd-ann p { margin-top: 4px; font-size: 14px; color: var(--bt-body); white-space: pre-line; }
.myd-ann svg { position: absolute; right: 12px; top: 14px; color: var(--bt-gold); }
.myd-ev { display: flex; gap: 12px; align-items: center; padding: 10px 0; }
.myd-ev-date { flex: none; width: 48px; border-radius: 10px; background: var(--bt-gold-soft); text-align: center; padding: 6px 0; }
.myd-ev-date span { display: block; font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--bt-gold-deep); }
.myd-ev-date b { display: block; font-family: var(--bt-display-font); font-size: 1.35rem; line-height: 1; color: var(--bt-ink); }
.myd-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; font-size: 14px; }
.myd-item b { font-weight: 500; color: var(--bt-ink); }
.myd-item span { color: var(--bt-muted); font-size: 13px; }
.myd-partner { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; border-radius: 16px; border: 1px solid rgba(201,63,88,.15); background: linear-gradient(90deg, rgba(201,63,88,.05), rgba(245,233,200,.5)); padding: 24px; }
.myd-partner h2 { font-family: var(--bt-body-font); font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: #C93F58; }
.myd-partner p { margin-top: 4px; font-size: 14px; color: var(--bt-body); }
`;

const TONES = {
  sky: { bg: "#f0f9ff", fg: "#0369a1" },
  rose: { bg: "#fff1f2", fg: "#e11d48" },
  emerald: { bg: "#ecfdf5", fg: "#047857" },
  amber: { bg: "#fffbeb", fg: "#b45309" },
  violet: { bg: "#f5f3ff", fg: "#7c3aed" }
} as const;

const TYPE_LABEL: Record<string, string> = {
  prayer: "Prayer request sent", contact: "Question sent", visit: "Visit planned", salvation: "Asked about following Jesus",
  baptism: "Asked about baptism", serve: "Offered to serve", discipleship: "Asked to join a class"
};

interface Activity { kind: string; title: string; sub: string; at: string; href: string; tone: keyof typeof TONES; icon: React.FC<{ size?: number }> }

export const MyChurch: React.FC<Props> = ({ subDomain, churchId, centers, latest, dailyVerse }) => {
  const { session, me, groups, serving, gifts, recurring, requests, loaded, reload } = useMyChurch(subDomain);
  const [events, setEvents] = React.useState<PublicEvent[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [claimNote, setClaimNote] = React.useState<string | null>(null);

  const person = me?.person || null;
  const center = centers.find((c) => c.id === person?.campusId) || null;

  React.useEffect(() => {
    if (!center) return;
    if (center.slug) saveCenter(center.slug);
    tryGet<PublicEvent[]>("/events/public/" + churchId + "?campusId=" + encodeURIComponent(center.id), "ContentApi")
      .then((e) => setEvents(Array.isArray(e) ? e.filter((x) => new Date(x.end || x.start).getTime() >= Date.now()) : []));
    tryGet<{ announcements?: Announcement[] }>("/campusContent/public/" + churchId + "/" + center.id, "MembershipApi")
      .then((c) => setAnnouncements(Array.isArray(c?.announcements) ? c!.announcements! : []));
  }, [center?.id, churchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = async (personId: string, name: string) => {
    try {
      const r: any = await ApiHelper.post("/me/claim", { personId }, "MembershipApi");
      if (r?.linked) { window.location.reload(); return; }
      setClaimNote("Thanks. That record belongs to another account, so your center's team will check it and link it for you.");
      await reload();
    } catch {
      setClaimNote("We couldn't link " + name + " just now. Please try again later.");
    }
  };

  if (session.status === "signed-out" || session.status === "error") return <SignedOutCard />;
  if (session.status === "loading" || !loaded) {
    return (
      <MyFrame centerSlug={null}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="my-card" style={{ minHeight: 320 }} aria-busy="true"><p className="bt-muted-text">Opening My Church...</p></div>
      </MyFrame>
    );
  }

  const first = person?.firstName || (session.status === "ready" ? session.firstName : "") || "friend";
  const year = new Date().getFullYear();
  const givenThisYear = gifts.filter((g) => new Date(g.donationDate || g.createdAt || 0).getFullYear() === year).reduce((s, g) => s + Number(g.amount || 0), 0);
  const upcomingServing = serving.filter((a) => !a.serviceDate || new Date(a.serviceDate).getTime() >= Date.now() - 86400000);
  const isPartner = me?.partner?.tier === "partner";

  const journey = [
    { icon: IconUsers, value: String(groups.length), label: "Classes and groups", tone: TONES.sky.fg },
    { icon: IconHands, value: String(upcomingServing.length), label: "Serving dates ahead", tone: "#2E8B57" },
    { icon: IconGift, value: money(givenThisYear), label: "Given in " + year, tone: TONES.rose.fg },
    { icon: IconMail, value: String(requests.length), label: "Requests sent", tone: TONES.violet.fg }
  ];

  const actions = [
    { href: "/watch", icon: IconPlay, label: "Watch", body: "Live services and every message", tone: TONES.sky },
    { href: "/events", icon: IconCalendar, label: "Events", body: "What's coming up near you", tone: TONES.amber },
    { href: "/next-steps#prayer", icon: IconHeart, label: "Prayer", body: "Ministers pray over every request", tone: TONES.emerald },
    { href: "/give", icon: IconGift, label: "Give", body: "To your center or the ministry", tone: TONES.rose },
    { href: BT_LINKS.growthPaths, icon: IconStep, label: "Grow", body: "Free courses and Growth Paths", tone: TONES.violet, external: true }
  ];

  const activity: Activity[] = [
    ...requests.map((r: any): Activity => ({
      kind: r.type, title: TYPE_LABEL[r.type] || "Request sent", sub: [r.campusName, r.status && r.status !== "new" ? r.status : ""].filter(Boolean).join(" · "),
      at: r.createdAt, href: "/next-steps", tone: r.type === "prayer" ? "emerald" : r.type === "visit" ? "amber" : "violet", icon: r.type === "prayer" ? IconHeart : r.type === "visit" ? IconPin : IconMail
    })),
    ...gifts.map((g: any): Activity => ({
      kind: "gift", title: "Gave " + money(Number(g.amount || 0)), sub: g.fund?.name || g.fundName || "", at: g.donationDate || g.createdAt, href: "/my/giving", tone: "rose", icon: IconGift
    }))
  ].filter((a) => a.at).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 5);

  const heroPhoto = center?.photo || "/bt/gathering.jpg";

  return (
    <MyFrame centerSlug={center?.slug}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Greeting and the day's verse */}
      <div className="myd-top">
        <div>
          <Greeting name={first} />
          <p style={{ marginTop: 8, color: "var(--bt-body)" }}>
            {center ? "Here's what's happening at " + center.name + "." : "Welcome to your church home."}
          </p>
        </div>
        {dailyVerse && (
          <figure className="myd-verse" style={{ margin: 0 }}>
            <blockquote>&ldquo;{dailyVerse.text}&rdquo;</blockquote>
            <figcaption>{dailyVerse.reference}</figcaption>
          </figure>
        )}
      </div>

      {/* "Is this you?" for church records that match a verified email */}
      {(me?.candidates || []).map((c) => (
        <div key={c.personId} className="myd-banner" role="region" aria-label="Church record found">
          <span><b style={{ color: "var(--bt-ink)" }}>We found {c.displayName}{c.campusName ? " at " + c.campusName : ""}.</b> Is this you?</span>
          <button type="button" className="my-btn-dark" onClick={() => claim(c.personId, c.displayName)}>Yes, that&rsquo;s me</button>
        </div>
      ))}
      {claimNote && <div className="myd-banner" role="status">{claimNote}</div>}

      {/* Your center, and your walk so far */}
      <div className="my-grid-2 my-grid-hero">
        <section className="myd-hero">
          <div className="myd-hero-bg" style={{ backgroundImage: "url('" + heroPhoto + "')" }} aria-hidden />
          <div className="myd-hero-shade" aria-hidden />
          <div className="myd-hero-in">
            <div className="myd-hero-photo" style={{ backgroundImage: "url('" + heroPhoto + "')" }} role="img" aria-label={center ? center.name : "Worship"} />
            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
              <p className="myd-eyebrow">{center ? "Your worship center" : "Find your church home"}</p>
              {center ? (
                <>
                  <h2>{center.name}</h2>
                  <div className="myd-hero-meta">
                    {center.serviceTimesLabel && <div><IconClock size={15} /><span>{center.serviceTimesLabel}</span></div>}
                    {center.leaders && <div><IconUsers size={15} /><span>{center.leaders}</span></div>}
                    {!center.virtual && <div><IconPin size={15} /><span>{center.address}</span></div>}
                  </div>
                </>
              ) : (
                <>
                  <h2>Choose your worship center</h2>
                  <p style={{ marginTop: 8, color: "rgba(255,255,255,.8)", maxWidth: 440, fontSize: 14 }}>
                    Tell us which center you call home, and this page fills with its news, events and gatherings.
                  </p>
                </>
              )}
              <div className="myd-hero-actions">
                {center ? (
                  <Link className="myd-gold" href={center.virtual ? "/locations/" + center.slug : "/next-steps?center=" + center.slug + "#visit"}>
                    <IconCalendar size={16} /> {center.virtual ? "Join the Online Church" : "Plan my visit"}
                  </Link>
                ) : (
                  <Link className="myd-gold" href="/my/profile"><IconPin size={16} /> Choose my center</Link>
                )}
                {latest ? (
                  <Link className="myd-white" href="/watch">
                    <span className="myd-white-dot"><IconPlay size={15} /></span>
                    <span><b>Watch the latest message</b><span>{latest.title.length > 42 ? latest.title.slice(0, 40) + "..." : latest.title}</span></span>
                  </Link>
                ) : (
                  <Link className="myd-white" href="/watch"><span className="myd-white-dot"><IconLive size={15} /></span><span><b>Watch live</b><span>Sunday, Tuesday and Friday</span></span></Link>
                )}
              </div>
              {center && (
                <div className="myd-hero-links">
                  <Link href={"/locations/" + center.slug}><IconPin size={14} /> Center page</Link>
                  {!center.virtual && <a href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(center.address)} target="_blank" rel="noopener noreferrer"><IconStep size={14} /> Directions</a>}
                  <Link href={"/give?center=" + encodeURIComponent(center.slug || "") + "#give-now"}><IconGift size={14} /> Give to {center.name}</Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <Card>
          <CardHead title="My walk" href="/my/profile" linkLabel="My details" />
          <div className="myd-tiles">
            {journey.map(({ icon: Icon, value, label, tone }) => (
              <div key={label} className="myd-tile">
                <div className="myd-tile-top"><span style={{ color: tone, display: "inline-flex" }}><Icon size={20} /></span><b>{value}</b></div>
                <p>{label}</p>
              </div>
            ))}
          </div>
          {isPartner ? (
            <Link className="myd-row" href={BT_LINKS.partners}>
              <span className="myd-dot" style={{ background: TONES.rose.bg, color: TONES.rose.fg }}><IconHeart size={16} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--bt-body)" }}>Partner</span>
                <span className="my-serif" style={{ display: "block", fontSize: "1rem", color: "var(--bt-ink)" }}>Thank you for partnering{me?.partner?.since ? " since " + shortDate(me.partner.since) : ""}</span>
              </span>
              <IconChevronRight size={16} />
            </Link>
          ) : (me?.credentials?.length || 0) > 0 ? (
            <div className="myd-row">
              <span className="myd-dot" style={{ background: TONES.amber.bg, color: TONES.amber.fg }}><IconAward size={16} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--bt-body)" }}>Ministry</span>
                <span className="my-serif" style={{ display: "block", fontSize: "1rem", color: "var(--bt-ink)" }}>{me!.credentials[0].type}</span>
              </span>
            </div>
          ) : events[0] ? (
            <Link className="myd-row" href="/events">
              <span className="myd-dot" style={{ background: TONES.amber.bg, color: TONES.amber.fg }}><IconCalendar size={16} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 12, color: "var(--bt-body)" }}>Next up{center ? " at " + center.name : ""}</span>
                <span className="my-serif" style={{ display: "block", fontSize: "1rem", color: "var(--bt-ink)" }}>{events[0].title}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--bt-muted)" }}>{new Date(events[0].start).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </span>
              <IconChevronRight size={16} />
            </Link>
          ) : null}
        </Card>
      </div>

      {/* The ways in */}
      <nav aria-label="Quick actions" className="myd-actions">
        {actions.map(({ href, icon: Icon, label, body, tone, external }) => {
          const inner = (<><span style={{ color: tone.fg, display: "inline-flex" }}><Icon size={28} /></span><b>{label}</b><span>{body}</span></>);
          const style = { background: tone.bg };
          return external
            ? <a key={href} className="myd-action" href={href} style={style}>{inner}</a>
            : <Link key={href} className="myd-action" href={href} style={style}>{inner}</Link>;
        })}
      </nav>

      {/* Center news and events, and recent activity */}
      <div className="my-grid-2 my-grid-wide">
        <Card>
          <CardHead title={center ? center.name + " this week" : "Center news"} href="/events" linkLabel="All events" />
          {!center ? (
            <p className="my-empty">Choose your worship center to see its announcements and events.<br /><Link href="/my/profile">Choose my center</Link></p>
          ) : announcements.length === 0 && events.length === 0 ? (
            <p className="my-empty">No announcements or events from {center.name} yet. They&rsquo;ll appear here as the team posts them.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {announcements.slice(0, 3).map((a, i) => (
                <div key={a.id || i} className="myd-ann"><IconBell size={16} /><b>{a.title}</b><p>{a.body}</p></div>
              ))}
              {events.length > 0 && (
                <ul className="my-list">
                  {events.slice(0, 4).map((e) => {
                    const d = new Date(e.start);
                    return (
                      <li key={e.id} className="myd-ev">
                        <span className="myd-ev-date"><span>{d.toLocaleDateString("en-US", { month: "short" })}</span><b>{d.getDate()}</b></span>
                        <span style={{ minWidth: 0 }}>
                          <span className="myd-act-title">{e.title}</span>
                          <span className="myd-act-sub">{e.repeats ? e.repeats + " · " : ""}{e.allDay ? d.toLocaleDateString("en-US", { weekday: "long" }) : d.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" })}{e.campusName ? "" : " · All centers"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="Recent activity" href="/next-steps" linkLabel="Next steps" />
          {activity.length > 0 ? (
            <ul className="my-list myd-activity">
              {activity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={a.kind + i}>
                    <Link href={a.href}>
                      <span className="myd-dot" style={{ background: TONES[a.tone].bg, color: TONES[a.tone].fg }}><Icon size={16} /></span>
                      <span style={{ minWidth: 0 }}>
                        <span className="myd-act-title">{a.title}</span>
                        {a.sub && <span className="myd-act-sub">{a.sub}</span>}
                        <span className="myd-act-when">{ago(a.at)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="my-empty">Prayer requests, visits and gifts you send will appear here.<br /><Link href="/next-steps#prayer">Send a prayer request</Link></p>
          )}
        </Card>
      </div>

      {/* Classes and groups, and serving */}
      <div className="my-grid-2">
        <Card>
          <CardHead title="Classes and groups" href="/next-steps#discipleship" linkLabel="Join a class" />
          {groups.length > 0 ? (
            <ul className="my-list">
              {groups.slice(0, 5).map((g: any) => (
                <li key={g.id} className="myd-item"><b>{g.name}</b><span>{g.meetingTime || g.categoryName || ""}</span></li>
              ))}
            </ul>
          ) : (
            <p className="my-empty">You&rsquo;re not in a class or group yet. Weeknight discipleship meets in person and on Zoom.<br /><Link href="/next-steps#discipleship">Join a discipleship class</Link></p>
          )}
        </Card>
        <Card>
          <CardHead title="Serving schedule" href="/next-steps#serve" linkLabel="Serve" />
          {upcomingServing.length > 0 ? (
            <ul className="my-list">
              {upcomingServing.slice(0, 5).map((a: any, i: number) => (
                <li key={a.id || i} className="myd-item">
                  <b>{a.positionName || "Serving"}{a.planName ? " · " + a.planName : ""}</b>
                  <span>{[shortDate(a.serviceDate), a.status && a.status !== "Accepted" ? a.status : ""].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="my-empty">No serving dates scheduled. Every center runs on people who give their gifts.<br /><Link href="/next-steps#serve">Serve at my center</Link></p>
          )}
        </Card>
      </div>

      {/* The latest message, and giving */}
      <div className="my-grid-2">
        {latest && (
          <Card>
            <CardHead title="The latest message" href="/watch" linkLabel="All messages" />
            <MessageCard sermon={latest} />
          </Card>
        )}
        <Card>
          <CardHead title="My giving" href="/my/giving" linkLabel="See all" />
          <div className="myd-tiles" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="myd-tile"><div className="myd-tile-top"><b>{money(givenThisYear)}</b></div><p>Given in {year}</p></div>
            <div className="myd-tile"><div className="myd-tile-top"><b>{recurring.length}</b></div><p>{recurring.length === 1 ? "Recurring gift" : "Recurring gifts"}</p></div>
          </div>
          {gifts.length > 0 ? (
            <ul className="my-list" style={{ marginTop: 8 }}>
              {gifts.slice(0, 3).map((g: any, i: number) => (
                <li key={g.id || i} className="myd-item"><b>{money(Number(g.amount || 0))}</b><span>{[g.fund?.name || g.fundName, shortDate(g.donationDate || g.createdAt)].filter(Boolean).join(" · ")}</span></li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--bt-body)" }}>Gifts you give online appear here, with a statement for your records.</p>
          )}
          <div style={{ marginTop: 16 }}><Link className="my-btn-dark" href={center ? "/give?center=" + encodeURIComponent(center.slug || "") + "#give-now" : "/give"}>Give</Link></div>
        </Card>
      </div>

      {/* Ministers' credentials */}
      {(me?.credentials?.length || 0) > 0 && (
        <Card>
          <CardHead title="My ministry credentials" sub="From your ordination record. Your center's leadership can update it." />
          <ul className="my-list">
            {me!.credentials.map((c, i) => (
              <li key={i} className="myd-item">
                <b><span style={{ color: "var(--bt-gold)", marginRight: 8, display: "inline-flex", verticalAlign: -3 }}><IconCheck size={16} /></span>{c.type}{c.ordainedOn ? ", ordained " + shortDate(c.ordainedOn) : ""}</b>
                <span>{c.licenseExpires ? "License renews " + shortDate(c.licenseExpires) : c.status || ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Partnership: a thank-you for partners, a gentle invitation for everyone else */}
      <section className="myd-partner">
        <span style={{ color: "#C93F58", display: "inline-flex" }}><IconHeart size={32} /></span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2>{isPartner ? "Thank you, partner" : "Become a partner"}</h2>
          <p>{isPartner
            ? "Your partnership keeps the books, courses and teaching free for everyone, and carries them to the nations."
            : "Partners keep the books, courses and teaching free for everyone, and carry them to the nations. Give as the Lord leads you."}</p>
        </div>
        <a className="my-btn-dark" href={BT_LINKS.partners}>{isPartner ? "Manage my partnership" : "Partner with us"}</a>
      </section>

      {me?.staff?.isAdmin && (
        <p style={{ fontSize: 14, color: "var(--bt-body)" }}>
          You help lead {me.staff.campuses.length === 1 ? me.staff.campuses[0].name : "your centers"}. <a className="bt-link" href="/api/auth/mbid/start?target=admin">Open the church admin</a>
        </p>
      )}
    </MyFrame>
  );
};
