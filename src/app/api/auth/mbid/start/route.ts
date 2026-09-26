// Start a Mary Banks ID sign-in. Query: returnUrl (a path on this site, default /my),
// target=admin to continue into B1Admin afterwards, idp=google to go straight to
// Google, sd=<church subdomain> (defaults from the host).

import { NextResponse } from "next/server";
import { FLOW_COOKIE, MBID_CLIENT_ID, MBID_ISSUER, pkceChallenge, publicOrigin, randomToken, safeReturn, sdFromHost, type MbidFlow } from "@/lib/mbid";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const flow: MbidFlow = {
    state: randomToken(24),
    verifier: randomToken(48),
    nonce: randomToken(24),
    sd: (url.searchParams.get("sd") || sdFromHost(req)).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    returnUrl: safeReturn(url.searchParams.get("returnUrl")),
    target: url.searchParams.get("target") === "admin" ? "admin" : "site"
  };

  const auth = new URL(MBID_ISSUER + "/protocol/openid-connect/auth");
  auth.searchParams.set("client_id", MBID_CLIENT_ID);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("redirect_uri", origin + "/api/auth/mbid/callback");
  auth.searchParams.set("state", flow.state);
  auth.searchParams.set("nonce", flow.nonce);
  auth.searchParams.set("code_challenge", pkceChallenge(flow.verifier));
  auth.searchParams.set("code_challenge_method", "S256");
  if (url.searchParams.get("idp") === "google") auth.searchParams.set("kc_idp_hint", "google");

  const res = NextResponse.redirect(auth.toString(), 302);
  res.cookies.set(FLOW_COOKIE, Buffer.from(JSON.stringify(flow)).toString("base64url"), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/mbid",
    maxAge: 20 * 60
  });
  return res;
}
