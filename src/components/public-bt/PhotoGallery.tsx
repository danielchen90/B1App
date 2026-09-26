"use client";

// A center's photos, uploaded by its admin in B1Admin: a tidy grid that opens any
// photo full-screen. Arrow keys and Escape work in the viewer.

import React from "react";

const CSS = `
.bt-gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.bt-gal button { border: 0; padding: 0; border-radius: var(--bt-radius); overflow: hidden; aspect-ratio: 3 / 2; background: var(--bt-sunk) center / cover no-repeat; cursor: zoom-in; }
.bt-gal button:hover { filter: brightness(1.04); }
.bt-lb { position: fixed; inset: 0; z-index: 120; background: rgba(15,15,20,.92); display: grid; place-items: center; padding: 24px; }
.bt-lb img { max-width: min(1200px, 100%); max-height: 86vh; border-radius: 12px; }
.bt-lb-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font-size: 26px; cursor: pointer; }
.bt-lb-close { position: absolute; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font-size: 22px; cursor: pointer; }
`;

export const PhotoGallery: React.FC<{ photos: string[]; name: string }> = ({ photos, name }) => {
  const [at, setAt] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAt(null);
      if (e.key === "ArrowRight") setAt((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setAt((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, photos.length]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bt-gal">
        {photos.map((p, i) => (
          <button key={p + i} type="button" aria-label={"Open photo " + (i + 1) + " of " + name} style={{ backgroundImage: "url('" + p + "')" }} onClick={() => setAt(i)} />
        ))}
      </div>
      {at !== null && (
        <div className="bt-lb" role="dialog" aria-modal="true" aria-label={name + " photos"} onClick={() => setAt(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[at]} alt={name + ", photo " + (at + 1)} onClick={(e) => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button type="button" className="bt-lb-btn" style={{ left: 16 }} aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setAt((at - 1 + photos.length) % photos.length); }}>&#8249;</button>
              <button type="button" className="bt-lb-btn" style={{ right: 16 }} aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setAt((at + 1) % photos.length); }}>&#8250;</button>
            </>
          )}
          <button type="button" className="bt-lb-close" aria-label="Close" onClick={() => setAt(null)}>&#215;</button>
        </div>
      )}
    </>
  );
};
