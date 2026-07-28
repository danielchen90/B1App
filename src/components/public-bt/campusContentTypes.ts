// Client mirror of the API's resolved public campus-content DTO (Phase 20, Plan 05).
//
// The anonymous GET /membership/campusContent/public/:churchId/:campusId endpoint
// (CampusContentController.resolvePublic) projects the org-default overlaid with the
// campus override through a positive whitelist — so ONLY these keys ever arrive. Every
// field is optional. `serviceTimes`/`extraLinks` are whole lists. The explicit-hide
// sentinel (HIDDEN) may appear in place of any field when a campus deliberately blanks
// an inherited org-default value; consumers treat it as absent.
//
// This is a PURE render contract — no bytes, no keys, no PII. heroImage is a FilesManager
// URL/reference resolved server-side; serviceTimes/address are crawlable text.

export const HIDDEN = "__HIDDEN__" as const;

export interface ServiceTime {
  day: string;
  time: string;
  label?: string;
}

export interface ExtraLink {
  label: string;
  url: string;
}

export interface CampusContent {
  mission?: string | typeof HIDDEN;
  about?: string | typeof HIDDEN;
  welcomeNote?: string | typeof HIDDEN;
  pastorNote?: string | typeof HIDDEN;
  heroImage?: string | typeof HIDDEN;
  serviceTimes?: ServiceTime[] | typeof HIDDEN;
  facebookUrl?: string | typeof HIDDEN;
  instagramUrl?: string | typeof HIDDEN;
  youtubeUrl?: string | typeof HIDDEN;
  givingUrl?: string | typeof HIDDEN;
  sermonYoutubeChannel?: string | typeof HIDDEN;
  extraLinks?: ExtraLink[] | typeof HIDDEN;
}
