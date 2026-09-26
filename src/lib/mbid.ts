// Mary Banks ID (Keycloak, realm "marybanks") sign-in for the church site.
//
// Flow: /api/auth/mbid/start sends the person to Mary Banks ID (Google first, then
// email link or password), /api/auth/mbid/callback exchanges the code on the server
// with the huro-app secret, hands the ID token to the church API
// (POST /membership/users/mbidLogin), which verifies it and returns a short-lived
// ChurchApps login token. The existing ChurchApps login page then finishes the
// sign-in with that token (/login?jwt=...), exactly as it does for its own app
// switching, and sets the usual session cookies. Admins are handed off to B1Admin
// the same way.
//
// The flow state (state, PKCE verifier, nonce, where to go after) lives in one
// short-lived httpOnly cookie scoped to /api/auth/mbid.

import crypto from "node:crypto";

export const MBID_ISSUER = (process.env.MBID_ISSUER || "https://id.mbmonline.global/realms/marybanks").replace(/\/+$/, "");
export const MBID_CLIENT_ID = process.env.MBID_CLIENT_ID || "huro-app";
export const MBID_CLIENT_SECRET = process.env.MBID_CLIENT_SECRET || "";
export const ADMIN_URL = (process.env.B1ADMIN_URL || "https://admin.huro.church").replace(/\/+$/, "");
export const FLOW_COOKIE = "mbid_flow";

export interface MbidFlow {
  state: string;
  verifier: string;
  nonce: string;
  sd: string;
  returnUrl: string;
  target: "site" | "admin";
}

export const b64url = (buf: Buffer): string => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const randomToken = (bytes = 32): string => b64url(crypto.randomBytes(bytes));
export const pkceChallenge = (verifier: string): string => b64url(crypto.createHash("sha256").update(verifier).digest());

/** The public origin of this request (Railway/Caddy put the real host in x-forwarded-*). */
export const publicOrigin = (req: Request): string => {
  const h = req.headers;
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim() || (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return proto + "://" + host;
};

/** Only same-site paths are allowed as a return address (never an open redirect). */
export const safeReturn = (value: string | null | undefined, fallback = "/my"): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
};

/** The church subdomain for this host, used when the start link didn't say. */
export const sdFromHost = (req: Request): string => {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().split(":")[0];
  if (host.endsWith(".huro.church") || host.endsWith(".localhost")) return host.split(".")[0];
  return process.env.DEFAULT_CHURCH_SLUG || "bti";
};

export const apiBase = (): string => (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
