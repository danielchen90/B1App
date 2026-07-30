"use client";

// Prayer Request form (Phase 20, Plan 07, FRM-01). A THIN wrapper over PublicFormBase with
// its OWN label / CTA / thank-you copy — a SEPARATE form from Contact Us (LOCKED: two
// distinct forms, not one combined). churchId + campusId come from the campus page (the
// submission is tagged to THIS campus). submissionType="prayer" distinguishes it in the
// admin inbox.

import React from "react";
import { PublicFormBase } from "./PublicFormBase";

interface Props {
  churchId: string;
  campusId: string;
}

export const PrayerForm: React.FC<Props> = ({ churchId, campusId }) => (
  <PublicFormBase
    churchId={churchId}
    campusId={campusId}
    submissionType="prayer"
    title="Prayer Request"
    intro="However you're doing today, our team would be honored to pray with you. Share what's on your heart."
    cta="Submit prayer request"
    thankYouTitle="We're praying with you"
    thankYouCopy="Thank you for sharing. Our prayer team has received your request and is lifting it up. You are not alone."
  />
);
