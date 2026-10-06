"use client";

// Restores the member's ChurchApps session from the `jwt` cookie (set when a Mary
// Banks ID sign-in finished) for My Church. Unlike the mobile screens' hydrate, it
// never calls /people/claim: record linking is the member's explicit "Is this you?"
// choice, so no duplicate person is ever created behind their back.

import React from "react";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "ready"; firstName: string; lastName: string; email: string; churchId: string }
  | { status: "error" };

const readCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
};

export const clearSessionCookies = () => {
  for (const n of ["jwt", "name", "email", "lastChurchId", "bt_member", "bt_mbid"]) document.cookie = n + "=; path=/; max-age=0; samesite=lax";
};

export const useMemberSession = (subDomain: string): SessionState => {
  const [state, setState] = React.useState<SessionState>({ status: "loading" });

  React.useEffect(() => {
    const jwt = readCookie("jwt");
    if (!jwt) { setState({ status: "signed-out" }); return; }
    let active = true;
    (async () => {
      try {
        const resp: any = await ApiHelper.postAnonymous("/users/login", { jwt }, "MembershipApi");
        if (!resp?.user?.jwt) throw new Error("no session");
        ApiHelper.setDefaultPermissions(resp.user.jwt);
        (resp.userChurches || []).forEach((uc: any) => { if (!uc.apis) uc.apis = []; });
        UserHelper.user = resp.user;
        UserHelper.userChurches = resp.userChurches || [];
        let uc = UserHelper.userChurches.find((c: any) => c.church?.subDomain?.toLowerCase() === subDomain.toLowerCase());
        if (!uc) {
          uc = await ApiHelper.post("/churches/select", { subDomain }, "MembershipApi");
          if (uc && !uc.apis) uc.apis = [];
        }
        if (!uc) throw new Error("no church");
        UserHelper.currentUserChurch = uc;
        UserHelper.setupApiHelper(uc);
        if (active) setState({ status: "ready", firstName: resp.user.firstName || "", lastName: resp.user.lastName || "", email: resp.user.email || "", churchId: uc.church?.id || "" });
      } catch (err: any) {
        if (!active) return;
        // An expired or revoked token: forget it and offer sign-in again.
        if (/401|403|unauthor/i.test(String(err?.message || err))) { clearSessionCookies(); setState({ status: "signed-out" }); }
        else setState({ status: "error" });
      }
    })();
    return () => { active = false; };
  }, [subDomain]);

  return state;
};

/** GET that resolves to null instead of throwing (older API, missing module, no data). */
export const tryGet = async <T,>(path: string, api: Parameters<typeof ApiHelper.get>[1]): Promise<T | null> => {
  try { return (await ApiHelper.get(path, api)) as T; } catch { return null; }
};
