"use client";

// One message from the ministry's channel. Shows the thumbnail with a play button and
// only loads YouTube's player when the visitor presses play (faster pages, and no
// YouTube cookies until someone chooses to watch). `feature` is the large version for
// the latest message; the small version links out to the full player page.

import React from "react";
import type { FeedSermon } from "@/helpers/SermonFeedHelper";
import { classifySermon } from "./btSiteContent";

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  // One time zone on server and browser (the ministry's), or evening visitors in the
  // Americas get a different date than the server rendered and React re-renders the page.
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
};

const CSS = `
.bt-msg { display: grid; gap: 12px; align-content: start; }
.bt-msg-frame { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--bt-radius-lg); overflow: hidden; background: #111 center / cover no-repeat; border: 0; padding: 0; cursor: pointer; display: block; }
.bt-msg-frame::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.35)); }
.bt-msg-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1; width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.94); display: grid; place-items: center; box-shadow: 0 10px 30px rgba(0,0,0,.35); transition: transform .15s; }
.bt-msg-frame:hover .bt-msg-play { transform: translate(-50%, -50%) scale(1.06); }
.bt-msg-small .bt-msg-play { width: 48px; height: 48px; }
.bt-msg-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; z-index: 2; }
.bt-msg-meta { display: grid; gap: 2px; }
.bt-msg-series { font-size: .76rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--bt-gold-deep); }
.bt-msg-title { font-family: var(--bt-display-font); font-weight: 600; color: var(--bt-ink); line-height: 1.2; }
.bt-msg-sub { font-size: .9rem; color: var(--bt-muted); }
`;

export const MessageCard: React.FC<{ sermon: FeedSermon; feature?: boolean }> = ({ sermon, feature = false }) => {
  const [playing, setPlaying] = React.useState(false);
  const meta = classifySermon(sermon.title);
  const thumb = feature ? `https://i.ytimg.com/vi/${sermon.videoId}/maxresdefault.jpg` : sermon.thumbnail;

  return (
    <div className={"bt-msg" + (feature ? "" : " bt-msg-small")}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {playing ? (
        <div className="bt-msg-frame" style={{ cursor: "default" }}>
          <iframe
            src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(sermon.videoId) + "?autoplay=1&rel=0"}
            title={sermon.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          className="bt-msg-frame"
          aria-label={"Play " + sermon.title}
          onClick={() => setPlaying(true)}
          style={{ backgroundImage: `url('${thumb}'), url('${sermon.thumbnail}')` }}
        >
          <span className="bt-msg-play" aria-hidden>
            <svg width={feature ? 26 : 18} height={feature ? 26 : 18} viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="#1B1B22" /></svg>
          </span>
        </button>
      )}
      <div className="bt-msg-meta">
        {meta.series && meta.series !== sermon.title && !sermon.title.startsWith(meta.series + "!") && meta.series.length < sermon.title.length - 3 && (
          <span className="bt-msg-series">{meta.series}</span>
        )}
        <span className="bt-msg-title" style={{ fontSize: feature ? "1.55rem" : "1.12rem" }}>{sermon.title}</span>
        <span className="bt-msg-sub">{[meta.speaker, fmtDate(sermon.publishedAt)].filter(Boolean).join(" · ")}</span>
      </div>
    </div>
  );
};
