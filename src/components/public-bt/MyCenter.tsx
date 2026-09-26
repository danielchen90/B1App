"use client";

// "Your center": the home page's first job. A visitor's worship center is remembered
// in this browser (localStorage + a `bt_center` cookie the server can read later);
// until one is chosen the card offers "Find the nearest center" (the browser's
// location, used once and never sent anywhere) or a pick from the list. Once chosen,
// it shows that center's service times, pastor and the next steps for a visit.
// Signed-in members will get their home center from their account instead.

import React from "react";
import Link from "next/link";
import type { LocatorCampus } from "./LeafletLocatorMap";
import { IconPin, IconClock, IconUser, IconArrowRight, IconGlobe } from "./BtIcons";

const KEY = "bt.center";

export const readSavedCenter = (): string | null => {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
};

export const saveCenter = (slug: string | null) => {
  try {
    if (slug) window.localStorage.setItem(KEY, slug); else window.localStorage.removeItem(KEY);
  } catch { /* storage blocked: the choice lasts for this visit only */ }
  document.cookie = slug
    ? "bt_center=" + encodeURIComponent(slug) + "; path=/; max-age=31536000; samesite=lax"
    : "bt_center=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new CustomEvent("bt:center", { detail: slug }));
};

/** Subscribe to the remembered center (updates when any component changes it). */
export const useSavedCenter = (): [string | null, boolean] => {
  const [slug, setSlug] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    setSlug(readSavedCenter());
    setReady(true);
    const on = (e: Event) => setSlug((e as CustomEvent).detail ?? readSavedCenter());
    window.addEventListener("bt:center", on);
    return () => window.removeEventListener("bt:center", on);
  }, []);
  return [slug, ready];
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

const CSS = `
.bt-mc { background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius-lg); box-shadow: var(--bt-shadow); overflow: hidden; text-align: left; }
.bt-mc-grid { display: grid; grid-template-columns: 220px 1fr; }
.bt-mc-photo { background: var(--bt-sunk) center / cover no-repeat; min-height: 100%; }
.bt-mc-body { padding: 22px 24px; display: grid; gap: 10px; }
.bt-mc-row { display: flex; align-items: flex-start; gap: 9px; color: var(--bt-body); font-size: 0.97rem; }
.bt-mc-row svg { margin-top: 3px; color: var(--bt-gold); }
.bt-mc-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; align-items: center; }
.bt-mc-change { background: none; border: 0; padding: 6px 4px; color: var(--bt-gold-deep); font: inherit; font-weight: 600; cursor: pointer; }
.bt-mc-change:hover { color: var(--bt-ink); text-decoration: underline; }
.bt-mc-pick { padding: 22px 24px; display: grid; gap: 14px; }
.bt-mc-pick select { max-width: 100%; }
@media (max-width: 640px) { .bt-mc-grid { grid-template-columns: 1fr; } .bt-mc-photo { min-height: 150px; } }
`;

interface Props {
  centers: LocatorCampus[];
}

export const MyCenter: React.FC<Props> = ({ centers }) => {
  const [slug, ready] = useSavedCenter();
  const [picking, setPicking] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  const center = centers.find((c) => c.slug === slug) || null;
  const physical = centers.filter((c) => !c.virtual && typeof c.lat === "number" && typeof c.lng === "number");

  const findNearest = () => {
    if (!navigator.geolocation) { setNote("Your browser can't share a location. Choose your center from the list instead."); setPicking(true); return; }
    setLocating(true); setNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        let best: LocatorCampus | null = null; let bestKm = Infinity;
        for (const c of physical) {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, c.lat as number, c.lng as number);
          if (km < bestKm) { best = c; bestKm = km; }
        }
        if (best?.slug) {
          saveCenter(best.slug);
          setPicking(false);
          if (bestKm > 160) setNote("That's our closest center, about " + Math.round(bestKm * 0.621) + " miles away. The Online Church gathers from anywhere, too.");
        }
      },
      () => { setLocating(false); setNote("We couldn't get your location. Choose your center from the list instead."); setPicking(true); },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
    );
  };

  // Server render and first paint: a quiet placeholder of the same height, so the hero doesn't jump.
  if (!ready) return <div className="bt-mc" style={{ minHeight: 172 }} aria-hidden><style dangerouslySetInnerHTML={{ __html: CSS }} /></div>;

  if (!center || picking) {
    return (
      <div className="bt-mc">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="bt-mc-pick">
          <div>
            <div className="bt-eyebrow">Your worship center</div>
            <h2 className="bt-h3" style={{ marginTop: 6 }}>Find the center nearest you</h2>
            <p className="bt-muted-text" style={{ marginTop: 4 }}>
              {`${centers.filter((c) => !c.virtual).length} centers across the United States, the Caribbean and Canada, and an Online Church that gathers from anywhere.`}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <button type="button" className="bt-btn" onClick={findNearest} disabled={locating}>
              <IconPin size={18} /> {locating ? "Finding you..." : "Find my nearest center"}
            </button>
            <label htmlFor="bt-center-select" style={{ position: "absolute", left: -9999 }}>Choose your center</label>
            <select
              id="bt-center-select"
              className="bt-field"
              style={{ width: "auto", minHeight: 48 }}
              value=""
              onChange={(e) => { if (e.target.value) { saveCenter(e.target.value); setPicking(false); setNote(null); } }}
            >
              <option value="">Or choose from the list</option>
              {centers.filter((c) => c.slug).map((c) => (
                <option key={c.id} value={c.slug as string}>{c.flag} {c.name}{c.virtual ? "" : c.country !== "United States" ? ", " + c.country : ""}</option>
              ))}
            </select>
            {center && <button type="button" className="bt-mc-change" onClick={() => setPicking(false)}>Keep {center.name}</button>}
          </div>
          {note && <p className="bt-muted-text" style={{ fontSize: "0.93rem" }}>{note}</p>}
        </div>
      </div>
    );
  }

  const href = "/locations/" + center.slug;
  return (
    <div className="bt-mc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bt-mc-grid">
        <div
          className="bt-mc-photo"
          role="img"
          aria-label={center.name + " worship center"}
          style={{ backgroundImage: "url('" + (center.photo || "/bt/gathering.jpg") + "')" }}
        />
        <div className="bt-mc-body">
          <div>
            <div className="bt-eyebrow">Your worship center</div>
            <h2 className="bt-h3" style={{ marginTop: 6 }}>
              <Link href={href}>{center.virtual ? "" : center.flag + " "}{center.name}</Link>
            </h2>
          </div>
          {center.serviceTimesLabel && <div className="bt-mc-row"><IconClock size={17} /><span>{center.serviceTimesLabel}</span></div>}
          {center.leaders && <div className="bt-mc-row"><IconUser size={17} /><span>{center.leaders}</span></div>}
          <div className="bt-mc-row">{center.virtual ? <IconGlobe size={17} /> : <IconPin size={17} />}<span>{center.address}</span></div>
          <div className="bt-mc-actions">
            <Link className="bt-btn bt-btn-sm" href={center.virtual ? href : "/next-steps?center=" + center.slug + "#visit"}>
              {center.virtual ? "Join the Online Church" : "Plan your visit"}
            </Link>
            <Link className="bt-link" href={href}>Center page <IconArrowRight size={15} /></Link>
            <button type="button" className="bt-mc-change" onClick={() => setPicking(true)}>Change center</button>
          </div>
          {note && <p className="bt-muted-text" style={{ fontSize: "0.9rem" }}>{note}</p>}
        </div>
      </div>
    </div>
  );
};
