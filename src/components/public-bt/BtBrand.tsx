// Bible Teachers brand mark — the single logo seam. The real mark (gold globe on a
// transparent circle) now renders beside a two-line wordmark lockup.

import React from "react";
import Image from "next/image";

interface Props {
  /** sm = header/footer; lg = hero-scale. */
  size?: "sm" | "lg";
  /** Set when rendering on a dark band. */
  dark?: boolean;
}

export const BtBrand: React.FC<Props> = ({ size = "sm", dark = false }) => {
  const logo = size === "sm" ? 44 : 92;
  const nameSize = size === "sm" ? "1.02rem" : "1.7rem";
  const subSize = size === "sm" ? "0.56rem" : "0.8rem";
  return (
    <span aria-label="Bible Teachers International" style={{ display: "inline-flex", alignItems: "center", gap: size === "sm" ? 11 : 18 }}>
      <Image
        src="/bt/logo.png"
        alt=""
        width={logo}
        height={logo}
        priority={size === "sm"}
        style={{ display: "block", borderRadius: "50%" }}
      />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: "var(--bt-display-font)",
            fontWeight: 600,
            fontSize: nameSize,
            letterSpacing: "0.01em",
            color: dark ? "var(--bt-ondark)" : "var(--bt-ink)",
            whiteSpace: "nowrap"
          }}
        >
          Bible Teachers Int&rsquo;l
        </span>
        <span
          style={{
            fontFamily: "var(--bt-eyebrow-font)",
            fontWeight: 600,
            fontSize: subSize,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: dark ? "var(--bt-gold-bright)" : "var(--bt-gold-deep)",
            whiteSpace: "nowrap"
          }}
        >
          Mary Banks Ministries
        </span>
      </span>
    </span>
  );
};
