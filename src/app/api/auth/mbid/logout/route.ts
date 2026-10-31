// Sign out everywhere: clear the church session cookies, then end the Mary Banks ID
// session and come back to the home page.

import { NextResponse } from "next/server";
import { MBID_CLIENT_ID, MBID_ISSUER, publicOrigin } from "@/lib/mbid";
import { CHECKED_MAX_AGE_SIGNED_OUT, MEMBER_PICTURE_COOKIE, clearSignedInHint, setChecked } from "@/lib/mbidSso";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const hint = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith("mbid_hint="))?.slice("mbid_hint=".length);
  const end = new URL(MBID_ISSUER + "/protocol/openid-connect/logout");
  end.searchParams.set("client_id", MBID_CLIENT_ID);
  end.searchParams.set("post_logout_redirect_uri", origin + "/");
  if (hint) end.searchParams.set("id_token_hint", hint);
  const res = NextResponse.redirect(end.toString(), 302);
  for (const name of ["jwt", "name", "email", "lastChurchId", "bt_member", "bt_mbid", MEMBER_PICTURE_COOKIE]) res.cookies.set(name, "", { path: "/", maxAge: 0 });
  res.cookies.set("mbid_hint", "", { path: "/api/auth/mbid", maxAge: 0 });
  // Signed out on purpose: the other marybanks.net sites stop assuming a sign-in, and
  // this site does not quietly check again for a month.
  const host = new URL(origin).host;
  clearSignedInHint(res, host);
  setChecked(res, host, CHECKED_MAX_AGE_SIGNED_OUT);
  return res;
}
