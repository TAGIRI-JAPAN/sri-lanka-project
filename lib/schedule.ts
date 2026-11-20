export const TOKYO = "Asia/Tokyo";
export const COLOMBO = "Asia/Colombo";
export const MAX_SLOTS = 20;
export const MAX_INVITEES = 30;
export const MAX_NAME_LENGTH = 60;
export const DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export const choices = ["yes", "maybe", "no"] as const;
export const marks = { yes: "○", maybe: "△", no: "×" };
export type Choice = typeof choices[number];
export type Language = "ja" | "en";
export type PollSummary = { id: string; title: string; finalSlot: number | null };
export type Vote = { name: string; votes: Choice[] };
export type Invitee = { name: string; token: string };
export type Poll = PollSummary & {
  note: string; organizerZone: string; partnerZone: string;
  duration: number; slots: number[];
  managed: boolean; responses: Vote[]; ownVote: Vote | null;
  restricted: boolean; guestName: string | null;
  invitees: (Invitee & { responded: boolean })[];
};
export const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export const cities: Record<string, [string, string]> = {
  [TOKYO]: ["日本", "Japan"],
  [COLOMBO]: ["スリランカ", "Sri Lanka"],
  "Asia/Kolkata": ["インド", "India"],
  "Asia/Singapore": ["シンガポール", "Singapore"],
  "Asia/Kuala_Lumpur": ["マレーシア", "Malaysia"],
  "Asia/Bangkok": ["タイ", "Thailand"],
  "Asia/Ho_Chi_Minh": ["ベトナム", "Vietnam"],
  "Asia/Jakarta": ["インドネシア（ジャカルタ）", "Indonesia (Jakarta)"],
  "Asia/Manila": ["フィリピン", "Philippines"],
  "Asia/Seoul": ["韓国", "South Korea"],
  "Asia/Taipei": ["台北", "Taipei"],
  "Asia/Shanghai": ["中国", "China"],
  "Asia/Hong_Kong": ["香港", "Hong Kong"],
  "Asia/Dubai": ["UAE", "United Arab Emirates"],
  "Australia/Sydney": ["オーストラリア（シドニー）", "Australia (Sydney)"],
  "Pacific/Auckland": ["ニュージーランド", "New Zealand"],
  "Europe/London": ["イギリス", "United Kingdom"],
  "Europe/Paris": ["フランス", "France"],
  "Europe/Berlin": ["ドイツ", "Germany"],
  "America/New_York": ["アメリカ（東部）", "United States (Eastern)"],
  "America/Chicago": ["アメリカ（中部）", "United States (Central)"],
  "America/Los_Angeles": ["アメリカ（太平洋）", "United States (Pacific)"],
  "America/Toronto": ["カナダ（トロント）", "Canada (Toronto)"],
  "America/Sao_Paulo": ["ブラジル（サンパウロ）", "Brazil (São Paulo)"],
};

export function zoneName(zone: string, lang: Language) {
  return cities[zone]?.[lang === "ja" ? 0 : 1] ?? zone.replaceAll("_", " ");
}

export function validZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 70 || !/^[a-zA-Z_]+(?:\/[a-zA-Z_+\-0-9]+)*$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

function wallFormatter(zone: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
}

export function wallTime(instant: number, zone: string) {
  const fields = Object.fromEntries(wallFormatter(zone).formatToParts(instant).map(({ type, value }) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function parseWall(value: string, zone: string) {
  if (!/^20\d\d-\d\d-\d\dT\d\d:\d\d$/.test(value)) return null;
  const asUtc = Date.parse(`${value}Z`);
  if (!Number.isFinite(asUtc) || new Date(asUtc).toISOString().slice(0, 16) !== value) return null;

  // Check the offsets on both sides of a time-zone transition. A gap has no
  // match, and a repeated wall-clock time has two matches.
  const day = 86400000;
  const offsets = new Set([-day, 0, day].map(delta => {
    const probe = asUtc + delta;
    return Date.parse(`${wallTime(probe, zone)}Z`) - probe;
  }));
  const matches = [...offsets].map(offset => asUtc - offset).filter(time => wallTime(time, zone) === value);
  return matches.length === 1 ? matches[0] : null;
}

export function dateLabel(time: number, zone: string, lang: Language) {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-GB", {
    timeZone: zone, year: "numeric", month: "short", day: "numeric", weekday: "short",
  }).format(time);
}

export function timeLabel(time: number, zone: string, lang: Language) {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-GB", {
    timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(time);
}

export function timeRange(time: number, duration: number, zone: string, lang: Language) {
  const end = time + duration * 60000;
  const overnight = wallTime(time, zone).slice(0, 10) !== wallTime(end, zone).slice(0, 10);
  return `${timeLabel(time, zone, lang)}–${overnight ? dateLabel(end, zone, lang) + " " : ""}${timeLabel(end, zone, lang)}`;
}
