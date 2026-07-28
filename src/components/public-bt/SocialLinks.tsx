// BT per-campus SOCIAL LINKS (Phase 20, Plan 05, MED-02).
//
// Renders facebook/instagram/youtube + any extraLinks (per-campus + org-default already
// MERGED by the API resolver — this is pure render). Every link is an external anchor
// with rel="noopener noreferrer" and target="_blank". Individual links that are absent
// are simply not rendered; if NONE are present the whole block renders nothing. RSC-safe.

import React from "react";
import type { ExtraLink } from "./campusContentTypes";

interface Props {
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  extraLinks: ExtraLink[];
}

export const SocialLinks: React.FC<Props> = ({ facebookUrl, instagramUrl, youtubeUrl, extraLinks }) => {
  const named: { label: string; url: string }[] = [
    facebookUrl ? { label: "Facebook", url: facebookUrl } : null,
    instagramUrl ? { label: "Instagram", url: instagramUrl } : null,
    youtubeUrl ? { label: "YouTube", url: youtubeUrl } : null
  ].filter(Boolean) as { label: string; url: string }[];

  const extras = (extraLinks || []).filter((l) => l && l.url && l.label);
  const all = [...named, ...extras];

  if (all.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
      {all.map((l, i) => (
        <a
          key={l.label + i}
          className="bt-btn bt-btn-outline"
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "10px 20px", fontSize: "0.95rem" }}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
};
