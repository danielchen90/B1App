"use client";

// "Choose a worship center" on the Watch page: every center with its own YouTube
// channel, straight to that center's Watch page (/watch/[slug]).

import React from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export interface PickerCenter { slug: string; name: string }

export const WatchCenterPicker: React.FC<{ centers: PickerCenter[] }> = ({ centers }) => {
  const router = useRouter();
  if (centers.length === 0) return null;
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 240, maxWidth: 360, width: "100%" }}>
      <span className="bt-eyebrow">Watch a worship center</span>
      <select
        className="bt-field"
        defaultValue=""
        onChange={(e) => {
          const slug = e.target.value;
          if (!slug) return;
          track("watch_center_chosen", { church_slug: slug, placement: "watch_page" });
          router.push("/watch/" + encodeURIComponent(slug));
        }}
      >
        <option value="" disabled>Choose a worship center</option>
        {centers.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
    </label>
  );
};
