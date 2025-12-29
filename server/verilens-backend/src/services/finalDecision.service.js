// src/services/finalDecision.service.js

export const finalDecision = (llmResult, rulesResult, claimInfo) => {
  
  // --- AI DOMINATION MODE ---
  // We prioritize the LLM's judgment over all other signals.
  
  // 1. Get the Score directly from Ollama
  // We prefer 'credibility_score' but fallback to 'confidence_score' if the model uses the old format.
  let finalScore = llmResult.credibility_score || llmResult.confidence_score || 0;
  let finalVerdict = llmResult.verdict || "UNVERIFIED";
  let reason = llmResult.assessment || "AI Analysis completed.";

  // 2. CRITICAL SAFETY OVERRIDE (The only thing that overrides Ollama)
  // If the AI says "This breaks the laws of physics" (e.g., Aliens, Magic), we force a 0 score.
  if (llmResult.is_scientifically_possible === false) {
    return {
      verdict: "Fabricated / Impossible",
      riskLevel: "Critical",
      score: 0,
      reason: reason // Uses the AI's explanation for why it's impossible
    };
  }

  // 3. LOGIC SYNC: Prevent "High Score but False Verdict"
  // If Ollama explicitly says "FALSE", the score must be low.
  if ((finalVerdict === "FALSE" || finalVerdict === "MISLEADING") && finalScore > 40) {
    finalScore = 10; // Force it down to reflect the verdict
  }

  // 4. DETERMINE RISK LEVEL (Based purely on AI Score)
  let riskLevel = "Medium";
  
  if (finalScore >= 80) {
    riskLevel = "Low";
    if (finalVerdict === "TRUE") finalVerdict = "Highly Credible";
  } else if (finalScore >= 50) {
    riskLevel = "Medium";
    if (finalVerdict === "TRUE") finalVerdict = "Partially Verified";
  } else {
    riskLevel = "High";
    if (finalVerdict === "FALSE") finalVerdict = "Likely False Information";
  }

  return {
    verdict: finalVerdict,
    riskLevel: riskLevel,
    score: Math.round(finalScore), // The exact number Ollama gave
    reason: reason,
    metadata: {
      // We pass these through for the frontend to verify, but they don't change the score
      lane: claimInfo.lane, 
      sources_found: claimInfo.sources_count
    }
  };
};