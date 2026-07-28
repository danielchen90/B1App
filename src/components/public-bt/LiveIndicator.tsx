"use client";

// "We're live now" indicator for the BT per-campus page (Phase 20, Plan 05, SITE-05).
//
// REUSES the existing org-level LiveStream state machinery (StreamingServiceHelper's
// current-service timer + the same /preview/data/:keyName stream config) rather than a
// new streaming stack — SITE-05 Open Question 2 explicitly accepts org-level reuse this
// phase. It shows a small gold "We're live now" pill ONLY while a service is currently
// live (a current service with no >1h countdown), and renders NOTHING otherwise, so the
// hero is clean when off-air. Client-only (timer + fetch); no chat/rooms are joined —
// this is a display badge, not the full LiveStream interaction container.

import React, { useEffect, useState } from "react";
import { EnvironmentHelper } from "@/helpers";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import type { StreamConfigInterface, StreamingServiceExtendedInterface } from "@/helpers";

interface Props {
  /** The church stream key (config.church.subDomain) — same key LiveStream uses. */
  streamKey: string | null;
}

export const LiveIndicator: React.FC<Props> = ({ streamKey }) => {
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!streamKey) return;
    let active = true;

    const load = async () => {
      try {
        const result: StreamConfigInterface = await fetch(
          `${EnvironmentHelper.Common.ContentApi}/preview/data/${streamKey}`
        ).then((r) => r.json());
        StreamingServiceHelper.updateServiceTimes(result);
      } catch {
        /* no stream config → simply never shows live (safe default) */
      }
      // Same current-service timer LiveStream uses; a current service that is not a
      // far-future countdown (>1h) is treated as LIVE (mirrors LiveStream's showAlt logic).
      StreamingServiceHelper.initTimer((cs: StreamingServiceExtendedInterface | null) => {
        if (!active) return;
        let isLive = !!cs;
        if (isLive && cs?.localCountdownTime) {
          const seconds = (cs.localCountdownTime.getTime() - new Date().getTime()) / 1000;
          if (seconds > 3600) isLive = false;
        }
        setLive(isLive);
      });
    };

    load();
    return () => {
      active = false;
    };
  }, [streamKey]);

  if (!live) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        background: "var(--bt-gold)",
        color: "var(--bt-gold-ink)",
        fontFamily: "var(--bt-heading-font)",
        fontWeight: 700,
        fontSize: "0.85rem",
        letterSpacing: "0.02em"
      }}
    >
      <span
        aria-hidden
        style={{ width: 9, height: 9, borderRadius: "50%", background: "#c1121f", display: "inline-block" }}
      />
      We&apos;re live now
    </div>
  );
};
