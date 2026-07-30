"use client";

// Contact Us form (Phase 20, Plan 07, FRM-02). A THIN wrapper over PublicFormBase with its
// OWN label / CTA / thank-you copy — a SEPARATE form from Prayer Request (LOCKED: two
// distinct forms, not one combined). churchId + campusId come from the campus page (the
// message is tagged to THIS campus). submissionType="contact" distinguishes it in the
// admin inbox.

import React from "react";
import { PublicFormBase } from "./PublicFormBase";

interface Props {
  churchId: string;
  campusId: string;
}

export const ContactForm: React.FC<Props> = ({ churchId, campusId }) => (
  <PublicFormBase
    churchId={churchId}
    campusId={campusId}
    submissionType="contact"
    title="Contact Us"
    intro="Questions about service times, getting involved, or planning your first visit? Send us a note and we'll get back to you."
    cta="Send message"
    thankYouTitle="Message received"
    thankYouCopy="Thanks for reaching out! Someone from our team will get back to you soon. We look forward to connecting with you."
  />
);
