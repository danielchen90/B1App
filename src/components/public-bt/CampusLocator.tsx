"use client";

// Worship-center locator — proximity sidebar + Leaflet map, two-way highlighted.
//
// On mount it quietly asks the browser for the visitor's location (the page's whole job
// is "which center is nearest to me"); when granted, the sidebar re-orders nearest-first
// with distance badges and the map drops a "you are here" dot. When denied or
// unavailable, the list stays grouped by nation and a button offers to try again.
// The <CampusList> markup server-renders either way, so the full address list is
// crawlable before the map island hydrates.

import React from "react";
import dynamic from "next/dynamic";
import { CampusList } from "./CampusList";
import type { LocatorCampus } from "./LeafletLocatorMap";

const LeafletLocatorMap = dynamic(() => import("./LeafletLocatorMap"), {
  ssr: false,
  loading: () => <MapSkeleton />
});

const MapSkeleton: React.FC = () => (
  <div
    aria-hidden
    style={{
      width: "100%", height: "100%", minHeight: 420,
      borderRadius: "var(--bt-radius-lg)",
      background: "repeating-linear-gradient(45deg, #F3EDDD, #F3EDDD 12px, #FAF6EC 12px, #FAF6EC 24px)",
      border: "1px solid var(--bt-line)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--bt-muted)", fontSize: "0.95rem"
    }}
  >
    Preparing the map…
  </div>
);

interface Props {
  campuses: LocatorCampus[];
  /** Map height on desktop (the sidebar scrolls beside it). */
  mapHeight?: number;
}

// Great-circle distance in km.
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

export const CampusLocator: React.FC<Props> = ({ campuses, mapHeight = 640 }) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [ordered, setOrdered] = React.useState<LocatorCampus[]>(campuses);
  const [byDistance, setByDistance] = React.useState(false);
  const [userPos, setUserPos] = React.useState<{ lat: number; lng: number } | null>(null);
  const [centerOn, setCenterOn] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!byDistance) setOrdered(campuses);
  }, [campuses, byDistance]);

  const sortByPosition = React.useCallback(
    (lat: number, lng: number) => {
      const stamped = campuses.map((c) =>
        typeof c.lat === "number" && typeof c.lng === "number" && !c.virtual
          ? { ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }
          : { ...c }
      );
      stamped.sort((a, b) => {
        // Physical centers nearest-first; the online church and un-mapped centers close the list.
        const da = typeof a.distanceKm === "number" ? a.distanceKm : Number.MAX_SAFE_INTEGER;
        const db = typeof b.distanceKm === "number" ? b.distanceKm : Number.MAX_SAFE_INTEGER;
        return da - db;
      });
      setOrdered(stamped);
      setByDistance(true);
      setUserPos({ lat, lng });
      const nearest = stamped.find((c) => typeof c.distanceKm === "number");
      if (nearest && typeof nearest.lat === "number") setActiveId(nearest.id);
    },
    [campuses]
  );

  const locate = React.useCallback(
    (announceErrors: boolean) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        if (announceErrors) setGeoError("Location isn't available in this browser, so the list is grouped by nation instead.");
        return;
      }
      setLocating(true);
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sortByPosition(pos.coords.latitude, pos.coords.longitude);
          setLocating(false);
        },
        () => {
          setLocating(false);
          if (announceErrors) setGeoError("We couldn't get your location, so the list is grouped by nation instead.");
        },
        { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
      );
    },
    [sortByPosition]
  );

  // Silent first attempt on mount; the button below retries loudly.
  React.useEffect(() => {
    locate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bt-locator">
      {/* Status bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 18 }}>
        {byDistance ? (
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontWeight: 700, fontSize: "0.88rem", color: "var(--bt-gold-deep)",
              background: "rgba(196,160,60,.1)", border: "1px solid rgba(196,160,60,.3)",
              borderRadius: 999, padding: "7px 16px"
            }}
          >
            ● Sorted by distance from you
          </span>
        ) : (
          <button type="button" className="bt-btn bt-btn-outline" onClick={() => locate(true)} disabled={locating} style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
            {locating ? "Finding you…" : "Sort by distance from me"}
          </button>
        )}
        {geoError && <span className="bt-muted-text" style={{ fontSize: "0.9rem" }}>{geoError}</span>}
      </div>

      {/* Map + proximity sidebar */}
      <div className="bt-locator-grid">
        <div className="bt-locator-list" style={{ maxHeight: mapHeight, overflowY: "auto", paddingRight: 6 }}>
          <CampusList
            campuses={ordered}
            byDistance={byDistance}
            activeId={activeId}
            onHover={setActiveId}
            onSelect={(id) => {
              setActiveId(id);
              const c = ordered.find((x) => x.id === id);
              if (c && typeof c.lat === "number" && typeof c.lng === "number") setCenterOn({ lat: c.lat, lng: c.lng });
            }}
          />
        </div>
        <div className="bt-locator-map" style={{ height: mapHeight }}>
          <LeafletLocatorMap
            campuses={ordered}
            activeId={activeId}
            onActive={setActiveId}
            centerOn={centerOn}
            userPos={userPos}
            height="100%"
          />
        </div>
      </div>

      {/* Desktop: sidebar 400px + map. Mobile: map on top (shorter), list under it. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".bt-locator-grid { display: grid; grid-template-columns: minmax(320px, 400px) 1fr; gap: 22px; align-items: start; }" +
            " @media (max-width: 900px) {" +
            " .bt-locator-grid { grid-template-columns: 1fr; }" +
            " .bt-locator-map { order: -1; height: 46vh !important; min-height: 340px; }" +
            " .bt-locator-list { max-height: none !important; overflow: visible !important; padding-right: 0 !important; }" +
            " }"
        }}
      />
    </div>
  );
};

export default CampusLocator;
