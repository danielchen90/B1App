"use client";

// Login-free public form base (Phase 20, Plan 07, FRM-01/02/04).
//
// The SHARED engine behind BOTH the Prayer Request and the Contact Us forms — two
// SEPARATE forms (PrayerForm / ContactForm are thin wrappers), never one combined form
// (LOCKED decision). A visitor submits with NO login: minimal fields (name, email,
// message required; phone OPTIONAL) + a HIDDEN honeypot the human never sees.
//
// SPAM DEFENSE (FRM-04): the hidden `website` field is the honeypot. A human never fills
// it (it is visually removed off-screen + aria-hidden + tabIndex=-1 + autoComplete off);
// a naive bot that fills it is silently dropped SERVER-SIDE (20-03 returns a success shape
// and stores nothing) — the UI simply shows the same thank-you, so a bot learns nothing.
// Burst submits are rate-limited server-side → 429, handled here with a soft retry note.
//
// SUBMIT TARGET (20-03): POST /public/:churchId/:campusId/submit on "MembershipApi".
// NOTE the MembershipApi base already ends in "/membership", so the client path is
// "/public/..." NOT "/membership/public/..." (a re-prefix would double the segment → 404;
// see the 20-04/20-05 path deviations). churchId + campusId come from the campus-page
// props (trusted route context), never user input.
//
// THANK-YOU (LOCKED): on success the form is replaced IN PLACE with an inline thank-you +
// a gentle next step (plan a visit / service times / social). There is NO navigation and
// NO page change — the visitor stays exactly where they are.
//
// Styling uses the scoped `--bt-*` design vars (this renders inside `.bt-root`).

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";

export interface PublicFormBaseProps {
  churchId: string;
  campusId: string;
  submissionType: "prayer" | "contact";
  title: string;
  intro?: string;
  cta: string;
  thankYouTitle: string;
  thankYouCopy: string;
}

type Status = "idle" | "submitting" | "done" | "error" | "rate-limited";

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: "1rem",
  fontFamily: "inherit",
  color: "var(--bt-ink)",
  background: "var(--bt-surface)",
  border: "1px solid var(--bt-line)",
  borderRadius: 8,
  boxSizing: "border-box"
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--bt-muted)",
  marginBottom: 6
};

// Off-screen honeypot: never visible, never tab-reachable, never announced to a11y tech —
// so a HUMAN never fills it, but a naive form-filling bot does (server silently drops it).
const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "-9999px",
  top: "auto",
  width: 1,
  height: 1,
  overflow: "hidden"
};

export const PublicFormBase: React.FC<PublicFormBaseProps> = ({
  churchId,
  campusId,
  submissionType,
  title,
  intro,
  cta,
  thankYouTitle,
  thankYouCopy
}) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [website, setWebsite] = React.useState(""); // HONEYPOT — humans leave this empty.
  const [status, setStatus] = React.useState<Status>("idle");

  const submitting = status === "submitting";
  const idPrefix = submissionType; // unique field ids per form so both can co-exist on a page.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      // Anonymous submit to the 20-03 guarded endpoint. website=honeypot travels along so
      // the server can silently drop a bot; churchId/campusId are trusted route context.
      await ApiHelper.postAnonymous(
        "/public/" + churchId + "/" + campusId + "/submit",
        { submissionType, name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, message: message.trim(), website },
        "MembershipApi"
      );
      // Success (or a silently-dropped honeypot bot — indistinguishable by design): thank-you.
      setStatus("done");
    } catch (err: any) {
      // ApiHelper throws on non-2xx and serializes the body; a 429 = rate limited.
      const raw = (err?.message || "").toString();
      setStatus(/429|too many/i.test(raw) ? "rate-limited" : "error");
    }
  };

  // Inline IN-PLACE thank-you (no navigation) — replaces the form on success (LOCKED).
  if (status === "done") {
    return (
      <div
        style={{
          background: "var(--bt-surface)",
          border: "1px solid var(--bt-line)",
          borderRadius: 12,
          padding: "28px 24px"
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "1.4rem" }}>{thankYouTitle}</h3>
        <p style={{ color: "var(--bt-muted)", marginBottom: 18, lineHeight: 1.6 }}>{thankYouCopy}</p>
        {/* Gentle next step — plan a visit / service times / social, in place, no page change. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a className="bt-btn bt-btn-outline" href="#visit">
            Plan your visit
          </a>
          <a className="bt-btn bt-btn-outline" href="#give">
            Ways to connect
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--bt-surface)",
        border: "1px solid var(--bt-line)",
        borderRadius: 12,
        padding: "28px 24px"
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: intro ? 6 : 18, fontSize: "1.4rem" }}>{title}</h3>
      {intro && <p style={{ color: "var(--bt-muted)", marginTop: 0, marginBottom: 18, lineHeight: 1.6 }}>{intro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={LABEL_STYLE} htmlFor={idPrefix + "-name"}>
            Name
          </label>
          <input
            id={idPrefix + "-name"}
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            style={FIELD_STYLE}
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE} htmlFor={idPrefix + "-email"}>
            Email
          </label>
          <input
            id={idPrefix + "-email"}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={FIELD_STYLE}
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE} htmlFor={idPrefix + "-phone"}>
            Phone <span style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id={idPrefix + "-phone"}
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            style={FIELD_STYLE}
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE} htmlFor={idPrefix + "-message"}>
            Message
          </label>
          <textarea
            id={idPrefix + "-message"}
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            style={{ ...FIELD_STYLE, resize: "vertical" }}
            disabled={submitting}
          />
        </div>

        {/* HONEYPOT — hidden from humans (off-screen, aria-hidden, not tab-reachable). A bot
            that fills `website` is silently dropped server-side (20-03). Never remove. */}
        <div style={HONEYPOT_STYLE} aria-hidden="true">
          <label htmlFor={idPrefix + "-website"}>Website</label>
          <input
            id={idPrefix + "-website"}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {status === "error" && (
          <p style={{ color: "#b00020", margin: 0, fontSize: "0.9rem" }}>
            Please fill in your name, email, and message, then try again.
          </p>
        )}
        {status === "rate-limited" && (
          <p style={{ color: "#b00020", margin: 0, fontSize: "0.9rem" }}>
            Thanks for your enthusiasm! Please wait a moment and try again shortly.
          </p>
        )}

        <div>
          <button type="submit" className="bt-btn" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Sending…" : cta}
          </button>
        </div>
      </div>
    </form>
  );
};
