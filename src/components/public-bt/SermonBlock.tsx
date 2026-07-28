// BT per-campus LATEST-SERMON block (Phase 20, Plan 05, MED-01 render side).
//
// Consumes the whitelisted latest-sermon DTO from GET /sermons/public/latest/:channelId
// (20-02) — { videoId, title, thumbnail, publishedAt } — or null. The YouTube API key
// stayed SERVER-SIDE in 20-02; nothing here touches a key.
//
// MIXED EMPTY-STATE: sermon is MEDIA, not core — when the DTO is null the page does not
// render this section (guarded upstream) and this component defensively renders NOTHING
// too. When present it embeds the YouTube video (privacy-enhanced nocookie domain) with
// the title + published date. RSC-safe (a plain iframe, no client JS).

import React from "react";

export interface LatestSermon {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

interface Props {
  sermon: LatestSermon | null;
}

const formatDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export const SermonBlock: React.FC<Props> = ({ sermon }) => {
  if (!sermon || !sermon.videoId) return null; // hide SILENTLY when empty

  const published = formatDate(sermon.publishedAt);

  return (
    <div>
      <h2 style={{ fontSize: "2rem", marginBottom: 8 }}>Latest Message</h2>
      {(sermon.title || published) && (
        <p style={{ color: "var(--bt-muted)", marginBottom: 22 }}>
          {sermon.title}
          {sermon.title && published ? " · " : ""}
          {published}
        </p>
      )}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          aspectRatio: "16 / 9",
          borderRadius: "var(--bt-radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--bt-line)",
          background: "#000"
        }}
      >
        <iframe
          src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(sermon.videoId)}
          title={sermon.title || "Latest message"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </div>
  );
};
