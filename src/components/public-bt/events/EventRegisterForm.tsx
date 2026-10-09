"use client";

// Registration for a CRM event (/e/<slug>). Asks what the ministry needs to serve people well:
// name, email, phone (WhatsApp), country and city, the language they prefer, their ministry role
// and church, how many they are bringing, permission to contact them about future events, plus
// the event's own questions. The time zone comes from the browser so every email shows the
// event in their local time. Same honeypot and rate limit as the site's other public forms.

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { track } from "@/lib/analytics";

export interface EventQuestion { id: string; label: string; type: "text" | "textarea" | "select" | "yesno"; options: string[]; required: boolean }

interface Props {
  slug: string;
  title: string;
  roles: string[];
  questions: EventQuestion[];
  languages: string | null;
}

const CODES = "AF AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR VG BN BG BF BI KH CM CA CV KY CF TD CL CN CO KM CD CG CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA KR SS ES LK KN LC VC SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV VI UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");
const LANGS = [
  "English", "French", "Spanish", "Portuguese", "Swahili", "Haitian Creole", "Urdu", "Hindi", "Hebrew", "Arabic", "Amharic", "Yoruba", "Igbo", "Hausa", "Twi", "Luganda", "Kinyarwanda", "Shona", "Zulu", "Tagalog", "Korean", "Chinese"
];

const LABEL: React.CSSProperties = { display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--bt-ink)", marginBottom: 6 };
const HINT: React.CSSProperties = { fontWeight: 400, color: "var(--bt-muted)" };
const HONEYPOT: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" };
const GRID: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };

type Status = "idle" | "submitting" | "done" | "error" | "rate-limited" | "full" | "closed";

export const EventRegisterForm: React.FC<Props> = ({ slug, title, roles, questions, languages }) => {
  const [f, setF] = React.useState<Record<string, string>>({ groupSize: "1" });
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [consent, setConsent] = React.useState(false);
  const [website, setWebsite] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [problem, setProblem] = React.useState("");
  const [joinUrl, setJoinUrl] = React.useState<string | null>(null);
  const [again, setAgain] = React.useState(false);

  // Built after mount: the server's and the browser's country names differ slightly, so the list
  // is never part of the server HTML (that would be a hydration mismatch).
  const [countries, setCountries] = React.useState<{ code: string; name: string }[]>([]);
  React.useEffect(() => {
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames([navigator.language || "en", "en"], { type: "region" }); } catch { /* old browser */ }
    setCountries(CODES.map((c) => ({ code: c, name: names?.of(c) || c })).sort((a, b) => a.name.localeCompare(b.name)));
  }, []);
  const offered = (languages || "").split(",").map((s) => s.trim()).filter(Boolean);
  const langOptions = [...new Set([...offered, ...LANGS])];

  // Best guesses from the browser: country from the locale, nothing else is assumed.
  React.useEffect(() => {
    const region = (navigator.language || "").split("-")[1];
    if (region && CODES.includes(region.toUpperCase())) setF((x) => ({ ...x, countryCode: x.countryCode || region.toUpperCase() }));
  }, []);

  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  const submitting = status === "submitting";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const missing = !f.firstName?.trim() ? "your first name" : !f.email?.trim() ? "your email" : !f.countryCode ? "your country"
      : questions.find((q) => q.required && !answers[q.id]?.trim())?.label || "";
    if (missing) { setProblem(missing); setStatus("error"); return; }
    setStatus("submitting");
    let timezone = "";
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unknown */ }
    try {
      const res = await ApiHelper.postAnonymous("/crm/public/events/" + encodeURIComponent(slug) + "/register", { ...f, groupSize: Number(f.groupSize) || 1, answers, contactConsent: consent, timezone, website, source: new URLSearchParams(window.location.search).get("src") || "page" }, "MembershipApi");
      setJoinUrl(res?.joinUrl || null);
      setAgain(!!res?.again);
      setStatus("done");
      track("event_registered", { event: slug });
    } catch (err: any) {
      const msg = String(err?.message || "");
      setStatus(/429|too_many/i.test(msg) ? "rate-limited" : /full/.test(msg) ? "full" : /registration_closed/.test(msg) ? "closed" : "error");
      setProblem("");
    }
  };

  if (status === "done") {
    return (
      <div className="bt-card" style={{ padding: "26px 24px" }} role="status">
        <h3 className="bt-h3">{again ? "You were already registered" : "You are registered"}</h3>
        <p style={{ marginTop: 8 }}>
          {again ? "We have updated your details." : `Thank you for registering for ${title}.`} A confirmation is on its way to {f.email}, with the time in your own time zone. We will remind you before we begin.
        </p>
        {joinUrl && <p style={{ marginTop: 12 }}><a className="bt-btn bt-btn-sm" href={joinUrl} target="_blank" rel="noopener noreferrer">How to join</a></p>}
      </div>
    );
  }

  const field = (k: string, label: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label style={LABEL} htmlFor={"ev-" + k}>{label}</label>
      <input id={"ev-" + k} className="bt-field" value={f[k] || ""} onChange={(e) => set(k, e.target.value)} disabled={submitting} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="bt-card" style={{ padding: 22, display: "grid", gap: 14, position: "relative" }} noValidate id="register">
      <h2 className="bt-h3">Register</h2>
      <div style={GRID}>
        {field("firstName", "First name", { autoComplete: "given-name", required: true })}
        {field("lastName", "Last name", { autoComplete: "family-name" })}
      </div>
      <div style={GRID}>
        {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
        {field("phone", <>Phone or WhatsApp <span style={HINT}>(with country code)</span></>, { type: "tel", autoComplete: "tel", placeholder: "+256 ..." })}
      </div>
      <div style={GRID}>
        <div>
          <label style={LABEL} htmlFor="ev-country">Country</label>
          <select id="ev-country" className="bt-field" value={f.countryCode || ""} onChange={(e) => set("countryCode", e.target.value)} disabled={submitting} required>
            <option value="">Choose your country</option>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        {field("city", "City or town", { autoComplete: "address-level2" })}
      </div>
      <div style={GRID}>
        <div>
          <label style={LABEL} htmlFor="ev-language">Language you prefer</label>
          <input id="ev-language" className="bt-field" list="ev-languages" value={f.language || ""} onChange={(e) => set("language", e.target.value)} disabled={submitting} />
          <datalist id="ev-languages">{langOptions.map((l) => <option key={l} value={l} />)}</datalist>
        </div>
        <div>
          <label style={LABEL} htmlFor="ev-role">Your role in ministry <span style={HINT}>(if any)</span></label>
          <select id="ev-role" className="bt-field" value={f.ministryRole || ""} onChange={(e) => set("ministryRole", e.target.value)} disabled={submitting}>
            <option value="">Choose</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={GRID}>
        {field("organization", <>Your church or ministry <span style={HINT}>(optional)</span></>)}
        <div>
          <label style={LABEL} htmlFor="ev-group">How many people are coming with you, counting yourself?</label>
          <input id="ev-group" type="number" min={1} max={10000} className="bt-field" value={f.groupSize || "1"} onChange={(e) => set("groupSize", e.target.value)} disabled={submitting} />
        </div>
      </div>
      {questions.map((q) => (
        <div key={q.id}>
          <label style={LABEL} htmlFor={"evq-" + q.id}>{q.label}{!q.required && <span style={HINT}> (optional)</span>}</label>
          {q.type === "textarea" ? (
            <textarea id={"evq-" + q.id} className="bt-field" rows={3} value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} disabled={submitting} />
          ) : q.type === "select" || q.type === "yesno" ? (
            <select id={"evq-" + q.id} className="bt-field" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} disabled={submitting}>
              <option value="">Choose</option>
              {(q.type === "yesno" ? ["Yes", "No"] : q.options).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input id={"evq-" + q.id} className="bt-field" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} disabled={submitting} />
          )}
        </div>
      ))}
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.93rem", cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={submitting} style={{ marginTop: 4 }} />
        <span>Yes, you may contact me about future events and Bible studies.</span>
      </label>

      <div aria-hidden style={HONEYPOT}>
        <label htmlFor="ev-website">Website</label>
        <input id="ev-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {status === "error" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>{problem ? `Please fill in ${problem}.` : "Something went wrong. Please check your details and try again."}</p>}
      {status === "rate-limited" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>We received several registrations from you just now. Please wait a few minutes and try again.</p>}
      {status === "full" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>This event is full.</p>}
      {status === "closed" && <p role="alert" style={{ color: "var(--bt-live)", fontSize: "0.93rem" }}>Registration for this event has closed.</p>}

      <div><button type="submit" className="bt-btn" disabled={submitting}>{submitting ? "Registering..." : "Register"}</button></div>
    </form>
  );
};
