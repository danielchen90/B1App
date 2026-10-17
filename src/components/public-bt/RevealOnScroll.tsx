"use client";

// Scroll reveal for a whole page: mount once, and every `.bt-reveal` element rises into
// place the first time it scrolls into view. Children can stagger with `style={{ "--d": n }}`
// (n × 90 ms). Without JavaScript, or with reduced motion, everything simply shows.

import React from "react";

const CSS = `
.bt-reveal-on .bt-reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: calc(var(--d, 0) * 90ms); }
.bt-reveal-on .bt-reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .bt-reveal-on .bt-reveal { opacity: 1; transform: none; transition: none; } }
`;

export const RevealOnScroll: React.FC = () => {
  React.useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".bt-reveal"));
    if (!("IntersectionObserver" in window) || nodes.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    // Anything already on screen shows at once; the rest waits for its turn.
    nodes.forEach((n) => { if (n.getBoundingClientRect().top < window.innerHeight * 0.92) n.classList.add("is-in"); else io.observe(n); });
    root.classList.add("bt-reveal-on");
    return () => { io.disconnect(); root.classList.remove("bt-reveal-on"); };
  }, []);
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
};
