"use client";

// Bible Teachers public CAMPUS LOCATOR orchestrator (Phase 20, Plan 06, MAP-01..06).
//
// Pairs the crawlable <CampusList> with the client-only <LocatorMap> island. Responsibilities:
//   - Load the map via next/dynamic({ ssr:false }) with a skeleton fallback (RESEARCH
//     Pattern 2: a Google-Maps SDK component must NOT run during SSR — window/document).
//     The <CampusList> stays server-rendered (crawlable) even while the island hydrates.
//   - DESKTOP: split view — CampusList LEFT, LocatorMap RIGHT (LOCKED). Hovering/clicking a
//     list item sets `activeId` → the matching marker highlights (and a marker click flows
//     back to highlight the list): two-way highlight.
//   - "Find a campus near me": a PROMINENT OPT-IN button — NO silent auto-prompt on load
//     (LOCKED). On click it calls navigator.geolocation.getCurrentPosition, sorts the list
//     nearest-first via an inline Haversine distance, and asks the map to recenter on the
//     nearest campus (MAP-06).
//   - MOBILE: defaults LIST-FIRST with a "Map" toggle, stacked (Claude's discretion per LOCKED).
//
// Uses the `--bt-*` brand vars throughout.

import React from "react";
import dynamic from "next/dynamic";
import { CampusList } from "./CampusList";
import type { LocatorCampus } from "./LocatorMap";

// The map is client-only (ssr:false) — its SDK touches window/document. A skeleton holds
// the layout while it hydrates; the crawlable list is always present regardless.
const LocatorMap = dynamic(() => import("./LocatorMap"), {
  ssr: false,
  loading: () => <MapSkeleton />
});

const MapSkeleton: React.FC = () => (
  <div
    aria-hidden
    style={{
      width: "100%",
      height: "100%",
      minHeight: 420,
      borderRadius: "var(--bt-radius-lg)",
      background:
        "repeating-linear-gradient(45deg, var(--bt-surface-alt), var(--bt-surface-alt) 12px, var(--bt-surface) 12px, var(--bt-surface) 24px)",
      border: "1px solid var(--bt-line)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--bt-muted)",
      fontSize: "0.95rem"
    }}
  >
    Loading map…
  </div>
);

interface Props {
  campuses: LocatorCampus[];
}

// Inline Haversine great-circle distance in km (MAP-06 near-me sort). No dependency.
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const CampusLocator: React.FC<Props> = ({ campuses }) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [ordered, setOrdered] = React.useState<LocatorCampus[]>(campuses);
  const [centerOn, setCenterOn] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  // Mobile default is LIST-FIRST; the toggle flips to the map (LOCKED).
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");

  React.useEffect(() => {
    setOrdered(campuses);
  }, [campuses]);

  // OPT-IN near-me — fires ONLY on click, never on load (LOCKED: no silent auto-prompt).
  const findNearMe = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location isn't available in this browser.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const sorted = [...campuses].sort(
          (a, b) =>
            haversineKm(latitude, longitude, a.lat, a.lng) -
            haversineKm(latitude, longitude, b.lat, b.lng)
        );
        setOrdered(sorted);
        if (sorted[0]) {
          setActiveId(sorted[0].id);
          setCenterOn({ lat: sorted[0].lat, lng: sorted[0].lng });
        }
        setMobileView("list"); // surface the freshly nearest-first list
        setLocating(false);
      },
      () => {
        setGeoError("We couldn't get your location. You can still browse the list below.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [campuses]);

  const mapNode = (
    <LocatorMap campuses={ordered} activeId={activeId} onActive={setActiveId} centerOn={centerOn} />
  );
  const listNode = (
    <CampusList
      campuses={ordered}
      activeId={activeId}
      onHover={setActiveId}
      onSelect={(id) => {
        setActiveId(id);
        const c = ordered.find((x) => x.id === id);
        if (c) setCenterOn({ lat: c.lat, lng: c.lng });
      }}
    />
  );

  return (
    <div className="bt-locator">
      {/* Near-me + count bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18
        }}
      >
        <button type="button" className="bt-btn" onClick={findNearMe} disabled={locating}>
          {locating ? "Locating…" : "📍 Find a campus near me"}
        </button>

        {/* Mobile-only Map/List toggle */}
        <div className="bt-locator-toggle" style={{ display: "none", gap: 8 }}>
          <button
            type="button"
            className={mobileView === "list" ? "bt-btn" : "bt-btn bt-btn-outline"}
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
            onClick={() => setMobileView("list")}
          >
            List
          </button>
          <button
            type="button"
            className={mobileView === "map" ? "bt-btn" : "bt-btn bt-btn-outline"}
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
            onClick={() => setMobileView("map")}
          >
            Map
          </button>
        </div>
      </div>

      {geoError && (
        <p style={{ color: "var(--bt-muted)", marginBottom: 14, fontSize: "0.95rem" }}>{geoError}</p>
      )}

      {/* Split: list LEFT, map RIGHT (desktop). Mobile stacks + honors the toggle. */}
      <div className="bt-locator-grid">
        <div
          className="bt-locator-list"
          data-mobile-visible={mobileView === "list"}
          style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}
        >
          {listNode}
        </div>
        <div
          className="bt-locator-map"
          data-mobile-visible={mobileView === "map"}
          style={{ minHeight: 420 }}
        >
          {mapNode}
        </div>
      </div>

      {/* Scoped responsive rules. Desktop = 2-col split; ≤820px = single column, the
          toggle appears and shows exactly one pane. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".bt-locator-grid { display: grid; grid-template-columns: minmax(300px, 420px) 1fr; gap: 24px; align-items: start; }" +
            " @media (max-width: 820px) {" +
            " .bt-locator-grid { grid-template-columns: 1fr; }" +
            " .bt-locator-toggle { display: flex !important; }" +
            " .bt-locator-list[data-mobile-visible='false'] { display: none; }" +
            " .bt-locator-map[data-mobile-visible='false'] { display: none; }" +
            " .bt-locator-list { max-height: none !important; }" +
            " }"
        }}
      />
    </div>
  );
};

export default CampusLocator;
