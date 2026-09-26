"use client";

// My giving: this year and last at a glance, recurring gifts, and every gift recorded
// in the church's books (online gifts made through the Give page).

import React from "react";
import Link from "next/link";
import type { LocatorCampus } from "../LeafletLocatorMap";
import { useMyChurch } from "./useMyChurch";
import { MyFrame, Card, CardHead, money, shortDate } from "./MyUi";
import { SignedOutCard } from "./SignedOutCard";

export const MyGiving: React.FC<{ subDomain: string; centers: LocatorCampus[] }> = ({ subDomain, centers }) => {
  const { session, me, gifts, recurring, loaded } = useMyChurch(subDomain);
  if (session.status === "signed-out" || session.status === "error") return <SignedOutCard returnUrl="/my/giving" />;
  const center = centers.find((c) => c.id === me?.person?.campusId);
  const year = new Date().getFullYear();
  const total = (y: number) => gifts.filter((g) => new Date(g.donationDate || g.createdAt || 0).getFullYear() === y).reduce((s, g) => s + Number(g.amount || 0), 0);
  const giveHref = center ? "/give?center=" + encodeURIComponent(center.slug || "") + "#give-now" : "/give";

  return (
    <MyFrame centerSlug={center?.slug}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 className="my-serif" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)", fontWeight: 400 }}>My giving</h1>
          <p style={{ marginTop: 8, color: "var(--bt-body)" }}>&ldquo;God loves a cheerful giver.&rdquo; 2 Corinthians 9:7</p>
        </div>
        <Link className="my-btn-dark" href={giveHref}>Give</Link>
      </div>
      {!loaded ? <div className="my-card" style={{ minHeight: 240 }} aria-busy="true" /> : (
        <>
          <div className="my-grid-2">
            <Card>
              <CardHead title="At a glance" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {[[money(total(year)), "Given in " + year], [money(total(year - 1)), "Given in " + (year - 1)], [String(recurring.length), recurring.length === 1 ? "Recurring gift" : "Recurring gifts"]].map(([v, l]) => (
                  <div key={l} style={{ borderRadius: 12, background: "var(--bt-ivory)", padding: 16 }}>
                    <b className="my-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--bt-ink)" }}>{v}</b>
                    <p style={{ marginTop: 4, fontSize: 12, color: "var(--bt-body)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHead title="Recurring gifts" />
              {recurring.length > 0 ? (
                <ul className="my-list">
                  {recurring.map((r: any, i: number) => (
                    <li key={r.id || i} className="myd-item" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 14 }}>
                      <b style={{ fontWeight: 500, color: "var(--bt-ink)" }}>{r.funds?.[0]?.name || r.fundName || "Recurring gift"}</b>
                      <span style={{ color: "var(--bt-muted)" }}>{money(Number(r.amount || r.plan?.amount || 0) / (r.plan ? 100 : 1))} {r.interval || r.plan?.interval || "monthly"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="my-empty">No recurring gifts. You can choose monthly giving on the Give page.<br /><Link href={giveHref}>Set up a recurring gift</Link></p>
              )}
            </Card>
          </div>
          <Card>
            <CardHead title="Gift history" sub="Gifts made online through this site. For gifts made another way, ask your center's office." />
            {gifts.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
                  <thead>
                    <tr>{["Date", "Fund", "Method", "Amount"].map((h) => <th key={h} style={{ textAlign: h === "Amount" ? "right" : "left", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--bt-muted)", fontWeight: 600, padding: "0 0 10px" }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {gifts.map((g: any, i: number) => (
                      <tr key={g.id || i} style={{ borderTop: "1px solid var(--bt-line)" }}>
                        <td style={{ padding: "11px 0" }}>{shortDate(g.donationDate || g.createdAt)}</td>
                        <td>{g.fund?.name || g.fundName || ""}</td>
                        <td style={{ color: "var(--bt-muted)" }}>{g.method || ""}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--bt-ink)", fontWeight: 500 }}>{money(Number(g.amount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="my-empty">No gifts recorded yet. Gifts you give online will be listed here.<br /><Link href={giveHref}>Give</Link></p>
            )}
          </Card>
        </>
      )}
    </MyFrame>
  );
};
