// The opening of every inner page: eyebrow, serif title, one or two lines of lede,
// optional actions, on the light ground with the family's soft gold glow. Keeps the
// pages consistent; RSC-safe.

import React from "react";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const BtPageHead: React.FC<Props> = ({ eyebrow, title, lede, actions, children }) => (
  <section
    style={{
      borderBottom: "1px solid var(--bt-line)",
      background: "radial-gradient(56rem 22rem at 15% -6rem, rgba(240,191,76,.18), transparent 70%), var(--bt-ivory)"
    }}
  >
    <div className="bt-section-tight" style={{ paddingTop: "clamp(40px, 6vw, 72px)" }}>
      <div className="bt-eyebrow">{eyebrow}</div>
      <h1 className="bt-display" style={{ fontSize: "clamp(2.3rem, 4.6vw, 3.4rem)", marginTop: 12, maxWidth: 820 }}>{title}</h1>
      {lede && <p className="bt-lede" style={{ marginTop: 14, maxWidth: 640 }}>{lede}</p>}
      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>{actions}</div>}
      {children}
    </div>
  </section>
);
