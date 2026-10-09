// Home page hero: a full-width photograph of worship that slowly cross-fades between
// three scenes (praise, the Word opened, the choir), each drifting in closer, under a
// warm shade that keeps the welcome readable. The visitor's worship center and the
// My Church card sit on a dock that rises over the hero's bottom edge.
//
// Pure CSS animation (no timers), so it renders on the server and costs nothing in the
// browser. The cycle is 24s: each slide is on top for 8s and cross-fades for ~1.5s.
// DOM order is last-slide-first so the slide that is fading out always sits above the
// one fading in. prefers-reduced-motion shows the first photograph, still.

import React from "react";
import { preload } from "react-dom";
import Link from "next/link";
import type { LocatorCampus } from "./LeafletLocatorMap";
import { LiveIndicator } from "./LiveIndicator";
import { MyCenter } from "./MyCenter";
import { HomeMemberCard } from "./HomeMemberCard";
import { IconPlay, IconPin } from "./BtIcons";

const SLIDES = [
  { src: "/bt/hero-praise.jpg", label: "Worship", pos: "70% 40%" },
  { src: "/bt/hero-word.jpg", label: "The Word", pos: "60% 50%" },
  { src: "/bt/hero-choir.jpg", label: "Praise", pos: "65% 35%" }
];

const CYCLE = 24;
const STEP = CYCLE / SLIDES.length;

const CSS = `
.bth { position: relative; overflow: hidden; background: #140F0A; color: #fff; isolation: isolate;
  min-height: clamp(540px, 78vh, 760px); display: flex; align-items: center; }
.bth-slide { position: absolute; inset: 0; z-index: -3; background: center / cover no-repeat;
  animation: bth-fade ${CYCLE}s linear infinite, bth-drift ${CYCLE}s ease-out infinite; will-change: opacity, transform; }
@keyframes bth-fade { 0% { opacity: 1; } 33.3% { opacity: 1; } 40% { opacity: 0; } 95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes bth-drift { 0% { transform: scale(1.12) translate3d(0, 0, 0); } 40% { transform: scale(1.02) translate3d(-1%, -1%, 0); } 95% { transform: scale(1.12); } 100% { transform: scale(1.12); } }
.bth-shade { position: absolute; inset: 0; z-index: -2;
  background:
    linear-gradient(90deg, rgba(20,14,8,.92) 0%, rgba(20,14,8,.74) 34%, rgba(20,14,8,.28) 64%, rgba(20,14,8,.12) 100%),
    linear-gradient(180deg, rgba(20,14,8,.35) 0%, rgba(20,14,8,0) 26%, rgba(20,14,8,0) 62%, rgba(20,14,8,.7) 100%); }
.bth-glow { position: absolute; z-index: -1; top: -30%; left: 18%; width: 60vw; height: 110%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(240,191,76,.28), rgba(240,191,76,0));
  transform: rotate(-18deg); filter: blur(10px); animation: bth-breathe 9s ease-in-out infinite alternate; }
@keyframes bth-breathe { from { opacity: .55; } to { opacity: 1; } }
.bth-in { position: relative; width: 100%; max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(56px, 8vw, 110px) 20px clamp(150px, 16vw, 190px); }
.bth-copy { max-width: 660px; }
.bth .bt-eyebrow { color: var(--bt-gold-bright); }
.bth h1 { color: #fff; font-size: clamp(3rem, 7.4vw, 6.1rem); line-height: .98; margin-top: 16px; text-shadow: 0 2px 30px rgba(0,0,0,.35); }
.bth h1 em { display: block; font-style: italic; color: var(--bt-gold-bright);
  background: linear-gradient(100deg, #F7D98A 0%, #F0BF4C 45%, #D9A233 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.bth-lede { margin-top: 22px; max-width: 540px; font-size: clamp(1.05rem, 1.6vw, 1.22rem); line-height: 1.6; color: rgba(255,255,255,.88); }
.bth-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.bt-root .bth-glass { background: rgba(255,255,255,.1); color: #fff; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.4);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.bt-root .bth-glass:hover { background: rgba(255,255,255,.2); color: #fff; box-shadow: inset 0 0 0 1.5px #fff; }
.bth-verse { margin: 34px 0 0; padding-left: 16px; border-left: 2px solid var(--bt-gold-bright); max-width: 460px; }
.bth-verse p { font-family: var(--bt-display-font); font-style: italic; font-size: 1.15rem; line-height: 1.4; color: rgba(255,255,255,.9); }
.bth-verse cite { display: block; margin-top: 6px; font-style: normal; font-size: 11px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--bt-gold-bright); }
.bth-caps { position: absolute; right: max(20px, calc((100vw - var(--bt-maxw)) / 2 + 20px)); bottom: clamp(150px, 16vw, 190px);
  display: flex; gap: 18px; font-size: 11px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.75); }
.bth-cap { display: grid; gap: 7px; width: 86px; }
.bth-cap i { display: block; height: 2px; background: rgba(255,255,255,.25); border-radius: 2px; overflow: hidden; }
.bth-cap i::after { content: ""; display: block; height: 100%; background: var(--bt-gold-bright); transform-origin: left;
  transform: scaleX(0); animation: bth-bar ${CYCLE}s linear infinite; animation-delay: inherit; }
@keyframes bth-bar { 0% { transform: scaleX(0); } 33.3% { transform: scaleX(1); } 33.4% { transform: scaleX(0); } 100% { transform: scaleX(0); } }
@media (max-width: 760px) {
  .bth-caps { display: none; }
  .bth-shade { background: linear-gradient(180deg, rgba(20,14,8,.35) 0%, rgba(20,14,8,.7) 50%, rgba(20,14,8,.9) 100%); }
}

/* The dock: rises over the hero's lower edge */
.bth-dock { position: relative; z-index: 2; max-width: var(--bt-maxw); margin: calc(-1 * clamp(110px, 12vw, 140px)) auto 0; padding: 0 20px;
  display: flex; flex-wrap: wrap; gap: 20px; align-items: stretch; }
.bth-dock > .bth-dock-center { flex: 1.7 1 520px; min-width: 0; }
.bth-dock > .bth-dock-member { flex: 1 1 300px; min-width: 0; display: flex; }
.bth-dock .bt-mc { height: 100%; box-shadow: 0 2px 4px rgba(24,24,32,.06), 0 30px 60px -28px rgba(24,24,32,.55); }
.bth-dock-center, .bth-dock-member { animation: bth-rise .9s cubic-bezier(.2,.7,.2,1) both; }
.bth-dock-member { animation-delay: .12s; }
@keyframes bth-rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .bth-slide, .bth-glow, .bth-cap i::after, .bth-dock-center, .bth-dock-member { animation: none; }
  .bth-slide { opacity: 0; }
  .bth-slide.first { opacity: 1; transform: none; }
}
`;

interface Props {
  centers: LocatorCampus[];
  physicalCount: number;
  nations: number;
  streamKey: string | null;
}

export const BtHomeHero: React.FC<Props> = ({ centers, physicalCount, nations, streamKey }) => {
  // Slide i is on top from i*STEP seconds into the cycle; negative delays start them mid-cycle.
  const delay = (i: number) => (i === 0 ? "0s" : `-${CYCLE - i * STEP}s`);
  // The slides are CSS backgrounds, found late; fetch them with the document instead.
  SLIDES.forEach((s, i) => preload(s.src, { as: "image", fetchPriority: i === 0 ? "high" : "low" }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="bth" aria-label="Welcome">
        {[...SLIDES].map((s, i) => ({ ...s, i })).reverse().map((s) => (
          <div
            key={s.src}
            className={"bth-slide" + (s.i === 0 ? " first" : "")}
            aria-hidden
            style={{ backgroundImage: `url(${s.src})`, backgroundPosition: s.pos, animationDelay: `${delay(s.i)}, ${delay(s.i)}` }}
          />
        ))}
        <div className="bth-shade" aria-hidden />
        <div className="bth-glow" aria-hidden />

        <div className="bth-in">
          <div className="bth-copy">
            <div style={{ minHeight: 30, marginBottom: 8 }}>
              <LiveIndicator streamKey={streamKey} />
            </div>
            <div className="bt-eyebrow bt-rise">Bible Teachers International · Worship Centers</div>
            <h1 className="bt-display bt-rise-2">
              Come and be <em>taught of the Lord.</em>
            </h1>
            <p className="bth-lede bt-rise-3">
              {`Lift your hands, open your Bible, and worship with us. ${physicalCount} worship center${physicalCount === 1 ? "" : "s"} in ${nations} nation${nations === 1 ? "" : "s"}, the Online Church and the Global Church, one family around the same Word. There’s a seat saved for you.`}
            </p>
            <div className="bth-cta bt-rise-3">
              <Link className="bt-btn" href="/watch"><IconPlay size={18} /> Worship with us online</Link>
              <Link className="bt-btn bth-glass" href="/locations"><IconPin size={18} /> Find a worship center</Link>
            </div>
            <blockquote className="bth-verse bt-rise-3">
              <p>&ldquo;And all thy children shall be taught of the LORD; and great shall be the peace of thy children.&rdquo;</p>
              <cite>Isaiah 54:13</cite>
            </blockquote>
          </div>
        </div>

        <div className="bth-caps" aria-hidden>
          {SLIDES.map((s, i) => (
            <div key={s.label} className="bth-cap" style={{ animationDelay: delay(i) }}>
              {s.label}
              <i style={{ animationDelay: delay(i) }} />
            </div>
          ))}
        </div>
      </section>

      <div className="bth-dock">
        <div className="bth-dock-center"><MyCenter centers={centers} /></div>
        <div className="bth-dock-member"><HomeMemberCard /></div>
      </div>
    </>
  );
};
