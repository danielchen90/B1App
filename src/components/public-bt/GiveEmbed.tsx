"use client";

// Giving that records each gift in the church's own books (ChurchApps giving module,
// Stripe gateway): one gift or every month, card or bank, to the ministry or to a
// worship center's fund. Gifts made here appear in the giver's My Church history and
// year-end statement, which the old payment links could never do.
//
// Funds are matched to centers by name ("Atlanta" fund for the Atlanta center); the
// visitor's remembered center is preselected. Signed-in or not, the same form works.

import React from "react";
import { NonAuthDonationWrapper } from "@churchapps/apphelper/website";
import { useSavedCenter } from "./MyCenter";

export interface GiveFund { id: string; name: string }

interface Props {
  churchId: string;
  funds: GiveFund[];
  centers: { slug: string | null; name: string }[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const GiveEmbed: React.FC<Props> = ({ churchId, funds, centers }) => {
  const [saved, ready] = useSavedCenter();
  const [fundId, setFundId] = React.useState<string>("");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const fundForCenter = React.useCallback((slug: string | null) => {
    const c = centers.find((x) => x.slug === slug);
    return c ? funds.find((f) => norm(f.name) === norm(c.name) || norm(f.name).startsWith(norm(c.name))) : undefined;
  }, [centers, funds]);

  React.useEffect(() => {
    if (!ready || fundId) return;
    const fromQuery = new URLSearchParams(window.location.search).get("center");
    const f = fundForCenter(fromQuery) || fundForCenter(saved);
    const general = funds.find((x) => /general|ministry|tithe/i.test(x.name)) || funds[0];
    setFundId((f || general)?.id || "");
  }, [ready, saved, fundForCenter, funds, fundId]);

  if (!mounted || !fundId) return <div className="bt-card" style={{ minHeight: 420 }} aria-hidden />;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className="bt-eyebrow" style={{ marginRight: 4 }}>Give to</span>
        {funds.map((f) => {
          const on = f.id === fundId;
          return (
            <button key={f.id} type="button" className="bt-chip" aria-pressed={on} onClick={() => setFundId(f.id)}
              style={on ? { background: "var(--bt-ink)", color: "#fff", boxShadow: "none" } : undefined}>
              {f.name}
            </button>
          );
        })}
      </div>
      <div className="bt-card" style={{ padding: 8, overflow: "hidden" }}>
        <NonAuthDonationWrapper
          key={fundId}
          churchId={churchId}
          showHeader={false}
          defaultFundId={fundId}
          allowSingleGift
          allowRecurring
          showFundSelector
          mainContainerCssProps={{ sx: { boxShadow: "none", padding: 2 } }}
        />
      </div>
      <p className="bt-muted-text" style={{ fontSize: "0.9rem" }}>
        Every gift is processed securely by Stripe. Sign in with your Mary Banks ID to see your giving history, manage recurring gifts and download a year-end statement in My Church.
      </p>
    </div>
  );
};
