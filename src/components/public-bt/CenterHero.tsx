// Worship-center hero: the center's photo edge to edge, darkened just enough for white
// type, settling in with a slow zoom on load. The name, welcome, pastor, times and place
// sit centered over the photo, then the actions: a gold pill whose arrow slides through on
// hover, Directions, and "Make this my center".
// RSC; the live badge and the my-center button are the only client islands.

import React from "react";
import { LiveIndicator } from "./LiveIndicatorLazy";
import { MakeMyCenter } from "./CenterActions";
import { IconArrowRight, IconChevronDown, IconClock, IconGlobe, IconPin, IconUser } from "./BtIcons";

export interface CenterHeroAction {
  label: string;
  href: string;
  external?: boolean;
  attrs?: Record<string, string>;
}

interface Props {
  name: string;
  eyebrow: string;
  welcome: string;
  cover: string;
  photoCredit?: string;
  pastor?: string;
  times?: string;
  place?: string;
  virtual?: boolean;
  slug?: string | null;
  liveKey?: string | null;
  primary: CenterHeroAction;
  directions?: CenterHeroAction | null;
  nextHref: string;
}

const CSS = `
.bt-hero { position: relative; isolation: isolate; overflow: hidden; display: grid; place-items: center;
  min-height: clamp(580px, 88vh, 880px); padding: 96px 20px 120px; background: var(--bt-abyss); color: #fff; }
.bt-hero-img { position: absolute; inset: 0; z-index: -3; background: center / cover no-repeat; transform-origin: 50% 40%;
  animation: btHeroZoom 2.6s cubic-bezier(.2,.7,.2,1) both; }
.bt-hero-shade { position: absolute; inset: 0; z-index: -2;
  background: radial-gradient(120% 80% at 50% 45%, rgba(12,12,18,.18) 0%, rgba(12,12,18,.55) 70%, rgba(12,12,18,.78) 100%),
              linear-gradient(180deg, rgba(12,12,18,.45) 0%, rgba(12,12,18,.12) 30%, rgba(12,12,18,.30) 60%, rgba(12,12,18,.86) 100%); }
.bt-hero-in { position: relative; width: 100%; max-width: 960px; text-align: center; }
.bt-hero .bt-eyebrow { color: var(--bt-gold-bright); text-shadow: 0 1px 12px rgba(0,0,0,.4); }
.bt-root .bt-hero h1 { color: #fff; font-size: clamp(3.1rem, 9vw, 7rem); font-weight: 600; line-height: .98; margin-top: 14px; text-shadow: 0 2px 30px rgba(0,0,0,.35); }
.bt-root .bt-hero-lede { max-width: 680px; margin: 20px auto 0; font-size: clamp(1.05rem, 1.8vw, 1.25rem); line-height: 1.6; font-weight: 300; color: rgba(255,255,255,.92); text-shadow: 0 1px 14px rgba(0,0,0,.45); }
.bt-hero-facts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 26px; }
.bt-hero-fact { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; border-radius: 999px; font-size: .93rem; color: #fff;
  background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.bt-hero-fact svg { color: var(--bt-gold-bright); flex: none; }
.bt-hero-acts { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; margin-top: 30px; }
/* The pill: label + a round arrow badge; on hover the arrow slides out and its twin slides in. */
.bt-root a.bt-pill { display: inline-flex; align-items: center; gap: 0; border-radius: 999px; font-weight: 600; font-size: 1rem; color: #1B1408; }
.bt-pill-label { padding: 14px 26px; border-radius: 999px; background: var(--bt-gold-bright); transition: background-color .5s ease, color .5s ease; }
.bt-pill-arrow { position: relative; display: grid; place-items: center; width: 50px; height: 50px; border-radius: 999px; overflow: hidden; background: var(--bt-gold-bright); transition: background-color .5s ease, color .5s ease; }
.bt-pill-arrow svg { position: absolute; transition: transform .5s cubic-bezier(.2,.7,.2,1); }
.bt-pill-arrow svg:last-child { transform: translateX(-40px); }
.bt-root a.bt-pill:hover { color: var(--bt-gold-bright); }
.bt-pill:hover .bt-pill-label, .bt-pill:hover .bt-pill-arrow { background: #141019; }
.bt-pill:hover .bt-pill-arrow svg:first-child { transform: translateX(40px); }
.bt-pill:hover .bt-pill-arrow svg:last-child { transform: none; }
.bt-root a.bt-glass { display: inline-flex; align-items: center; gap: 8px; min-height: 50px; padding: 0 22px; border-radius: 999px; color: #fff; font-weight: 600;
  background: rgba(255,255,255,.10); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background-color .2s, box-shadow .2s; }
.bt-root a.bt-glass:hover { background: rgba(255,255,255,.2); box-shadow: inset 0 0 0 1.5px #fff; }
.bt-hero .bt-btn-outline { border-radius: 999px; min-height: 50px; background: rgba(255,255,255,.10); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35); backdrop-filter: blur(10px); }
.bt-root .bt-hero .bt-btn-outline, .bt-root .bt-hero .bt-btn-outline:hover { color: #fff; }
.bt-hero .bt-btn-outline:hover { background: rgba(255,255,255,.2); box-shadow: inset 0 0 0 1.5px #fff; }
.bt-hero .bt-chip { background: rgba(255,255,255,.14); color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); }
.bt-hero-live { min-height: 30px; display: flex; justify-content: center; margin-bottom: 6px; }
.bt-hero-live > * { background: rgba(255,255,255,.92); border-radius: 999px; padding: 2px 10px; }
.bt-hero-live > *:empty { display: none; }
.bt-root a.bt-hero-next { position: absolute; left: 50%; bottom: 74px; transform: translateX(-50%); display: grid; place-items: center; width: 44px; height: 44px; border-radius: 999px;
  color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.4); animation: btHeroBob 2.4s ease-in-out 1.6s infinite; }
.bt-hero-credit { position: absolute; right: 14px; bottom: 66px; font-size: .7rem; color: rgba(255,255,255,.7); text-shadow: 0 1px 4px rgba(0,0,0,.6); }
.bt-hero-a1 { animation: btRise .9s cubic-bezier(.2,.7,.2,1) .15s both; }
.bt-hero-a2 { animation: btRise .9s cubic-bezier(.2,.7,.2,1) .3s both; }
.bt-hero-a3 { animation: btRise .9s cubic-bezier(.2,.7,.2,1) .45s both; }
.bt-hero-a4 { animation: btRise .9s cubic-bezier(.2,.7,.2,1) .6s both; }
@keyframes btHeroZoom { from { transform: scale(1.09); } to { transform: none; } }
@keyframes btHeroBob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }
@media (max-width: 720px) {
  .bt-hero { padding: 72px 18px 112px; min-height: clamp(560px, 92vh, 760px); }
      .bt-hero-fact { font-size: .86rem; }
  .bt-hero-acts > * { flex: 0 1 auto; }
}
@media (prefers-reduced-motion: reduce) {
  .bt-hero-img, }
`;

const ActionLink: React.FC<{ a: CenterHeroAction; className: string; children: React.ReactNode }> = ({ a, className, children }) => (
  <a className={className} href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...(a.attrs || {})}>{children}</a>
);

export const CenterHero: React.FC<Props> = (p) => (
  <section className="bt-hero" aria-label={p.name}>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="bt-hero-img" role="img" aria-label={p.name + " worship center"} style={{ backgroundImage: "url('" + p.cover + "')" }} />
    <div className="bt-hero-shade" aria-hidden />

    <div className="bt-hero-in">
      <div className="bt-hero-live bt-hero-a1"><LiveIndicator streamKey={p.liveKey || null} /></div>
      <div className="bt-eyebrow bt-hero-a1">{p.eyebrow}</div>
      <h1 className="bt-hero-a2">{p.name}</h1>
      <p className="bt-hero-lede bt-hero-a3">{p.welcome}</p>
      <div className="bt-hero-facts bt-hero-a3">
        {p.pastor && <span className="bt-hero-fact"><IconUser size={16} />{p.pastor}</span>}
        {p.times && <span className="bt-hero-fact"><IconClock size={16} />{p.times}</span>}
        {p.virtual
          ? <span className="bt-hero-fact"><IconGlobe size={16} />Join from anywhere in the world</span>
          : p.place && <span className="bt-hero-fact"><IconPin size={16} />{p.place}</span>}
      </div>
      <div className="bt-hero-acts bt-hero-a4">
        <ActionLink a={p.primary} className="bt-pill">
          <span className="bt-pill-label">{p.primary.label}</span>
          <span className="bt-pill-arrow" aria-hidden><IconArrowRight size={19} /><IconArrowRight size={19} /></span>
        </ActionLink>
        {p.directions && <ActionLink a={p.directions} className="bt-glass"><IconPin size={17} />{p.directions.label}</ActionLink>}
        {p.slug && <MakeMyCenter slug={p.slug} name={p.name} />}
      </div>
    </div>

    <a className="bt-hero-next" href={p.nextHref} aria-label="More about this center"><IconChevronDown size={20} /></a>
    {p.photoCredit && <div className="bt-hero-credit">{p.photoCredit}</div>}
  </section>
);
