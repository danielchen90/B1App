// Anonymous public API read through Next's data cache, so busy public pages (events,
// the campus list) do not hit the API on every request. `seconds` is how long a copy
// may be served before it is fetched again. Throws on a non-OK response like ApiHelper.

import { ApiHelper } from "@churchapps/apphelper";

export async function getAnonymousCached(path: string, apiName: string, seconds: number): Promise<unknown> {
  const base = ApiHelper.getConfig(apiName)?.url;
  if (!base) return ApiHelper.getAnonymous(path, apiName as any);
  const res = await fetch(base + path, { next: { revalidate: seconds } } as RequestInit);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
