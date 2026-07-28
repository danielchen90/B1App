// BT per-campus LEADERSHIP (Phase 20, Plan 05, SITE-04).
//
// Consumes the ALREADY-REDACTED PublicLeaderDTO from GET /membership/public/:churchId/
// leadership: name / role / photo ONLY. The DTO carries NO email, phone, address, or any
// private contact — and this component references NO such field, so nothing private can
// render even if a future row leaked one. PUBLIC-SAFE by construction.
//
// Layout: a FEATURED lead (larger card + a short bio) followed by a responsive photo
// grid for the rest. The leadership DTO has no bio field (SITE-04 note), so the featured
// bio is pulled from the campus content copy (pastorNote / welcomeNote) passed in by the
// page — never from a person record.
//
// EMPTY-STATE: leadership falls with media/people, not with core info — when the list is
// empty the page does not render this section at all (guarded upstream), so here we simply
// render nothing on an empty list too (defensive). RSC-safe.

import React from "react";

// Client mirror of the API PublicLeaderDTO — name/role/photo ONLY (SITE-04). No contact.
export interface PublicLeader {
  id: string;
  displayName: string;
  role: string | null;
  photo: string | null;
}

interface Props {
  leaders: PublicLeader[];
  /** Short bio for the featured lead, sourced from campus copy (pastorNote/welcomeNote). */
  featuredBio?: string;
}

const Avatar: React.FC<{ leader: PublicLeader; size: number }> = ({ leader, size }) => {
  if (leader.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={leader.photo}
        alt={leader.displayName}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", display: "block" }}
      />
    );
  }
  // No public photo (minor/unknown-age suppression or none stored) → initial monogram.
  const initial = (leader.displayName || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--bt-surface-alt)",
        border: "1px solid var(--bt-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--bt-heading-font)",
        fontWeight: 700,
        fontSize: size * 0.4,
        color: "var(--bt-muted)"
      }}
    >
      {initial}
    </div>
  );
};

export const LeadershipGrid: React.FC<Props> = ({ leaders, featuredBio }) => {
  if (!leaders || leaders.length === 0) return null;

  const [featured, ...rest] = leaders;

  return (
    <div>
      <h2 style={{ fontSize: "2rem", marginBottom: 28 }}>Our Leadership</h2>

      {/* Featured lead — larger card + short bio (from campus copy, not a person record). */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          flexWrap: "wrap",
          border: "1px solid var(--bt-line)",
          borderRadius: "var(--bt-radius-lg)",
          background: "var(--bt-surface)",
          padding: 28,
          marginBottom: rest.length ? 36 : 0
        }}
      >
        <Avatar leader={featured} size={120} />
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 800, fontSize: "1.5rem" }}>
            {featured.displayName}
          </div>
          {featured.role && <div style={{ color: "var(--bt-gold-strong)", fontWeight: 600, marginTop: 4 }}>{featured.role}</div>}
          {featuredBio && (
            <p style={{ color: "var(--bt-muted)", lineHeight: 1.6, marginTop: 14, maxWidth: 640 }}>{featuredBio}</p>
          )}
        </div>
      </div>

      {/* Responsive photo grid for the rest — name/role/photo only. */}
      {rest.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 22
          }}
        >
          {rest.map((l) => (
            <li key={l.id} style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Avatar leader={l} size={96} />
              </div>
              <div style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700 }}>{l.displayName}</div>
              {l.role && <div style={{ color: "var(--bt-muted)", fontSize: "0.92rem", marginTop: 2 }}>{l.role}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
