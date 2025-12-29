// src/config/constants.js

export const LANE_TYPES = {
  KNOWN_FALSE: "KNOWN_FALSE",     // Lane 0: Conspiracies (Instant Reject)
  EXTRAORDINARY: "EXTRAORDINARY", // Lane 1: Apocalyptic/Impossible (Instant Reject)
  HIGH_IMPACT: "HIGH_IMPACT",     // Lane 2: Assassinations, War, Terror (Strict Verify)
  NORMAL: "NORMAL"                // Lane 3: Standard News (Deep Analysis)
};

// Regex patterns for instant detection
export const CONSPIRACY_PATTERNS = {
  flatEarth: [
    /earth\s+is\s+(flat|disc|not\s+round|not\s+a\s+sphere)/i,
    /flat\s+earth/i,
    /nasa\s+(lies|lied|fake|hoax)/i,
    /ice\s+wall/i
  ],
  moonLanding: [
    /moon\s+landing\s+(fake|hoax|staged|filmed)/i,
    /never\s+went\s+to\s+(the\s+)?moon/i,
    /moon\s+landing.*hollywood/i
  ],
  antivax: [
    /vaccines?.*(microchip|tracker|magnet|dna|poison|bioweapon)/i,
    /depopulation\s+agenda/i
  ],
  chemtrails: [
    /chemtrails?/i,
    /geoengineering.*spray/i
  ]
};

// Patterns that trigger "High Impact" strict verification
// UPDATED: Now includes names (Modi, Biden, etc.) and catch-all terms
export const HIGH_IMPACT_PATTERNS = [
  // 1. Titles & Generic Roles
  /(president|prime\s+minister|leader|pm)\s+(has\s+been\s+)?(assassinated|killed|murdered|shot\s+dead)/i,
  /assassination\s+of/i,

  // 2. Specific Major Leaders (Critical for Lane 2 Routing)
  /(narendra\s+modi|modi|biden|trump|putin|xi\s+jinping|zelensky).*(assassinated|killed|murdered|shot|dead)/i,
  
  // 3. Catch-all Actions
  /assassinated\s+by/i,
  /has\s+been\s+assassinated/i,
  
  // 4. Other Security Critical Events
  /declared\s+war/i,
  /terror.*attack/i,
  /nuclear.*(launch|strike|war)/i,
  /military\s+coup/i,
  /state\s+of\s+emergency/i
];

// Scoring weights for the Rules Engine
export const RULES_WEIGHTS = {
  NO_SOURCE: -25,
  VAGUE_SOURCE: -15,            // e.g. "Sources say..."
  SENSATIONAL_PUNCTUATION: -15, // e.g. "!!!"
  EXCESSIVE_CAPS: -10,
  URGENCY_LANGUAGE: -15,        // e.g. "SHARE NOW"
  CLICKBAIT_TITLE: -10,
  TRUSTED_SOURCE: +20,          // e.g. Reuters, BBC
  SPECIFIC_DETAILS: +10,        // e.g. Dates, Specific numbers
  NEUTRAL_TONE: +5
};