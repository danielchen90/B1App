// Member sign-in (Mary Banks ID + My Church) on/off switch for the Bible Teachers sites.
// A plain server-side environment variable read at RUNTIME (BT_MEMBER_SIGNIN=1), not a
// NEXT_PUBLIC_* one: those are baked in at build time, and this deployment's builds
// don't reliably see them. The root layout passes the value to the browser as
// window.__BT_SIGNIN__.

export const memberSignInEnabled = (): boolean =>
  process.env.BT_MEMBER_SIGNIN === "1" || process.env.NEXT_PUBLIC_BT_MEMBER_SIGNIN === "1";

export const memberSignInEnabledInBrowser = (): boolean =>
  typeof window !== "undefined" && (window as unknown as { __BT_SIGNIN__?: boolean }).__BT_SIGNIN__ === true;
