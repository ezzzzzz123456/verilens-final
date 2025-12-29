import { LANE_TYPES, CONSPIRACY_PATTERNS, HIGH_IMPACT_PATTERNS } from '../config/constants.js';

export const classifyClaim = (text) => {
  if (!text) return { lane: LANE_TYPES.NORMAL, category: "general", confidence: 0 };

  const normalizedText = text.toLowerCase();

  // 1. LANE 0: Check for Known Conspiracies (Instant Rejection)
  for (const [category, patterns] of Object.entries(CONSPIRACY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return {
          lane: LANE_TYPES.KNOWN_FALSE,
          category: category,
          confidence: 0.95,
          reason: "Matches known conspiracy pattern"
        };
      }
    }
  }

  // 2. LANE 2: Check for High Impact Events (Strict Verification)
  if (HIGH_IMPACT_PATTERNS.some(pattern => pattern.test(normalizedText))) {
    return {
      lane: LANE_TYPES.HIGH_IMPACT,
      category: "security_critical",
      confidence: 0.8,
      reason: "High-impact public event detected"
    };
  }

  // 3. LANE 3: Default to Normal News (Standard Analysis)
  return {
    lane: LANE_TYPES.NORMAL,
    category: "general",
    confidence: 1.0,
    reason: "Standard claim analysis"
  };
};