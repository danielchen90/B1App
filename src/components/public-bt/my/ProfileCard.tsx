"use client";

// Profile and household: the member's own details on their church record, and the
// worship center they call home. Saves through POST /membership/me/person, which only
// ever touches the caller's own record. The sign-in email belongs to the Mary Banks
// ID and is changed there.

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { MePerson } from "./MyChurch";
import type { LocatorCampus } from "../LeafletLocatorMap";

interface Props {
  person: MePerson | null;
  household: { personId: string; displayName: string; role?: string }[];
  centers: LocatorCampus[];
  onSaved: () => void;
}

const LABEL: React.CSSProperties = { display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--bt-ink)", marginBottom: 5 };
const FIELDS: [keyof MePerson, string, string][] = [
  ["firstName", "First name", "given-name"], ["lastName", "Last name", "family-name"], ["phone", "Phone", "tel"],
  ["address1", "Street address", "address-line1"], ["city", "City", "address-level2"], ["state", "State or parish", "address-level1"], ["zip", "Postal code", "postal-code"]
];

export const ProfileCard: React.FC<Props> = ({ person, household, centers, onSaved }) => {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  React.useEffect(() => {
    const f: Record<string, string> = {};
    FIELDS.forEach(([k]) => { f[k as string] = (person?.[k] as string) || ""; });
    f.campusId = person?.campusId || "";
    setForm(f);
  }, [person]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      await ApiHelper.post("/me/person", form, "MembershipApi");
      setStatus("saved");
      setEditing(false);
      onSaved();
    } catch {
      setStatus("error");
    }
  };

  const center = centers.find((c) => c.id === person?.campusId);

  return (
    <section className="bt-my-card" aria-labelledby="my-profile">
      <div className="bt-eyebrow">Profile and household</div>
      <h2 id="my-profile" className="bt-h3">My details</h2>
      {!person ? (
        <p className="bt-my-empty">Once your church record is linked to your account, your details and household appear here. If we found a record above, choose &ldquo;Yes, that&rsquo;s me&rdquo;.</p>
      ) : !editing ? (
        <>
          <ul className="bt-my-list">
            <li><span>Name</span><span>{[person.firstName, person.lastName].filter(Boolean).join(" ")}</span></li>
            <li><span>Worship center</span><span>{center?.name || "Not set"}</span></li>
            <li><span>Phone</span><span>{person.phone || "Not set"}</span></li>
            <li><span>Address</span><span style={{ textAlign: "right" }}>{[person.address1, [person.city, person.state].filter(Boolean).join(", "), person.zip].filter(Boolean).join(" ") || "Not set"}</span></li>
          </ul>
          {household.length > 1 && (
            <div>
              <div className="bt-eyebrow" style={{ marginBottom: 6 }}>My household</div>
              <ul className="bt-my-list">
                {household.map((h) => <li key={h.personId}><span>{h.displayName}</span><span className="bt-my-empty">{h.role || ""}</span></li>)}
              </ul>
            </div>
          )}
          {status === "saved" && <p role="status" className="bt-my-empty">Saved.</p>}
          <div><button type="button" className="bt-btn bt-btn-sm bt-btn-outline" onClick={() => setEditing(true)}>Edit my details</button></div>
        </>
      ) : (
        <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={LABEL} htmlFor="me-campus">Worship center</label>
            <select id="me-campus" className="bt-field" value={form.campusId || ""} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
              <option value="">Choose your center</option>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {FIELDS.map(([k, label, ac]) => (
              <div key={k as string}>
                <label style={LABEL} htmlFor={"me-" + (k as string)}>{label}</label>
                <input id={"me-" + (k as string)} className="bt-field" autoComplete={ac} value={form[k as string] || ""} onChange={(e) => setForm({ ...form, [k as string]: e.target.value })} />
              </div>
            ))}
          </div>
          {status === "error" && <p role="alert" style={{ color: "var(--bt-live)" }}>We couldn&rsquo;t save that. Please check the details and try again.</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="bt-btn bt-btn-sm" disabled={status === "saving"}>{status === "saving" ? "Saving..." : "Save"}</button>
            <button type="button" className="bt-btn bt-btn-sm bt-btn-outline" onClick={() => { setEditing(false); setStatus("idle"); }}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
};
