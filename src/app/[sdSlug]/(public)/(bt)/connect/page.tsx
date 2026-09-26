// /connect moved to /next-steps in the 2026-09 redesign (prayer, contact, plan a visit
// and every other next step on one page). Kept as a permanent redirect for old links.

import { permanentRedirect } from "next/navigation";

export default function ConnectRedirect() {
  permanentRedirect("/next-steps");
}
