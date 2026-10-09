"use client";

// My details: the member's own church record (name, center, phone, address), their
// household, and the email addresses on their Mary Banks ID.

import React from "react";
import type { LocatorCampus } from "../LeafletLocatorMap";
import { useMyChurch } from "./useMyChurch";
import { MyFrame } from "./MyUi";
import { ProfileCard } from "./ProfileCard";
import { EmailsCard } from "./EmailsCard";
import { SignedOutCard } from "./SignedOutCard";

// Shared Mary Banks ID deletion page (explains what is erased on every site, confirms on
// Mary Banks ID, then returns here).
const DELETE_ID_URL = "https://ecosystem.mbmonline.global/account/delete/";

function deleteIdHref(): string {
  if (typeof window === "undefined") return DELETE_ID_URL;
  const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  return `${DELETE_ID_URL}?return=${encodeURIComponent(window.location.href)}&lang=${encodeURIComponent(lang)}`;
}

export const MyProfile: React.FC<{ subDomain: string; centers: LocatorCampus[] }> = ({ subDomain, centers }) => {
  const { session, me, loaded, reload } = useMyChurch(subDomain);
  if (session.status === "signed-out" || session.status === "error") return <SignedOutCard returnUrl="/my/profile" />;
  const center = centers.find((c) => c.id === me?.person?.campusId);
  return (
    <MyFrame centerSlug={center?.slug}>
      <div>
        <h1 className="my-serif" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)", fontWeight: 400 }}>My details</h1>
        <p style={{ marginTop: 8, color: "var(--bt-body)" }}>Your church record, your household, and the email addresses on your Mary Banks ID.</p>
      </div>
      {!loaded ? <div className="my-card" style={{ minHeight: 240 }} aria-busy="true" /> : (
        <div className="my-grid-2">
          <ProfileCard person={me?.person || null} household={me?.household || []} centers={centers} onSaved={reload} />
          <EmailsCard primary={session.status === "ready" ? session.email : ""} verified={me?.verifiedEmails || []} onChanged={reload} />
        </div>
      )}
      <p style={{ marginTop: 8, fontSize: "0.9rem", color: "var(--bt-body)" }}>
        <a
          href={DELETE_ID_URL}
          onClick={(e) => { e.preventDefault(); window.location.href = deleteIdHref(); }}
          style={{ color: "#b91c1c", fontWeight: 600, textDecoration: "underline" }}
        >
          Delete my Mary Banks ID
        </a>
        {" "}Permanently erases your Mary Banks ID and your account on every Mary Banks site.
      </p>
    </MyFrame>
  );
};
