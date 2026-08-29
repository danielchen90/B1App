"use client";

// Worship-center map — Leaflet + OpenStreetMap/CARTO raster tiles (no Google, no API
// key). Plots every worship center from SSR-provided stored lat/lng (never geocodes),
// fits the viewport to the whole fellowship — the U.S. Gulf & East Coast down through
// the Caribbean and up to Ontario — and pairs two-way with the proximity list:
// hovering/selecting a list item highlights its pin; clicking a pin reports back up.
//
// Mounted only via next/dynamic({ ssr:false }) — Leaflet touches window at import time.

import React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";

export interface LocatorCampus {
  id: string;
  slug: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string;
  serviceTimesLabel: string;
  country: string;
  flag: string;
  /** The online congregation — listed, never pinned. */
  virtual?: boolean;
  /** Distance from the visitor in km — present once geolocation resolves. */
  distanceKm?: number;
}

interface Props {
  campuses: LocatorCampus[];
  activeId?: string | null;
  onActive?: (id: string | null) => void;
  centerOn?: { lat: number; lng: number } | null;
  /** Visitor position (after geolocation) — drawn as a soft dot. */
  userPos?: { lat: number; lng: number } | null;
  height?: string;
}

// Esri's light-gray canvas (keyless, attribution required) — a muted ground that lets
// the gold pins carry the page; a reference layer adds place labels on top.
const TILE_BASE = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIB = 'Tiles &copy; Esri | Esri, HERE, Garmin &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Gold pin on ink — the brand mark reduced to a map glyph.
const pinSvg = (active: boolean) => `
<svg width="${active ? 44 : 34}" height="${active ? 54 : 42}" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 41C17 41 32 28.6 32 15.9A15 15 0 0 0 17 1 15 15 0 0 0 2 15.9C2 28.6 17 41 17 41Z"
        fill="${active ? "#EDC368" : "#C4A03C"}" stroke="#12100B" stroke-width="1.6"/>
  <circle cx="17" cy="15.5" r="6.2" fill="#12100B"/>
  <circle cx="17" cy="15.5" r="2.4" fill="${active ? "#EDC368" : "#C4A03C"}"/>
</svg>`;

const makeIcon = (active: boolean) =>
  L.divIcon({
    className: "bt-map-pin",
    html: pinSvg(active),
    iconSize: active ? [44, 54] : [34, 42],
    iconAnchor: active ? [22, 52] : [17, 41],
    popupAnchor: [0, active ? -50 : -40]
  });

const POPUP_CSS = `
.bt-map .leaflet-popup-content-wrapper {
  background: #12100B; color: #F4EDDD; border: 1px solid rgba(237,195,104,.35);
  border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.4);
  font-family: 'Mulish', system-ui, sans-serif; }
.bt-map .leaflet-popup-content { margin: 14px 16px; line-height: 1.5; }
.bt-map .leaflet-popup-tip { background: #12100B; border: 1px solid rgba(237,195,104,.35); }
.bt-map .leaflet-popup-close-button { color: #B3A78B !important; }
.bt-map .leaflet-control-attribution { background: rgba(250,246,236,.85); font-size: 10px; }
.bt-map .leaflet-control-zoom a { color: #221D14; }
.bt-map-user { border-radius: 50%; }
`;

export const LeafletLocatorMap: React.FC<Props> = ({ campuses, activeId, onActive, centerOn, userPos, height = "100%" }) => {
  const holderRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const clusterRef = React.useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = React.useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = React.useRef<L.CircleMarker | null>(null);
  const onActiveRef = React.useRef(onActive);
  onActiveRef.current = onActive;

  const plottable = React.useMemo(
    () => campuses.filter((c) => !c.virtual && typeof c.lat === "number" && typeof c.lng === "number"),
    [campuses]
  );

  // Create the map once.
  React.useEffect(() => {
    if (!holderRef.current || mapRef.current) return;
    const map = L.map(holderRef.current, {
      zoomControl: true,
      scrollWheelZoom: false, // page-scroll friendly; zoom via controls / pinch
      attributionControl: true
    });
    L.tileLayer(TILE_BASE, { attribution: TILE_ATTRIB, maxZoom: 16 }).addTo(map);
    L.tileLayer(TILE_LABELS, { maxZoom: 16, pane: "shadowPane" }).addTo(map);
    map.setView([25, -80], 4);
    // Cluster only true pile-ups (several South-Florida centers share a viewport pixel
    // at national zoom); the gold coin icon carries the count.
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 42,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) =>
        L.divIcon({
          className: "bt-map-cluster",
          html: `<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                   background:radial-gradient(circle at 35% 30%, #EDC368, #C4A03C 60%, #8F701F);
                   border:2px solid #12100B;color:#171204;font-weight:800;font-family:Mulish,system-ui,sans-serif;
                   box-shadow:0 4px 14px rgba(18,16,11,.35);">${c.getChildCount()}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
    };
  }, []);

  // (Re)build markers when the campus set changes; fit bounds to the fellowship.
  React.useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    cluster.clearLayers();
    markersRef.current.clear();

    plottable.forEach((c) => {
      const marker = L.marker([c.lat as number, c.lng as number], {
        icon: makeIcon(false),
        title: c.name,
        riseOnHover: true
      });
      const link = c.slug
        ? `<a href="/locations/${c.slug}" style="color:#EDC368;font-weight:700;text-decoration:none;">Visit this center &rarr;</a>`
        : "";
      marker.bindPopup(
        `<div style="min-width:180px">
           <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.15rem;font-weight:600;margin-bottom:2px;">${c.flag} ${c.name}</div>
           ${c.address ? `<div style="color:#B3A78B;font-size:.85rem;">${c.address}</div>` : ""}
           ${c.serviceTimesLabel ? `<div style="color:#B3A78B;font-size:.8rem;margin-top:4px;">${c.serviceTimesLabel}</div>` : ""}
           <div style="margin-top:8px;">${link}</div>
         </div>`,
        { closeButton: true }
      );
      marker.on("click", () => onActiveRef.current?.(c.id));
      cluster.addLayer(marker);
      markersRef.current.set(c.id, marker);
    });

    if (plottable.length > 1) {
      const bounds = L.latLngBounds(plottable.map((c) => [c.lat as number, c.lng as number] as [number, number]));
      map.fitBounds(bounds, { padding: [46, 46] });
    } else if (plottable.length === 1) {
      map.setView([plottable[0].lat as number, plottable[0].lng as number], 11);
    }
  }, [plottable]);

  // Active highlight: swap icons + open popup + gentle pan.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(makeIcon(id === activeId));
      if (id === activeId) {
        map.panTo(marker.getLatLng(), { animate: true });
        // A clustered marker isn't on the map yet — only open the popup when visible.
        if ((marker as any)._map) marker.openPopup();
      }
    });
    if (!activeId) map.closePopup();
  }, [activeId]);

  // Parent-driven recenter (nearest center after geolocation).
  React.useEffect(() => {
    if (mapRef.current && centerOn) mapRef.current.flyTo([centerOn.lat, centerOn.lng], 9, { duration: 1.1 });
  }, [centerOn]);

  // Visitor dot.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (userPos) {
      userMarkerRef.current = L.circleMarker([userPos.lat, userPos.lng], {
        radius: 7, color: "#12100B", weight: 2, fillColor: "#4B7BEC", fillOpacity: 0.9
      })
        .bindTooltip("You are here")
        .addTo(map);
    }
  }, [userPos]);

  return (
    <div className="bt-map" style={{ position: "relative", width: "100%", height, minHeight: 420 }}>
      <style dangerouslySetInnerHTML={{ __html: POPUP_CSS }} />
      <div
        ref={holderRef}
        style={{
          position: "absolute", inset: 0,
          borderRadius: "var(--bt-radius-lg)",
          border: "1px solid var(--bt-line)",
          overflow: "hidden",
          background: "#EAE3D2"
        }}
      />
    </div>
  );
};

export default LeafletLocatorMap;
