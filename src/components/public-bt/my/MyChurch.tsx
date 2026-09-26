"use client";

// My Church: the member's side of the church admin system. Everything the staff keep
// about a person, the person can see here, and change where it makes sense:
//   - their worship center (announcements, events, times), chosen on their record
//   - "Is this you?" for church records that match one of their verified emails
//   - profile and household, extra emails (proved by a code)
//   - giving history and recurring gifts, partnership status
//   - classes and groups, serving schedule, their prayer and next-step requests
//   - ministers: their ordination and license; leaders: a way into the admin
// Each section loads on its own and says plainly when there's nothing yet, so a
// module that isn't set up for a center never breaks the page.

import React from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import { useMemberSession, tryGet, clearSessionCookies } from "./useMemberSession";
import { EmailsCard } from "./EmailsCard";
import { ProfileCard } from "./ProfileCard";
import type { LocatorCampus } from "../LeafletLocatorMap";
import type { PublicEvent } from "@/helpers/PublicEventsHelper";
import { EventCards } from "../EventCards";
import { saveCenter } from "../MyCenter";
import { BT_LINKS } from "../btSiteContent";
import { IconArrowRight, IconClock, IconPin, IconUser } from "../BtIcons";

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

interface Announcement { id?: string; title: string; body: string }

interface Props {
  subDomain: string;
  churchId: string;
  centers: LocatorCampus[];
}

const CSS = `
.bt-my { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(28px, 5vw, 56px) 20px 80px; display: grid; gap: 22px; }
.bt-my-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; align-items: start; }
.bt-my-card { background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius-lg); padding: 22px 24px; display: grid; gap: 12px; align-content: start; }
.bt-my-card h2 { font-size: 1.5rem; }
.bt-my-empty { color: var(--bt-muted); font-size: .95rem; }
.bt-my-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.bt-my-list li { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--bt-line); padding-bottom: 8px; font-size: .95rem; }
.bt-my-list li:last-child { border-bottom: 0; padding-bottom: 0; }
.bt-my-banner { background: var(--bt-gold-soft); border: 1px solid rgba(184,145,42,.35); border-radius: var(--bt-radius-lg); padding: 18px 22px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; }
.bt-my-hero { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; justify-content: space-between; }
.bt-my-ann { border-left: 3px solid var(--bt-gold); padding: 4px 0 4px 12px; }
.bt-my-ann b { color: var(--bt-ink); display: block; }
`;

const money = (n: number, currency = "USD") => {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n); } catch { return "$" + n.toFixed(2); }
};
const day = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const MyChurch: React.FC<Props> = ({ subDomain, churchId, centers }) => {
  const session = useMemberSession(subDomain);
  const [me, setMe] = React.useState<MeOverview | null | undefined>(undefined);
  const [groups, setGroups] = React.useState<any[] | null>(null);
  const [serving, setServing] = React.useState<any[] | null>(null);
  const [gifts, setGifts] = React.useState<any[] | null>(null);
  const [recurring, setRecurring] = React.useState<any[] | null>(null);
  const [requests, setRequests] = React.useState<any[] | null>(null);
  const [events, setEvents] = React.useState<PublicEvent[] | null>(null);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [claimNote, setClaimNote] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const overview = await tryGet<MeOverview>("/me/overview", "MembershipApi");
    setMe(overview);
    const [g, s, d, r, q] = await Promise.all([
      tryGet<any[]>("/groups/my", "MembershipApi"),
      tryGet<any[]>("/assignments/my", "DoingApi"),
      tryGet<any[]>("/donations/my", "GivingApi"),
      tryGet<any[]>("/subscriptions/my", "GivingApi"),
      tryGet<any[]>("/me/submissions", "MembershipApi")
    ]);
    setGroups(Array.isArray(g) ? g : []);
    setServing(Array.isArray(s) ? s : []);
    setGifts(Array.isArray(d) ? d : []);
    setRecurring(Array.isArray(r) ? r : []);
    setRequests(Array.isArray(q) ? q : []);
  }, []);

  React.useEffect(() => { if (session.status === "ready") load(); }, [session.status, load]);

  // The member's center: the one on their church record, else the one they picked on this device.
  const person = me?.person || null;
  const center = centers.find((c) => c.id === person?.campusId) || null;
  React.useEffect(() => {
    if (!center) return;
    if (center.slug) saveCenter(center.slug);
    tryGet<PublicEvent[]>("/events/public/" + churchId + "?campusId=" + encodeURIComponent(center.id), "ContentApi").then((e) => setEvents(Array.isArray(e) ? e : []));
    tryGet<{ announcements?: Announcement[] }>("/campusContent/public/" + churchId + "/" + center.id, "MembershipApi").then((c) => setAnnouncements(Array.isArray(c?.announcements) ? c!.announcements! : []));
  }, [center?.id, churchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = async (personId: string, name: string) => {
    try {
      const r: any = await ApiHelper.post("/me/claim", { personId }, "MembershipApi");
      setClaimNote(r?.linked ? "Done. Your church record is now part of your account." : "Thanks. That record belongs to another account, so your center's team will check it and link it for you.");
      await load();
    } catch {
      setClaimNote("We couldn't link " + name + " just now. Please try again later.");
    }
  };

  if (session.status === "loading" || (session.status === "ready" && me === undefined)) {
    return <div className="bt-my"><style dangerouslySetInnerHTML={{ __html: CSS }} /><p className="bt-my-empty">Opening My Church...</p></div>;
  }

  if (session.status === "signed-out" || session.status === "error") {
    return (
      <div className="bt-my">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="bt-my-card" style={{ maxWidth: 560 }}>
          <div className="bt-eyebrow">My Church</div>
          <h1 className="bt-h2">Your church, in one place</h1>
          <p>Sign in with your Mary Banks ID to see your worship center&rsquo;s announcements and events, manage your details, your giving and your partnership, your classes and your serving schedule.</p>
          {session.status === "error" && <p className="bt-my-empty">We couldn&rsquo;t open your account just now. Please sign in again.</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a className="bt-btn" href="/api/auth/mbid/start?returnUrl=/my">Sign in</a>
            <Link className="bt-btn bt-btn-outline" href="/">Back home</Link>
          </div>
        </div>
      </div>
    );
  }

  const first = person?.firstName || session.firstName || "friend";
  const isStaff = !!me?.staff?.isAdmin;

  return (
    <div className="bt-my">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="bt-my-hero">
        <div>
          <div className="bt-eyebrow">My Church</div>
          <h1 className="bt-display" style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.2rem)", marginTop: 8 }}>Welcome, {first}.</h1>
          {center && <p className="bt-lede" style={{ marginTop: 6 }}>{center.flag} {center.name}{center.leaders ? " · " + center.leaders : ""}</p>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {isStaff && <a className="bt-btn bt-btn-sm" href="/api/auth/mbid/start?target=admin">Open the church admin</a>}
          <a className="bt-btn bt-btn-sm bt-btn-outline" href="https://id.mbmonline.global/realms/marybanks/account">Mary Banks ID</a>
          <a className="bt-btn bt-btn-sm bt-btn-outline" href="/api/auth/mbid/logout" onClick={() => clearSessionCookies()}>Sign out</a>
        </div>
      </div>

      {/* "Is this you?" for church records that match a verified email */}
      {(me?.candidates || []).map((c) => (
        <div key={c.personId} className="bt-my-banner" role="region" aria-label="Church record found">
          <span><b style={{ color: "var(--bt-ink)" }}>We found {c.displayName}{c.campusName ? " at " + c.campusName : ""}.</b> Is this you?</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="bt-btn bt-btn-sm" onClick={() => claim(c.personId, c.displayName)}>Yes, that&rsquo;s me</button>
          </span>
        </div>
      ))}
      {claimNote && <div className="bt-my-banner" role="status"><span>{claimNote}</span></div>}

      <div className="bt-my-grid">
        {/* My center */}
        <section className="bt-my-card" aria-labelledby="my-center">
          <div className="bt-eyebrow">My worship center</div>
          {center ? (
            <>
              <h2 id="my-center" className="bt-h3"><Link href={"/locations/" + center.slug}>{center.name}</Link></h2>
              {center.serviceTimesLabel && <div style={{ display: "flex", gap: 8 }}><IconClock size={17} /><span>{center.serviceTimesLabel}</span></div>}
              {!center.virtual && <div style={{ display: "flex", gap: 8 }}><IconPin size={17} /><span>{center.address}</span></div>}
              {announcements.length > 0 && (
                <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
                  {announcements.map((a, i) => (
                    <div key={a.id || i} className="bt-my-ann"><b>{a.title}</b><span style={{ whiteSpace: "pre-line" }}>{a.body}</span></div>
                  ))}
                </div>
              )}
              <Link className="bt-link" href={"/locations/" + center.slug}>Center page <IconArrowRight size={15} /></Link>
            </>
          ) : (
            <>
              <h2 id="my-center" className="bt-h3">Choose your center</h2>
              <p className="bt-my-empty">Tell us which worship center you call home and we&rsquo;ll show its announcements and events here.</p>
              <p className="bt-my-empty">You can set it under Profile below.</p>
            </>
          )}
        </section>

        {/* Events for my center (and network-wide) */}
        <section className="bt-my-card" aria-labelledby="my-events">
          <div className="bt-eyebrow">Coming up</div>
          <h2 id="my-events" className="bt-h3">Events</h2>
          {events && events.length > 0
            ? <EventCards events={events} limit={3} showCenter />
            : <p className="bt-my-empty">{center ? "Nothing is published for your center yet." : "Choose your center to see its events."}</p>}
          <Link className="bt-link" href="/events">All events <IconArrowRight size={15} /></Link>
        </section>

        <ProfileCard person={person} household={me?.household || []} centers={centers} onSaved={load} />

        <EmailsCard primary={session.email} verified={me?.verifiedEmails || []} onChanged={load} />

        {/* Giving */}
        <section className="bt-my-card" aria-labelledby="my-giving">
          <div className="bt-eyebrow">Giving</div>
          <h2 id="my-giving" className="bt-h3">My giving</h2>
          {recurring && recurring.length > 0 && (
            <ul className="bt-my-list" aria-label="Recurring gifts">
              {recurring.map((r: any, i: number) => (
                <li key={r.id || i}><span>{(r.funds?.[0]?.name || r.fundName || "Recurring gift")}</span><span>{money(Number(r.amount || r.plan?.amount || 0) / (r.plan ? 100 : 1))} {r.interval || r.plan?.interval || "monthly"}</span></li>
              ))}
            </ul>
          )}
          {gifts && gifts.length > 0 ? (
            <ul className="bt-my-list" aria-label="Recent gifts">
              {gifts.slice(0, 6).map((g: any, i: number) => (
                <li key={g.id || i}><span>{day(g.donationDate || g.createdAt)}{g.fund?.name || g.fundName ? " · " + (g.fund?.name || g.fundName) : ""}</span><b style={{ color: "var(--bt-ink)" }}>{money(Number(g.amount || 0))}</b></li>
              ))}
            </ul>
          ) : (
            <p className="bt-my-empty">Gifts you give online will appear here, with a year-end statement for your records.</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link className="bt-btn bt-btn-sm" href="/give">Give</Link>
          </div>
        </section>

        {/* Partnership */}
        <section className="bt-my-card" aria-labelledby="my-partner">
          <div className="bt-eyebrow">Partnership</div>
          <h2 id="my-partner" className="bt-h3">{me?.partner?.tier === "partner" ? "You're a partner" : "Become a partner"}</h2>
          <p>
            {me?.partner?.tier === "partner"
              ? "Thank you for keeping the books, courses and teaching free for everyone" + (me.partner.since ? ", since " + day(me.partner.since) : "") + "."
              : "Partners keep the books, courses and teaching free for everyone, and carry them to the nations."}
          </p>
          <div><a className="bt-btn bt-btn-sm bt-btn-outline" href={BT_LINKS.partners}>{me?.partner?.tier === "partner" ? "Manage my partnership" : "Partner with us"}</a></div>
        </section>

        {/* Classes and groups */}
        <section className="bt-my-card" aria-labelledby="my-groups">
          <div className="bt-eyebrow">Classes and groups</div>
          <h2 id="my-groups" className="bt-h3">Where I belong</h2>
          {groups && groups.length > 0 ? (
            <ul className="bt-my-list">
              {groups.map((g: any) => <li key={g.id}><span>{g.name}</span><span className="bt-my-empty">{g.meetingTime || g.categoryName || ""}</span></li>)}
            </ul>
          ) : (
            <p className="bt-my-empty">You&rsquo;re not in a class or group yet.</p>
          )}
          <Link className="bt-link" href="/next-steps#discipleship">Join a discipleship class <IconArrowRight size={15} /></Link>
          <a className="bt-link" href={BT_LINKS.growthPaths}>My courses in the Global Training Center <IconArrowRight size={15} /></a>
        </section>

        {/* Serving */}
        <section className="bt-my-card" aria-labelledby="my-serving">
          <div className="bt-eyebrow">Serving</div>
          <h2 id="my-serving" className="bt-h3">My serving schedule</h2>
          {serving && serving.length > 0 ? (
            <ul className="bt-my-list">
              {serving.slice(0, 8).map((a: any, i: number) => (
                <li key={a.id || i}><span>{a.positionName || a.position?.name || "Serving"}{a.planName || a.plan?.name ? " · " + (a.planName || a.plan?.name) : ""}</span><span>{day(a.serviceDate || a.plan?.serviceDate)}</span></li>
              ))}
            </ul>
          ) : (
            <p className="bt-my-empty">No serving dates scheduled. Want to help?</p>
          )}
          <Link className="bt-link" href="/next-steps#serve">Serve at my center <IconArrowRight size={15} /></Link>
        </section>

        {/* My requests */}
        <section className="bt-my-card" aria-labelledby="my-requests">
          <div className="bt-eyebrow">Prayer and requests</div>
          <h2 id="my-requests" className="bt-h3">What I&rsquo;ve sent</h2>
          {requests && requests.length > 0 ? (
            <ul className="bt-my-list">
              {requests.slice(0, 8).map((r: any) => (
                <li key={r.id}><span>{typeLabel(r.type)}{r.campusName ? " · " + r.campusName : ""}</span><span className="bt-my-empty">{day(r.createdAt)}{r.status && r.status !== "new" ? " · " + r.status : ""}</span></li>
              ))}
            </ul>
          ) : (
            <p className="bt-my-empty">Prayer requests and next steps you send appear here.</p>
          )}
          <Link className="bt-link" href="/next-steps#prayer">Send a prayer request <IconArrowRight size={15} /></Link>
        </section>

        {/* Ministers' credentials */}
        {me?.credentials && me.credentials.length > 0 && (
          <section className="bt-my-card" aria-labelledby="my-credentials">
            <div className="bt-eyebrow">Ministry</div>
            <h2 id="my-credentials" className="bt-h3">My credentials</h2>
            <ul className="bt-my-list">
              {me.credentials.map((c, i) => (
                <li key={i}>
                  <span><IconUser size={15} /> {c.type}{c.ordainedOn ? ", ordained " + day(c.ordainedOn) : ""}</span>
                  <span className="bt-my-empty">{c.licenseExpires ? "License renews " + day(c.licenseExpires) : c.status || ""}</span>
                </li>
              ))}
            </ul>
            <p className="bt-my-empty">Something out of date? Your center&rsquo;s leadership can update your record.</p>
          </section>
        )}
      </div>
    </div>
  );
};

const typeLabel = (t?: string) => ({
  prayer: "Prayer request", contact: "Question", visit: "Plan a visit", salvation: "Follow Jesus",
  baptism: "Baptism", serve: "Serve", discipleship: "Discipleship class"
} as Record<string, string>)[t || ""] || "Request";
