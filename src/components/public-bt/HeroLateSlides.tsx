"use client";

// The home hero's second and third photographs, added once the page has loaded so they do
// not share the phone's bandwidth with the first photograph (the page's largest paint).
// Their CSS animation delays are shifted by the time already elapsed, so the cross-fade
// cycle stays in step with the first slide, which started at first paint.

import React from "react";

export interface LateSlide { src: string; srcSet: string; sizes: string; pos: string; delay: number }

export function HeroLateSlides({ slides }: { slides: LateSlide[] }) {
  const [startedAt, setStartedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    let done = false;
    const show = () => { if (!done) { done = true; setStartedAt(performance.now() / 1000); } };
    const later = () => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(show, { timeout: 2500 }); else setTimeout(show, 600);
    };
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    return () => { done = true; window.removeEventListener("load", later); };
  }, []);

  if (startedAt === null) return null;
  return (
    <>
      {slides.map((s) => {
        const d = `${(s.delay - startedAt).toFixed(2)}s`;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            srcSet={s.srcSet}
            sizes={s.sizes}
            width={1440}
            height={800}
            alt=""
            aria-hidden
            className="bth-slide"
            decoding="async"
            style={{ objectPosition: s.pos, animationDelay: `${d}, ${d}` }}
          />
        );
      })}
    </>
  );
}
