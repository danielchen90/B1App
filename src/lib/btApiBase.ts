// The ChurchApps API base in the browser, read from what the root layout writes on every
// page (window.__API_BASE__), without loading the ChurchApps helper packages. For small
// public widgets (This week, the live badge) that only make one anonymous GET.

export const browserApiBase = (): string => {
  if (typeof window === "undefined") return "";
  return String((window as unknown as { __API_BASE__?: string }).__API_BASE__ || "").replace(/\/+$/, "");
};

/** The content API ("<base>/content"), or "" when the page carries no API base. */
export const browserContentApi = (): string => {
  const base = browserApiBase();
  return base ? base + "/content" : "";
};
