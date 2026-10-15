// Decides whether a message should be met with crisis resources before it is sent. This is a safety
// net in front of the AI's own crisis rule (see CRISIS_SAFETY in keystone-ai-service), not a classifier:
// it matches explicit statements about suicide or self-harm and leaves everyday figures of speech alone
// ("this deadline is killing me", "I'm dying to try it"). A false alarm costs a dismissible sheet, a
// miss costs more, so when in doubt about an explicit first-person statement it matches.
//
// Wording of the sheet this triggers was approved by the app owner; do not paraphrase it.

// "live"/"living" followed by a place or companion is an ordinary sentence ("I don't want to live in the past"),
// so those are excluded; "take my life back" is the everyday idiom, not the statement.
const NOT_A_PLACE = "(?!\\s+(?:in|with|on|near|at|by|like|for|a|an|the|without|where|here|there|my|your|their|his|her)\\b)";

const SELF_HARM_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/,
  /\b(kill|killing|end|ending|take|taking|hurt|hurting|harm|harming|cut|cutting)\s+(myself|my own life)\b/,
  /\b(end|ending|take|taking)\s+my\s+life\b(?!\s+back)/,
  /\b(want\s+to|wanna|gonna|going\s+to|plan(ning)?\s+to|ready\s+to|decided\s+to)\s+(die|end it all|kill myself)\b/,
  new RegExp(`\\b(don't|do not|no longer)\\s+want\\s+to\\s+(live${NOT_A_PLACE}|be alive|be here anymore|exist)\\b`),
  new RegExp(`\\bno\\s+(reason|point)\\s+(to|in)\\s+(live|living|go on|going on|being alive|be alive)\\b${NOT_A_PLACE}`),
  /\bbetter\s+off\s+(dead|without me)\b/,
  /\bwish\s+i\s+(was|were)\s+(dead|never born)\b/,
  /\bwish\s+i\s+(would|could|might)\s+(just\s+)?(die|not wake up|disappear forever)\b/,
  /\bself[\s-]?harm(ing)?\b/,
  /\bend\s+it\s+all\b/,
];

// Curly apostrophes from the iOS keyboard would otherwise defeat "don't"
const normalize = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'");

export const detectCrisis = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const normalized = normalize(text);
  return SELF_HARM_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const HELPLINE_URL = 'https://findahelpline.com';
export const US_CRISIS_CALL_NUMBER = '988';
export const US_CRISIS_TEXT_NUMBER = '741741';
export const US_CRISIS_TEXT_KEYWORD = 'HOME';
