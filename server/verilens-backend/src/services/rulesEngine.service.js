// src/services/rulesEngine.service.js
import { RULES_WEIGHTS } from '../config/constants.js';

export const rulesEngine = (text) => {
  let score = 75; // Starting base score
  const reasons = [];
  const breakdown = {};

  // 1. Punctuation Check
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount >= 3) {
    score += RULES_WEIGHTS.SENSATIONAL_PUNCTUATION;
    reasons.push(`Excessive exclamation marks (${exclamationCount})`);
    breakdown.punctuation = RULES_WEIGHTS.SENSATIONAL_PUNCTUATION;
  }

  // 2. Capitalization Check (Yelling)
  const capsCount = text.replace(/[^A-Z]/g, "").length;
  const totalCount = text.length;
  if (totalCount > 20 && (capsCount / totalCount) > 0.4) {
    score += RULES_WEIGHTS.EXCESSIVE_CAPS;
    reasons.push("Excessive use of CAPITAL LETTERS");
    breakdown.caps = RULES_WEIGHTS.EXCESSIVE_CAPS;
  }

  // 3. Source Attribution Check
  const trustedSources = /reuters|associated\s+press|bbc|ap\s+news|npr|bloomberg/i;
  const vagueSources = /sources\s+say|reported\s+by|according\s+to/i;

  if (trustedSources.test(text)) {
    score += RULES_WEIGHTS.TRUSTED_SOURCE;
    reasons.push("Cited a trusted news organization");
    breakdown.source = RULES_WEIGHTS.TRUSTED_SOURCE;
  } else if (!vagueSources.test(text)) {
    score += RULES_WEIGHTS.NO_SOURCE;
    reasons.push("No clear source attribution found");
    breakdown.source = RULES_WEIGHTS.NO_SOURCE;
  } else {
    score += RULES_WEIGHTS.VAGUE_SOURCE; // Penalty for vague attribution
    reasons.push("Vague source attribution");
    breakdown.source = RULES_WEIGHTS.VAGUE_SOURCE;
  }

  // 4. Urgency Check
  if (/share\s+now|viral|urgent|before\s+it's\s+too\s+late/i.test(text)) {
    score += RULES_WEIGHTS.URGENCY_LANGUAGE;
    reasons.push("Uses manipulative urgency language");
    breakdown.tone = RULES_WEIGHTS.URGENCY_LANGUAGE;
  }

  // Clamp score between 0 and 100
  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
    breakdown
  };
};