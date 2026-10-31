// Start a Mary Banks ID sign-in. Query: returnUrl (a path on this site, default /my),
// target=admin to continue into B1Admin afterwards, idp=google to go straight to
// Google, sd=<church subdomain> (defaults from the host), prompt=none for the quiet
// check the middleware runs before a page shows (see lib/mbidSso.ts): it signs the
// visitor in if they are signed in to a Mary Banks ID anywhere, and otherwise comes
// straight back to the page without showing a form.

import { NextResponse } from "next/server";
import { memberSignInEnabled } from "@/lib/memberSignIn";
import { FLOW_COOKIE, MBID_CLIENT_ID, MBID_CLIENT_SECRET, MBID_ISSUER, pkceChallenge, publicOrigin, randomToken, safeReturn, sdFromHost, type MbidFlow } from "@/lib/mbid";
import { setChecked } from "@/lib/mbidSso";

export const dynamic = "force-dynamic";

// A sign-in another tab started this recently is left alone by a quiet check.
const INTERACTIVE_FLOW_GRACE_MS = 10 * 60 * 1000;

const readFlow = (req: Request): MbidFlow | null => {
  const raw = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(FLOW_COOKIE + "="));
  if (!raw) return null;
  try { return JSON.parse(Buffer.from(raw.slice(FLOW_COOKIE.length + 1), "base64url").toString("utf8")) as MbidFlow; } catch { return null; }
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const silent = url.searchParams.get("prompt") === "none";
  const flow: MbidFlow = {
    state: randomToken(24),
    verifier: randomToken(48),
    nonce: randomToken(24),
    sd: (url.searchParams.get("sd") || sdFromHost(req)).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    returnUrl: safeReturn(url.searchParams.get("returnUrl"), silent ? "/" : "/my"),
    target: !silent && url.searchParams.get("target") === "admin" ? "admin" : "site",
    at: Date.now()
  };
  if (silent) {
    flow.silent = true;
    const host = new URL(origin).host;
    // Nothing to check with: back to the page as a guest, and not again for a while.
    if (!memberSignInEnabled() || !MBID_CLIENT_SECRET) {
      const back = NextResponse.redirect(origin + flow.returnUrl, 302);
      setChecked(back, host);
      return back;
    }
    // Someone is signing in in another tab right now: do not replace their flow.
    const pending = readFlow(req);
    if (pending && !pending.silent && pending.at && Date.now() - pending.at < INTERACTIVE_FLOW_GRACE_MS) {
      return NextResponse.redirect(origin + flow.returnUrl, 302);
    }
  }
  // With member sign-in off only staff sign in here (on their way to B1Admin).
  if (flow.target !== "admin" && !memberSignInEnabled()) return NextResponse.redirect(origin + "/", 302);

  const auth = new URL(MBID_ISSUER + "/protocol/openid-connect/auth");
  auth.searchParams.set("client_id", MBID_CLIENT_ID);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("redirect_uri", origin + "/api/auth/mbid/callback");
  auth.searchParams.set("state", flow.state);
  auth.searchParams.set("nonce", flow.nonce);
  auth.searchParams.set("code_challenge", pkceChallenge(flow.verifier));
  auth.searchParams.set("code_challenge_method", "S256");
  if (silent) auth.searchParams.set("prompt", "none");
  else if (url.searchParams.get("idp") === "google") auth.searchParams.set("kc_idp_hint", "google");

  const res = NextResponse.redirect(auth.toString(), 302);
  if (silent) res.headers.set("Cache-Control", "no-store");
  res.cookies.set(FLOW_COOKIE, Buffer.from(JSON.stringify(flow)).toString("base64url"), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/mbid",
    maxAge: 20 * 60
  });
  return res;
}
