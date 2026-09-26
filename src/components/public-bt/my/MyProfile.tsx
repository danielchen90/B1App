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
    </MyFrame>
  );
};
