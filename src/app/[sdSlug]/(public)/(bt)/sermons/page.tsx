// /sermons moved to /watch in the 2026-09 redesign (live + on demand together).
// Kept as a permanent redirect so old links, shares and search results still land.

import { permanentRedirect } from "next/navigation";

export default function SermonsRedirect() {
  permanentRedirect("/watch");
}
