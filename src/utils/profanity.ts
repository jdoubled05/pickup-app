/**
 * Client-side profanity filter for usernames.
 *
 * This is a first-pass UX check that gives immediate feedback.
 * The authoritative backstop is the Postgres trigger in migration 015,
 * which runs server-side and cannot be bypassed.
 *
 * Word list covers the most common English profanity and slurs.
 * Normalises leetspeak substitutions (3→e, 0→o, 1→i, @→a, $→s)
 * before checking so simple evasions are caught.
 */

const BLOCKED: string[] = [
  // Sexual
  "fuck", "fucc", "fuk", "fck",
  "shit", "sht",
  "ass", "arse",
  "bitch", "btch",
  "cunt", "cnt",
  "dick", "dik",
  "cock", "cok",
  "pussy",
  "penis", "vagina",
  "slut", "slt",
  "whore", "whor",
  "porn", "prn",
  "sex",
  "nude", "nudes",
  "boob", "boobs", "tit", "tits",
  "cum", "jizz",
  "rape", "rapist",
  "dildo",
  "anal",
  "blowjob",
  "handjob",
  "masturbat",
  // Racial / ethnic slurs
  "nigger", "nigga", "niga",
  "spic", "spick",
  "kike",
  "chink",
  "gook",
  "wetback",
  "cracker",
  "honky",
  "beaner",
  "towelhead",
  "raghead",
  "redskin",
  "tranny",
  "fag", "faggot",
  "dyke",
  // Violence / hate
  "nazi", "hitler",
  "kkk",
  "jihad",
  "terrorist",
  "genocide",
  // Other
  "retard", "retarded",
  "bastard",
  "piss", "pee",
  "prick",
  "twat",
  "wank", "wanker",
  "bollocks",
  "bugger",
  "damn",
  "hell",
];

/** Normalise leetspeak so "f4ck" → "fack", "a$$" → "ass", etc. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/\+/g, "t")
    .replace(/[^a-z]/g, ""); // strip remaining non-alpha
}

/**
 * Returns true if the string contains a blocked word.
 * Checks both the raw value and a normalised version.
 */
export function containsProfanity(text: string): boolean {
  const raw = text.toLowerCase().replace(/[^a-z0-9@$!]/g, "");
  const clean = normalise(text);
  return BLOCKED.some((word) => raw.includes(word) || clean.includes(word));
}
