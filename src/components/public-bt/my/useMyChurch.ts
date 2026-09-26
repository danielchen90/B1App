"use client";

// Everything My Church shows, loaded once per page: the session (from the jwt cookie),
// the member's overview, and each module's own data. Every read degrades to empty,
// so a module a center hasn't set up never breaks the page.

import React from "react";
import { useMemberSession, tryGet, type SessionState } from "./useMemberSession";
import type { MeOverview } from "./MyChurch";

export interface MyChurchData {
  session: SessionState;
  me: MeOverview | null | undefined;
  groups: any[];
  serving: any[];
  gifts: any[];
  recurring: any[];
  requests: any[];
  loaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Serving assignments only carry a position id; the position names the role and its
 * plan (the service), and the plan carries the date. Same lookups the member screens use.
 */
const enrichServing = async (assignments: any[]): Promise<any[]> => {
  if (assignments.length === 0) return [];
  const posIds = [...new Set(assignments.map((a) => a.positionId).filter(Boolean))];
  const positions = posIds.length ? (await tryGet<any[]>("/positions/ids?ids=" + posIds.join(","), "DoingApi")) || [] : [];
  const planIds = [...new Set(positions.map((p) => p.planId).filter(Boolean))];
  const plans = planIds.length ? (await tryGet<any[]>("/plans/ids?ids=" + planIds.join(","), "DoingApi")) || [] : [];
  return assignments.map((a) => {
    const position = positions.find((p) => p.id === a.positionId);
    const plan = plans.find((p) => p.id === position?.planId);
    return { ...a, positionName: position?.name, planName: plan?.name, serviceDate: plan?.serviceDate };
  }).sort((x, y) => new Date(x.serviceDate || 0).getTime() - new Date(y.serviceDate || 0).getTime());
};

export const useMyChurch = (subDomain: string): MyChurchData => {
  const session = useMemberSession(subDomain);
  const [me, setMe] = React.useState<MeOverview | null | undefined>(undefined);
  const [groups, setGroups] = React.useState<any[]>([]);
  const [serving, setServing] = React.useState<any[]>([]);
  const [gifts, setGifts] = React.useState<any[]>([]);
  const [recurring, setRecurring] = React.useState<any[]>([]);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const reload = React.useCallback(async () => {
    const [overview, g, s, d, r, q] = await Promise.all([
      tryGet<MeOverview>("/me/overview", "MembershipApi"),
      tryGet<any[]>("/groups/my", "MembershipApi"),
      tryGet<any[]>("/assignments/my", "DoingApi"),
      tryGet<any[]>("/donations/my", "GivingApi"),
      tryGet<any[]>("/subscriptions/my", "GivingApi"),
      tryGet<any[]>("/me/submissions", "MembershipApi")
    ]);
    setMe(overview);
    setGroups(Array.isArray(g) ? g : []);
    setServing(await enrichServing(Array.isArray(s) ? s : []));
    setGifts(Array.isArray(d) ? d : []);
    setRecurring(Array.isArray(r) ? r : []);
    setRequests(Array.isArray(q) ? q : []);
    setLoaded(true);
  }, []);

  React.useEffect(() => { if (session.status === "ready") reload(); }, [session.status, reload]);

  return { session, me, groups, serving, gifts, recurring, requests, loaded, reload };
};
