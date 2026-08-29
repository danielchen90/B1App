// Bible Teachers International — public-site content seam.
//
// The org's campusContent API rows are still empty, so the public site's voice lives
// here: authored copy, org-level constants, and a per-campus enrichment map distilled
// from the ministry's own published Wix site (service times, contacts, socials).
// Resolution order everywhere: campusContent (API) wins → these extras fill gaps.
// When the API rows are authored later, this file simply stops mattering field by field.

export const BT = {
  name: "Bible Teachers International",
  shortName: "Bible Teachers",
  ministry: "Mary Banks Ministries",
  founder: "Apostle Mary Banks",
  tagline: "Gathering the Lost, One Sheep at a Time.",
  // Matthew 28:19–20 is the house commission — "teach all nations" names the ministry.
  commission: "Go ye therefore, and teach all nations…",
  commissionRef: "Matthew 28:19",
  youtubeChannelId: "UCH7nMCqkUMwgl7UiqjYbgwQ",
  youtubeUrl: "https://www.youtube.com/@MaryBanksMinistries",
  giveUrl: "https://donate.stripe.com/7sI9CbdLc1hy5l6dQZ",
  onlineChurchUrl: "https://www.btionlinechurch.com"
} as const;

export const BT_COPY = {
  // "A Church for you" copy from the ministry's home page, verbatim.
  heroSub:
    "Bible Teachers International is committed to growing you up spiritually that you may come to and walk in the full development of your supply of the Spirit. Find a location, and join the growth path today.",
  // The ministry's own self-description from its About page.
  identity:
    "God's influence in the earth. A voice of truth to gather the ignorant into the knowledge of God.",
  mission:
    "We are a division of Mary Banks Ministries and the MSOG Global Church, committed to worldwide evangelism, discipleship, healing, the perfecting of the Body of Christ, and the preparing of God's people for ministry.",
  aboutShort:
    "God has charged us to destroy the doctrines of devils by teaching the Word from His perspective. This requires that there be no private interpretation of scripture (II Peter 1:20); in other words, the Bible interprets itself. We teach the body of Christ how to apply God's principles to their real life situations, and as a result many have moved to a higher level of spiritual comprehension of God's Word and into a deeper, more intimate relationship with God.",
  whatToExpect:
    "Come as you are. A service at any of our worship centers is warm and unhurried: heartfelt worship, real prayer, and teaching that opens the Scriptures plainly. Bring your Bible and bring your questions.",
  discipleship:
    "Beyond Sunday, every worship center gathers through the week for discipleship: smaller settings where the Word is studied deeply, questions are welcomed, and believers are trained for ministry.",
  onlineBlurb:
    "Wherever you are in the world, the Online Church gathers every week: live services, discipleship over Zoom, and a praying community that spans continents.",
  // Prayer invitation from the ministry's home page, verbatim.
  prayerInvite:
    "Join ministers from all over the world as we send prayers up to heaven. Send in your prayer requests and let us know your praise reports.",
  beliefs:
    "We believe that God is a triune being. He is God the Father, God the Son and God the Holy Spirit.",
  beliefsRef: "1 John 5:7"
} as const;

// ── Per-campus enrichment (from the ministry's own published site) ──────────────

export interface BtServiceTime {
  day: string;
  time: string;
  label?: string;
}

export interface BtCampusExtras {
  country: string;
  flag: string;
  /** True for the virtual congregation — listed, never pinned on the map. */
  virtual?: boolean;
  serviceTimes?: BtServiceTime[];
  leaders?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  /** Campus-specific Stripe giving link (org default applies when absent). */
  givingUrl?: string;
}

const US = { country: "United States", flag: "🇺🇸" };
const JM = { country: "Jamaica", flag: "🇯🇲" };

export const BT_CAMPUS_EXTRAS: Record<string, BtCampusExtras> = {
  "atlanta": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "9:30 AM", label: "Worship service" },
      { day: "Wednesday", time: "6:30 PM", label: "Discipleship" }
    ],
    leaders: "Bishop Cynthia Thomas",
    facebookUrl: "https://www.facebook.com/BTI-Atlanta-769312939834357"
  },
  "bath": {
    ...JM,
    phone: "+1 (876) 815-1650"
  },
  "baton-rouge": {
    ...US,
    serviceTimes: [{ day: "Sunday", time: "8:00 AM", label: "Worship service" }],
    leaders: "Pastors Desmond & Marjorie Cameron",
    email: "BTIBatonRouge@bibleteachers.org",
    givingUrl: "https://donate.stripe.com/28o6q8byk6lSbsc6oq"
  },
  "belle-glade": {
    ...US,
    serviceTimes: [{ day: "Sunday", time: "10:00 AM", label: "Worship service" }],
    leaders: "Pastor Val Carter",
    phone: "+1 (561) 758-7997",
    facebookUrl: "https://www.facebook.com/bibleteachers.belleglade"
  },
  "cayman-islands": {
    country: "Cayman Islands",
    flag: "🇰🇾"
  },
  "decatur": {
    ...US,
    serviceTimes: [{ day: "Sunday", time: "10:30 AM", label: "Worship service" }],
    leaders: "Pastors Dr. Samuel & Dr. Angela Scott",
    phone: "+1 (470) 409-4694"
  },
  "east-kingston": {
    ...JM,
    serviceTimes: [
      { day: "Sunday", time: "9:00 AM", label: "Worship service" },
      { day: "Wednesday", time: "7:00 PM", label: "Discipleship & Bible study" },
      { day: "Mon & Tue", time: "6:00 AM", label: "Prayer" }
    ],
    leaders: "Pastors Marvin & Julia Brown",
    phone: "+1 (876) 861-3381",
    email: "Btiek@bibleteachers.org",
    facebookUrl: "https://www.facebook.com/BTIEK",
    youtubeUrl: "https://www.youtube.com/channel/UCsS5WdFFYsJZEX7e377ivMQ"
  },
  "fort-lauderdale": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "9:00 AM ET", label: "Worship service" },
      { day: "Wednesday", time: "7:00 PM ET", label: "Discipleship" }
    ],
    leaders: "Pastor Tanya Thomas",
    phone: "+1 (954) 716-6839",
    email: "bibleteachersfortlauderdale@gmail.com",
    facebookUrl: "https://www.facebook.com/btifortlauderdale",
    youtubeUrl: "https://www.youtube.com/@bibleteachersfortlauderdal855",
    givingUrl: "https://donate.stripe.com/aEU4j1dGY02H3mwcMM"
  },
  "freeport": {
    country: "Bahamas",
    flag: "🇧🇸",
    facebookUrl: "https://www.facebook.com/btifreeport",
    instagramUrl: "https://www.instagram.com/bti_freeport/",
    youtubeUrl: "https://www.youtube.com/channel/UCN_3_Do9i7qMLix94ExDD4w"
  },
  "half-way-tree": {
    ...JM,
    phone: "+1 (876) 968-1702",
    email: "btijamaica@bibleteachers.org",
    facebookUrl: "https://www.facebook.com/BTJamaica/",
    youtubeUrl: "https://www.youtube.com/channel/UCwy2QG7wYOFyAc9WeRWbUWg"
  },
  "indiantown": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "9:00 & 11:00 AM", label: "Worship services" },
      { day: "Wednesday", time: "7:00 PM", label: "Bible study" }
    ],
    leaders: "Pastor Wanda Grooms",
    phone: "+1 (772) 597-1463",
    facebookUrl: "https://www.facebook.com/btindiantown/",
    instagramUrl: "https://www.instagram.com/bibleteachers_indiantown/",
    youtubeUrl: "https://www.youtube.com/channel/UCjuSJ79yldL4GFmY1NgAe5g"
  },
  "leesburg": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "10:00 AM", label: "Worship service" },
      { day: "Wednesday", time: "6:00 PM", label: "Discipleship" }
    ],
    leaders: "Pastor Patty Johnson",
    phone: "+1 (352) 314-0300",
    email: "btileesburg@bibleteachers.org",
    facebookUrl: "https://www.facebook.com/BibleTeachersInternationalLeesburg"
  },
  "miami": {
    ...US,
    phone: "+1 (305) 769-9955"
  },
  "mississauga": {
    country: "Canada",
    flag: "🇨🇦",
    serviceTimes: [
      { day: "Sunday", time: "10:00 AM", label: "Worship service" },
      { day: "Thursday", time: "6:30 PM", label: "Discipleship (2nd & 4th)" }
    ],
    leaders: "Pastor Carolyn Marshall",
    email: "bticanada@bibleteachers.org",
    facebookUrl: "https://www.facebook.com/bticanada/",
    youtubeUrl: "https://www.youtube.com/channel/UCZjWgKnrv2085R4VBx4Gb4A"
  },
  "nassau": {
    country: "Bahamas",
    flag: "🇧🇸",
    email: "btinassau@gmail.com"
  },
  "online-church": {
    country: "Online",
    flag: "🌐",
    virtual: true,
    serviceTimes: [
      { day: "Wednesday", time: "7:00 PM ET", label: "Discipleship & fellowship" },
      { day: "Sunday", time: "7:00 PM ET", label: "Prayer" }
    ],
    leaders: "Pastor Starr Groff",
    email: "info@btionlinechurch.com",
    websiteUrl: "https://www.btionlinechurch.com"
  },
  "palm-beach": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "9:00 AM ET", label: "Worship service" },
      { day: "Wed & Fri", time: "7:00 PM ET", label: "Discipleship" }
    ],
    leaders: "Pastor Vickey Wright",
    phone: "+1 (561) 833-0715",
    email: "palmbeach@bibleteachers.org",
    facebookUrl: "https://www.facebook.com/btipalmbeach",
    instagramUrl: "https://www.instagram.com/bti_palmbeach/",
    youtubeUrl: "https://www.youtube.com/channel/UCOSwtj2dQVpalo6GB8Pu0dg"
  },
  "sarasota": { ...US },
  "shelby-mississippi": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "10:00 AM", label: "Worship service" },
      { day: "Thursday", time: "6:30 PM", label: "Bible study" }
    ],
    leaders: "Pastor Shirley Bridgett",
    phone: "+1 (662) 402-4024"
  },
  "spring-texas": {
    ...US,
    serviceTimes: [{ day: "Sunday", time: "10:00 AM", label: "Worship service" }],
    leaders: "Pastor Michael Thomas",
    phone: "+1 (832) 559-7885",
    email: "info@btihouston.com",
    youtubeUrl: "https://www.youtube.com/@MichaelThomasMinistries",
    givingUrl: "https://donate.stripe.com/7sI01x0pr2kJ6ty7ss"
  },
  "st-ann": { ...JM },
  "the-rock-international": {
    ...US,
    serviceTimes: [
      { day: "Sunday", time: "10:00 AM", label: "Worship service (online)" },
      { day: "Wednesday", time: "6:00 PM", label: "Bible study" }
    ],
    leaders: "Pastors Jimmie & Esperanza Lowman",
    phone: "+1 (407) 448-8744",
    email: "Therockinternational2018@gmail.com"
  },
  "trench-town": {
    ...JM,
    serviceTimes: [
      { day: "Sunday", time: "8:30 AM", label: "Worship service" },
      { day: "Sunday", time: "11:30 AM", label: "Children's church" },
      { day: "Mon to Fri", time: "6:30 AM", label: "Morning prayer (online)" }
    ],
    leaders: "Pastor Ketha Edmondson",
    phone: "+1 (876) 808-9039",
    email: "btitrenchtown@bibleteachers.org",
    youtubeUrl: "https://www.youtube.com/@btitrenchtown4014"
  },
  "trinidad": {
    country: "Trinidad & Tobago",
    flag: "🇹🇹",
    serviceTimes: [
      { day: "Sunday", time: "8:00 AM", label: "Worship service" },
      { day: "Tuesday", time: "7:00 PM", label: "Bible study" }
    ],
    leaders: "Pastor Jaghram Sankar",
    phone: "+1 (868) 799-5833",
    email: "jaghramsankar@hotmail.com",
    facebookUrl: "https://www.facebook.com/bibleteacherstrinidad",
    youtubeUrl: "https://www.youtube.com/channel/UC3vFmVJvwJBcrsT2yuI6khw"
  }
};

/** Slugs never shown on the public site (internal test campuses). */
export const isHiddenCampusSlug = (slug: string | null): boolean =>
  !slug || slug.startsWith("iso-demo");

export const getCampusExtras = (slug: string | null): BtCampusExtras | undefined =>
  (slug && BT_CAMPUS_EXTRAS[slug]) || undefined;

/** Country display order for the locations sidebar when no visitor location is known. */
export const BT_COUNTRY_ORDER = [
  "United States",
  "Jamaica",
  "Bahamas",
  "Trinidad & Tobago",
  "Cayman Islands",
  "Canada",
  "Online"
];

export const BT_NATION_COUNT = 6; // US, Jamaica, Bahamas, Trinidad & Tobago, Cayman, Canada
