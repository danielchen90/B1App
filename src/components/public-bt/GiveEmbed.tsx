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
import { track } from "@/lib/analytics";

export interface GiveFund { id: string; name: string }

interface Props {
  churchId: string;
  funds: GiveFund[];
  centers: { slug: string | null; name: string }[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// The giving form's recurring intervals, as analytics frequencies.
const FREQUENCY: Record<string, string> = { one_week: "weekly", two_week: "biweekly", one_month: "monthly", three_month: "quarterly", one_year: "yearly" };

export const GiveEmbed: React.FC<Props> = ({ churchId, funds, centers }) => {
  const [saved, ready] = useSavedCenter();
  const [fundId, setFundId] = React.useState<string>("");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Analytics. The ChurchApps form has no callbacks, so it is read from the page: its
  // "Donate" button starts a gift (amount, frequency, fund) and its success notice
  // completes it. Nothing about the card or the giver is read.
  const boxRef = React.useRef<HTMLDivElement>(null);
  const recurring = React.useRef(false);
  const lastGift = React.useRef<Record<string, string | number | null> | null>(null);
  const fundName = funds.find((f) => f.id === fundId)?.name || null;

  const onFormClick = (e: React.MouseEvent) => {
    const btn = (e.target as Element).closest("button");
    const box = boxRef.current;
    if (!btn || !box) return;
    const label = btn.getAttribute("aria-label");
    if (label === "single-donation") { recurring.current = false; return; }
    if (label === "recurring-donation") { recurring.current = true; return; }
    if (btn.textContent?.trim() !== "Donate") return;
    const amount = Array.from(box.querySelectorAll<HTMLInputElement>("input[name='amount']")).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    const interval = box.querySelector<HTMLInputElement>("input[name='interval']")?.value || "one_month";
    lastGift.current = { amount, currency: "USD", frequency: recurring.current ? FREQUENCY[interval] || interval : "once", fund_id: fundId, fund_name: fundName, method: "online_form" };
    track("give_started", lastGift.current);
  };

  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let done = false;
    const check = () => {
      if (done || !box.querySelector(".MuiAlert-standardSuccess, .MuiAlert-colorSuccess")) return;
      done = true;
      track("give_completed", lastGift.current || { currency: "USD", fund_id: fundId, fund_name: fundName, method: "online_form" });
    };
    const observer = new MutationObserver(check);
    observer.observe(box, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [fundId, mounted]);

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
      <div className="bt-card" style={{ padding: 8, overflow: "hidden" }} ref={boxRef} onClickCapture={onFormClick}>
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
