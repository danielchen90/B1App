// Hand-drawn 24px stroke icon set for the BT public site — thin 1.5px strokes to match
// the hairline aesthetic. One component per glyph; `size` and currentColor throughout.

import React from "react";

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 20, strokeWidth = 1.6, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ flex: "none" }}
  >
    {children}
  </svg>
);

export const IconHome: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></Svg>
);

export const IconBook: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 6.5C10.2 4.9 7.4 4.5 4 4.5v13c3.4 0 6.2.4 8 2 1.8-1.6 4.6-2 8-2v-13c-3.4 0-6.2.4-8 2Z" /><path d="M12 6.5v13" /></Svg>
);

export const IconPlay: React.FC<IconProps> = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M10 8.8v6.4l5.2-3.2L10 8.8Z" /></Svg>
);

export const IconPin: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 21s-6.5-5.6-6.5-10.4A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.6C18.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.3" /></Svg>
);

export const IconGlobe: React.FC<IconProps> = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5S9.4 5.8 12 3.5Z" /></Svg>
);

export const IconHeart: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 19.5S4.5 14.9 4.5 9.7A3.9 3.9 0 0 1 8.4 6c1.6 0 2.9.9 3.6 2.2A4.1 4.1 0 0 1 15.6 6a3.9 3.9 0 0 1 3.9 3.7c0 5.2-7.5 9.8-7.5 9.8Z" /></Svg>
);

export const IconGift: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M4.5 11.5h15V20h-15v-8.5Z" /><path d="M3.5 8h17v3.5h-17V8Z" /><path d="M12 8v12" /><path d="M12 8S9 8 7.8 6.8a1.9 1.9 0 0 1 2.7-2.7C11.7 5.3 12 8 12 8Zm0 0s3 0 4.2-1.2a1.9 1.9 0 0 0-2.7-2.7C12.3 5.3 12 8 12 8Z" /></Svg>
);

export const IconMail: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4.5 7 7.5 6 7.5-6" /></Svg>
);

export const IconPhone: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M7.5 4.5 9.7 8l-1.8 1.8a12.6 12.6 0 0 0 6.3 6.3L16 14.3l3.5 2.2-1 2.6c-.3.7-1 1.1-1.7 1A16.5 16.5 0 0 1 3.9 7.2c-.1-.7.3-1.4 1-1.7l2.6-1Z" /></Svg>
);

export const IconClock: React.FC<IconProps> = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
);

export const IconArrowRight: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></Svg>
);

export const IconMenu: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></Svg>
);

export const IconClose: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="m6 6 12 12" /><path d="M18 6 6 18" /></Svg>
);

export const IconChevronDown: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="m6 9.5 6 6 6-6" /></Svg>
);

export const IconYouTube: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="3" y="6.5" width="18" height="11" rx="3" /><path d="M10.2 9.7v4.6l4.2-2.3-4.2-2.3Z" /></Svg>
);

export const IconFacebook: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M14.8 4.5h-2A3.3 3.3 0 0 0 9.5 7.8v2.4h-2v3.1h2v6.2h3.2v-6.2h2.3l.5-3.1h-2.8V8.3c0-.5.4-.8.9-.8h1.2V4.5Z" /></Svg>
);

export const IconInstagram: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" stroke="none" /></Svg>
);
