"use client";

// Extra email addresses on the member's Mary Banks ID. A person may have given the
// church office one address and signed up with another; proving each address with a
// six-digit code lets their older church, store and giving records find them, without
// anyone being able to claim an address they don't own.

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { track } from "@/lib/analytics";

interface Props {
  primary: string;
  verified: string[];
  onChanged: () => void;
}

const errorText = (raw: string): string => {
  if (/already_yours/.test(raw)) return "That email is already on your account.";
  if (/other_account/.test(raw)) return "That email already belongs to another Mary Banks ID. If both are yours, sign in to the other one and contact us to merge them.";
  if (/wrong_code/.test(raw)) return "That code isn't right. Check the email and try again.";
  if (/expired|410/.test(raw)) return "That code has expired. Send a new one.";
  if (/429|too many/i.test(raw)) return "Too many tries. Please wait a little and try again.";
  return "Something went wrong. Please try again.";
};

export const EmailsCard: React.FC<Props> = ({ primary, verified, onChanged }) => {
  const [step, setStep] = React.useState<"list" | "enter" | "code">("list");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg({ kind: "err", text: "Please enter a full email address." }); return; }
    setBusy(true); setMsg(null);
    try {
      await ApiHelper.post("/me/emails/start", { email: email.trim() }, "MembershipApi");
      setStep("code");
      setMsg({ kind: "ok", text: "We sent a six-digit code to " + email.trim() + ". It works for 30 minutes." });
    } catch (err: any) {
      setMsg({ kind: "err", text: errorText(String(err?.message || err)) });
    } finally { setBusy(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await ApiHelper.post("/me/emails/verify", { email: email.trim(), code: code.trim() }, "MembershipApi");
      setMsg({ kind: "ok", text: email.trim() + " is now on your account." });
      setStep("list"); setEmail(""); setCode("");
      track("profile_updated", { section: "emails", action: "email_added" });
      onChanged();
    } catch (err: any) {
      setMsg({ kind: "err", text: errorText(String(err?.message || err)) });
    } finally { setBusy(false); }
  };

  const remove = async (addr: string) => {
    setBusy(true); setMsg(null);
    try {
      await ApiHelper.delete("/me/emails/" + encodeURIComponent(addr), "MembershipApi");
      track("profile_updated", { section: "emails", action: "email_removed" });
      onChanged();
    } catch (err: any) {
      setMsg({ kind: "err", text: errorText(String(err?.message || err)) });
    } finally { setBusy(false); }
  };

  return (
    <section className="bt-my-card" aria-labelledby="my-emails">
      <div className="bt-eyebrow">Email addresses</div>
      <h2 id="my-emails" className="bt-h3">My emails</h2>
      <p className="bt-my-empty">Used an older email with the church office or the library store? Add it here, so those records find you. We send a code to prove it&rsquo;s yours.</p>
      <ul className="bt-my-list">
        <li><span>{primary}</span><span className="bt-my-empty">Sign-in email</span></li>
        {verified.map((v) => (
          <li key={v}>
            <span>{v}</span>
            <button type="button" onClick={() => remove(v)} disabled={busy} style={{ background: "none", border: 0, color: "var(--bt-gold-deep)", fontWeight: 600, cursor: "pointer", font: "inherit" }}>Remove</button>
          </li>
        ))}
      </ul>

      {step === "list" && (
        <div><button type="button" className="bt-btn bt-btn-sm bt-btn-outline" onClick={() => { setStep("enter"); setMsg(null); }}>Add another email</button></div>
      )}
      {step === "enter" && (
        <form onSubmit={start} style={{ display: "grid", gap: 10 }}>
          <label htmlFor="me-new-email" style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--bt-ink)" }}>Email address to add</label>
          <input id="me-new-email" type="email" className="bt-field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="bt-btn bt-btn-sm" disabled={busy}>{busy ? "Sending..." : "Send code"}</button>
            <button type="button" className="bt-btn bt-btn-sm bt-btn-outline" onClick={() => { setStep("list"); setMsg(null); }}>Cancel</button>
          </div>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={verify} style={{ display: "grid", gap: 10 }}>
          <label htmlFor="me-code" style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--bt-ink)" }}>Six-digit code</label>
          <input id="me-code" className="bt-field" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={{ letterSpacing: "0.3em", fontSize: 20 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" className="bt-btn bt-btn-sm" disabled={busy || code.length !== 6}>{busy ? "Checking..." : "Confirm"}</button>
            <button type="button" className="bt-btn bt-btn-sm bt-btn-outline" onClick={(e) => start(e as any)} disabled={busy}>Send a new code</button>
          </div>
        </form>
      )}
      {msg && <p role={msg.kind === "err" ? "alert" : "status"} style={{ color: msg.kind === "err" ? "var(--bt-live)" : "var(--bt-body)", fontSize: "0.93rem" }}>{msg.text}</p>}
    </section>
  );
};
