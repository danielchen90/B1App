"use client";

// "Make this my center" on a center page. Remembers the choice in this browser (the
// same memory the home page reads), and shows a quiet confirmation once chosen.

import React from "react";
import { saveCenter, useSavedCenter } from "./MyCenter";
import { track } from "@/lib/analytics";

export const MakeMyCenter: React.FC<{ slug: string; name: string }> = ({ slug, name }) => {
  const [saved, ready] = useSavedCenter();
  if (!ready) return null;
  if (saved === slug) {
    return <span className="bt-chip" style={{ cursor: "default" }}>&#10003; Your center</span>;
  }
  return (
    <button type="button" className="bt-btn bt-btn-outline" onClick={() => { saveCenter(slug); track("center_chosen", { church_slug: slug, church_name: name, method: "center_page" }); }} aria-label={"Make " + name + " my center"}>
      Make this my center
    </button>
  );
};
