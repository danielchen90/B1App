"use client";

// One login-free form for every next step (plan a visit, prayer, follow Jesus, baptism,
// discipleship class, serve). The visitor picks their worship center (preselected from
// ?center= or the remembered center), and the submission lands in THAT center's admin
// inbox, labelled by type. Same anonymous endpoint, honeypot and rate limit as the
// original prayer/contact forms (POST /membership/public/:churchId/:campusId/submit).
//
// "Plan a visit" also sends the date and how many are coming, so the center can look
// out for the family.

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { readSavedCenter } from "../MyCenter";

export type NextStepType = "visit" | "prayer" | "salvation" | "baptism" | "discipleship" | "serve" | "contact";

export interface CenterOption { id: string; slug: string | null; name: string; virtual?: boolean }

interface Props {
  churchId: string;
  centers: CenterOption[];
  type: NextStepType;
  cta: string;
  /** Placeholder for the message box; the box is optional unless `messageRequired`. */
  messageLabel?: string;
  messageRequired?: boolean;
  /** Sent as the message when the visitor leaves the box empty. */
  defaultMessage: string;
  thankYouTitle: string;
  thankYouCopy: string;
  /** Start as a single button that opens the form (keeps a page of many steps short). */
  collapsed?: boolean;
}

type Status = "idle" | "submitting" | "done" | "error" | "rate-limited";

const LABEL: React.CSSProperties = { display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--bt-ink)", marginBottom: 6 };
const HONEYPOT: React.CSSProperties = { position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" };

const today = () => new Date().toISOString().slice(0, 10);

export const NextStepForm: React.FC<Props> = ({
  churchId, centers, type, cta, messageLabel = "Anything you'd like us to know (optional)", messageRequired = false,
  defaultMessage, thankYouTitle, thankYouCopy, collapsed = false
}) => {
  const [open, setOpen] = React.useState(!collapsed);
  const [centerId, setCenterId] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [visitDate, setVisitDate] = React.useState("");
  const [partySize, setPartySize] = React.useState("1");
  const [website, setWebsite] = React.useState(""); // honeypot: humans leave it empty
  const [status, setStatus] = React.useState<Status>("idle");

  // Preselect: ?center=<slug> wins, then the remembered center, then (for prayer) the Online Church.
  React.useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("center");
    const slug = fromQuery || readSavedCenter();
    const hit = (centers.length === 1 ? centers[0] : undefined) || centers.find((c) => c.slug === slug) ||
      (type === "prayer" || type === "salvation" ? centers.find((c) => c.virtual) : undefined);
    if (hit) setCenterId(hit.id);
  }, [centers, type]);

  const id = (f: string) => "ns-" + type + "-" + f;
  const submitting = status === "submitting";
  const physicalOnly = type === "visit" || type === "baptism";
  const options = physicalOnly ? centers.filter((c) => !c.virtual) : centers;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!centerId || !name.trim() || !email.trim() || (messageRequired && !message.trim())) { setStatus("error"); return; }
    setStatus("submitting");
    try {
      const body: Record<string, unknown> = {
        submissionType: type,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || defaultMessage,
        website
      };
      if (type === "visit") {
        if (visitDate) body.visitDate = visitDate;
        body.partySize = Math.min(20, Math.max(1, parseInt(partySize, 10) || 1));
        if (message.trim()) body.notes = message.trim();
      }
      await ApiHelper.postAnonymous("/public/" + churchId + "/" + centerId + "/submit", body, "MembershipApi");
      setStatus("done");
    } catch (err: any) {
      setStatus(/429|too many/i.test((err?.message || "").toString()) ? "rate-limited" : "error");
    }
  };

  // Opened from a link straight to this step (#baptism etc.): show the form at once.
  React.useEffect(() => {
    if (collapsed && window.location.hash === "#" + type) setOpen(true);
  }, [collapsed, type]);

  if (!open) {
    return (
      <div className="bt-card" style={{ padding: 22 }}>
        <button type="button" className="bt-btn" onClick={() => setOpen(true)} aria-expanded={false} aria-controls={id("form")}>{cta}</button>
      </div>
    );
  }

  if (status === "done") {
    const center = centers.find((c) => c.id === centerId);
    return (
      <div className="bt-card" style={{ padding: "24px 22px" }} role="status">
        <h3 className="bt-h3">{thankYouTitle}</h3>
        <p style={{ marginTop: 8 }}>{thankYouCopy}{center ? " The " + center.name + " team has your message." : ""}</p>
      </div>
    );
  }

  return (
    <form id={id("form")} onSubmit={submit} className="bt-card" style={{ padding: "22px", display: "grid", gap: 14, position: "relative" }} noValidate>
      <div hidden={centers.length === 1}>
        <label style={LABEL} htmlFor={id("center")}>{type === "visit" ? "Which center will you visit?" : "Your worship center"}</label>
        <select id={id("center")} className="bt-field" value={centerId} onChange={(e) => setCenterId(e.target.value)} required disabled={submitting}>
          <option value="">Choose a center</option>
          {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {type === "visit" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <div>
            <label style={LABEL} htmlFor={id("date")}>When are you coming? <span style={{ fontWeight: 400, color: "var(--bt-muted)" }}>(optional)</span></label>
            <input id={id("date")} type="date" className="bt-field" min={today()} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} disabled={submitting} />
          </div>
          <div>
            <label style={LABEL} htmlFor={id("party")}>How many of you?</label>
            <select id={id("party")} className="bt-field" value={partySize} onChange={(e) => setPartySize(e.target.value)} disabled={submitting}>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div>
          <label style={LABEL} htmlFor={id("name")}>Your name</label>
          <input id={id("name")} className="bt-field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
        </div>
        <div>
          <label style={LABEL} htmlFor={id("email")}>Email</label>
          <input id={id("email")} type="email" className="bt-field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
        </div>
      </div>
      <div>
        <label style={LABEL} htmlFor={id("phone")}>Phone <span style={{ fontWeight: 400, color: "var(--bt-muted)" }}>(optional)</span></label>
        <input id={id("phone")} type="tel" className="bt-field" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
      </div>
      <div>
        <label style={LABEL} htmlFor={id("message")}>{messageLabel}</label>
        <textarea id={id("message")} className="bt-field" rows={type === "prayer" ? 5 : 3} value={message} onChange={(e) => setMessage(e.target.value)} disabled={submitting} />
      </div>

      <div aria-hidden style={HONEYPOT}>
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {status === "error" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>Please choose a center and fill in your name and email{messageRequired ? " and your request" : ""}, then try again.</p>}
      {status === "rate-limited" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>We've received several messages from you just now. Please wait a few minutes and send it again.</p>}

      <div><button type="submit" className="bt-btn" disabled={submitting}>{submitting ? "Sending..." : cta}</button></div>
    </form>
  );
};
