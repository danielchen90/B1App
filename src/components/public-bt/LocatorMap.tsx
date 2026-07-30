"use client";

// Bible Teachers public campus LOCATOR MAP island (Phase 20, Plan 06, MAP-01/02/03/05).
//
// A client-ONLY Google Map that plots EVERY campus from SSR-provided stored lat/lng.
// CRITICAL ANTI-PATTERN GUARD: this component NEVER geocodes on render (RESEARCH:
// Nominatim/Google geocode burst-ban). The parent passes `campuses[]` already carrying
// stored coordinates (from the 20-01 campus list), so the only Google call here is the
// Maps JS render itself — no address→coords lookup at runtime.
//
// - `useJsApiLoader` loads the Maps JS SDK client-side (key = NEXT_PUBLIC_GOOGLE_API_KEY).
//   When the key is unset/invalid or the SDK hasn't loaded yet, this renders nothing —
//   the crawlable <CampusList> fallback lives in the PARENT (CampusLocator), so a no-JS
//   or no-key visitor still gets the full scannable address list.
// - <MarkerClusterer> (bundled @googlemaps/markerclusterer via the lib) clusters the
//   ~23 markers when zoomed out so they stay legible (MAP-05).
// - Clicking a marker opens an <InfoWindow> card (name / address / service times) with a
//   "View campus" Link to /locations/[slug] (MAP-02/03).
// - `activeId` / `onActive` let the PARENT drive two-way hover-highlight from the list and
//   center/zoom the map from the near-me sort (MAP-06). An `active` marker is emphasized.
//
// The component is mounted via next/dynamic({ ssr:false }) in CampusLocator, but a
// defensive `typeof window` guard is included anyway.

import React from "react";
import Link from "next/link";
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer, InfoWindow } from "@react-google-maps/api";

export interface LocatorCampus {
  id: string;
  slug: string | null;
  name: string;
  lat: number;
  lng: number;
  address: string;
  serviceTimesLabel: string;
}

interface Props {
  campuses: LocatorCampus[];
  /** Currently-highlighted campus id (driven by the list hover / near-me). */
  activeId?: string | null;
  /** Report a marker click back up so the list can highlight in kind. */
  onActive?: (id: string | null) => void;
  /** A lat/lng the parent asks the map to recenter on (e.g. nearest campus after near-me). */
  centerOn?: { lat: number; lng: number } | null;
}

const CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 420,
  borderRadius: "var(--bt-radius-lg)"
};

// A neutral world-ish fallback center; immediately overridden by fitBounds once markers exist.
const FALLBACK_CENTER = { lat: 39.5, lng: -98.35 };

export const LocatorMap: React.FC<Props> = ({ campuses, activeId, onActive, centerOn }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
  });

  const mapRef = React.useRef<google.maps.Map | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Fit the viewport to ALL campuses whenever the set changes (never a geocode — pure
  // bounds over the SSR lat/lng props).
  const fitToCampuses = React.useCallback(
    (map: google.maps.Map) => {
      if (typeof window === "undefined" || !window.google || campuses.length === 0) return;
      const bounds = new window.google.maps.LatLngBounds();
      campuses.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      if (campuses.length === 1) {
        map.setCenter({ lat: campuses[0].lat, lng: campuses[0].lng });
        map.setZoom(12);
      } else {
        map.fitBounds(bounds, 64);
      }
    },
    [campuses]
  );

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitToCampuses(map);
    },
    [fitToCampuses]
  );

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  // Parent-driven recenter (near-me → nearest campus).
  React.useEffect(() => {
    if (mapRef.current && centerOn) {
      mapRef.current.panTo(centerOn);
      mapRef.current.setZoom(11);
    }
  }, [centerOn]);

  // When the parent highlights a campus (list hover), open its card + gently pan to it.
  React.useEffect(() => {
    setOpenId(activeId ?? null);
    if (mapRef.current && activeId) {
      const c = campuses.find((x) => x.id === activeId);
      if (c) mapRef.current.panTo({ lat: c.lat, lng: c.lng });
    }
  }, [activeId, campuses]);

  if (typeof window === "undefined" || !isLoaded) return null;

  const activeCampus = openId ? campuses.find((c) => c.id === openId) || null : null;

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={FALLBACK_CENTER}
      zoom={4}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        clickableIcons: false
      }}
    >
      <MarkerClusterer>
        {(clusterer) => (
          <>
            {campuses.map((c) => (
              <Marker
                key={c.id}
                position={{ lat: c.lat, lng: c.lng }}
                clusterer={clusterer}
                title={c.name}
                animation={
                  activeId === c.id && window.google
                    ? window.google.maps.Animation.BOUNCE
                    : undefined
                }
                onClick={() => {
                  setOpenId(c.id);
                  onActive?.(c.id);
                }}
              />
            ))}
          </>
        )}
      </MarkerClusterer>

      {activeCampus && (
        <InfoWindow
          position={{ lat: activeCampus.lat, lng: activeCampus.lng }}
          onCloseClick={() => {
            setOpenId(null);
            onActive?.(null);
          }}
        >
          <div style={{ minWidth: 200, maxWidth: 260, color: "#0a0a0a", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>{activeCampus.name}</div>
            {activeCampus.address && (
              <div style={{ color: "#4a4a4a", fontSize: "0.9rem", lineHeight: 1.4, marginBottom: 6 }}>
                {activeCampus.address}
              </div>
            )}
            {activeCampus.serviceTimesLabel && (
              <div style={{ color: "#4a4a4a", fontSize: "0.85rem", marginBottom: 10 }}>
                {activeCampus.serviceTimesLabel}
              </div>
            )}
            {activeCampus.slug && (
              <Link
                href={`/locations/${activeCampus.slug}`}
                style={{
                  display: "inline-block",
                  fontWeight: 700,
                  color: "#b8901c",
                  textDecoration: "none",
                  fontSize: "0.95rem"
                }}
              >
                View campus →
              </Link>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default LocatorMap;
