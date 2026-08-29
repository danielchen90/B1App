// Per-campus hero — the ink band carrying the center's name in the display serif, the
// nation eyebrow, welcome copy, and the visit/give calls to action. Uses the campus
// heroImage when authored; otherwise the shared worship photograph sunk into the ink.

import React from "react";
import { LiveIndicator } from "./LiveIndicator";

interface Props {
  campusName: string;
  churchName: string;
  heroImage: string | null;
  welcomeNote: string;
  pastorNote: string;
  flag?: string;
  country?: string;
  leaders?: string;
  giveUrl?: string;
  sermonChannel: string | null;
  streamKey: string | null;
}

export const CampusHero: React.FC<Props> = ({
  campusName,
  churchName,
  heroImage,
  welcomeNote,
  flag,
  country,
  leaders,
  giveUrl,
  streamKey
}) => {
  const copy =
    welcomeNote ||
    `Welcome home. Whoever you are and wherever you're from, there's a seat for you at ${campusName}. Come and be taught of the Lord.`;

  const image = heroImage || "/bt/worship.jpg";

  return (
    <section
      className="bt-dark"
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid var(--bt-line-dark)"
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(180deg, rgba(18,16,11,0.86) 0%, rgba(18,16,11,0.6) 50%, rgba(18,16,11,0.94) 100%), url("${image}")`,
          backgroundSize: "cover", backgroundPosition: "center 30%"
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: "var(--bt-maxw)", margin: "0 auto",
          padding: "clamp(80px, 12vw, 140px) 22px clamp(64px, 9vw, 104px)",
          textAlign: "center"
        }}
      >
        <div style={{ marginBottom: 16, minHeight: 30 }}>
          <LiveIndicator streamKey={streamKey} />
        </div>
        <div className="bt-eyebrow" style={{ justifyContent: "center" }}>
          {churchName}{country ? <> &middot; {flag} {country}</> : null}
        </div>
        <h1 className="bt-display" style={{ maxWidth: 900, margin: "20px auto 0" }}>{campusName}</h1>
        {leaders && (
          <div
            style={{
              marginTop: 14, fontFamily: "var(--bt-display-font)", fontStyle: "italic",
              fontSize: "1.15rem", color: "var(--bt-gold-bright)"
            }}
          >
            {leaders}
          </div>
        )}
        <p className="bt-lede bt-muted-text" style={{ maxWidth: 640, margin: "20px auto 34px" }}>
          {copy}
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a className="bt-btn" href="#visit">Plan Your Visit</a>
          {giveUrl && (
            <a className="bt-btn bt-btn-ghost" href={giveUrl} target="_blank" rel="noopener noreferrer">
              Give
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
