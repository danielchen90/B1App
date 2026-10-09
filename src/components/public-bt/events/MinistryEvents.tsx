// Conferences and studies planned in Huro's event planner (CRM > Events), soonest first, each
// linking to its page and registration at /e/<slug>. Shown at the top of /events; nothing renders
// when none is published.

import React from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import { LocalEventTime } from "./LocalEventTime";

interface Item { slug: string; kindLabel: string; title: string; subtitle: string | null; startsAt: string; endsAt: string | null; timezone: string; location: string | null; imageUrl: string | null; registrationOpen: boolean }

export async function loadMinistryEvents(): Promise<Item[]> {
  try {
    const data = await ApiHelper.getAnonymous("/crm/public/events", "MembershipApi");
    return Array.isArray(data) ? (data as Item[]) : [];
  } catch {
    return [];
  }
}

export const MinistryEvents: React.FC<{ events: Item[] }> = ({ events }) => {
  if (!events.length) return null;
  return (
    <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
      <h2 className="bt-h2">Conferences and studies</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {events.map((e) => (
          <Link key={e.slug} href={"/e/" + e.slug} className="bt-card bt-card-hover" style={{ display: "grid", overflow: "hidden", color: "inherit", textDecoration: "none" }}>
            {e.imageUrl && <div style={{ height: 170, backgroundImage: `url(${e.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
            <div style={{ padding: "18px 20px", display: "grid", gap: 8 }}>
              <div className="bt-eyebrow">{e.kindLabel}</div>
              <h3 className="bt-h3">{e.title}</h3>
              {e.subtitle && <p style={{ color: "var(--bt-body)" }}>{e.subtitle}</p>}
              <LocalEventTime startsAt={e.startsAt} endsAt={e.endsAt} hostZone={e.timezone} />
              <span className="bt-link" style={{ fontWeight: 600 }}>{e.registrationOpen ? "Register" : "See details"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
