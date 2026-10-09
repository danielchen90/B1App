"use client";

// The event's start in the visitor's own time zone ("Saturday, November 14 at 5:00 AM in your time
// zone"), plus the host's time for reference. Rendered after mount so the server never guesses a zone.

import React from "react";

interface Props { startsAt: string; endsAt: string | null; hostZone: string }

const fmt = (iso: string, tz: string | undefined, withDay = true) => {
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone: tz, ...(withDay ? { weekday: "long", month: "long", day: "numeric" } : {}), hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
};

export const LocalEventTime: React.FC<Props> = ({ startsAt, endsAt, hostZone }) => {
  const [zone, setZone] = React.useState<string | null>(null);
  React.useEffect(() => { try { setZone(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { setZone("UTC"); } }, []);

  const hostLine = `${fmt(startsAt, hostZone)} (${hostZone.split("/").pop()!.replace(/_/g, " ")} time)`;
  if (!zone) return <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>{hostLine}</p>;
  const sameDay = endsAt && new Date(endsAt).getTime() - new Date(startsAt).getTime() < 20 * 3600000;
  return (
    <div>
      <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--bt-ink)" }}>
        {fmt(startsAt, zone)}{sameDay ? " to " + fmt(endsAt!, zone, false) : ""}
      </p>
      <p style={{ fontSize: "0.9rem", color: "var(--bt-muted)", marginTop: 2 }}>
        Your time ({zone.split("/").pop()!.replace(/_/g, " ")}){zone !== hostZone ? ". Hosted at " + hostLine : ""}
      </p>
    </div>
  );
};
