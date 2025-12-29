import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL = "mistral"; 

// Helper: Clean Ollama's output to prevent JSON parse errors
const cleanJsonOutput = (text) => {
  if (!text) return "{}";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const buildSmartPrompt = (userText, sources) => {
  return `
  You are VeriLens, an expert AI Truth Arbiter.
  
  User Claim: "${userText}"
  
  // --- EVIDENCE START ---
  Trusted Sources Found: 
  ${JSON.stringify(sources)}
  // --- EVIDENCE END ---

  **INSTRUCTIONS:**
  1. **Analyze Sources:** Check the 'Trusted Sources' above. Do they confirm the claim?
  2. **Internal Knowledge:** If sources are missing, use your internal knowledge.
  3. **Verdict Selection:**
     - "Highly Credible" -> Supported by sources.
     - "Likely False" -> Contradicted by sources.
     - "Fabricated" -> Scientifically impossible.
     - "Unverified" -> No info available.

  **OUTPUT FORMAT (JSON ONLY):**
  {
    "verdict": "String",
    "credibility_score": Number (0-100),
    "assessment": "String (Cite specific sources if available, e.g., 'According to BBC...')",
    "is_scientifically_possible": Boolean
  }
  `;
};

export const llmCompare = async (userText, sources, claimInfo) => {
  try {
    // [DEBUGGING] Proves exactly what data we have
    console.log(`\n🔍 [LLM Check] Sending ${sources.length} articles to Ollama...`);
    
    if (sources.length > 0) {
      // We log the WHOLE object so we can see if it uses 'title', 'headline', or something else
      console.log("   📄 Sample Data Structure:", JSON.stringify(sources[0]).substring(0, 150) + "..."); 
    } else {
      console.log(`   ⚠️ No sources found. Relying on Internal Knowledge.`);
    }

    const response = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt: buildSmartPrompt(userText, sources),
      stream: false,
      format: "json",
      options: { temperature: 0.1 }
    }, { timeout: 30000 });

    const cleanRaw = cleanJsonOutput(response.data.response);
    const parsed = JSON.parse(cleanRaw);
    
    // Normalize scores
    if (parsed.credibility_score === undefined && parsed.confidence_score !== undefined) {
      parsed.credibility_score = parsed.confidence_score;
    }

    console.log(`✅ [LLM Result] Verdict: ${parsed.verdict} | Score: ${parsed.credibility_score}`);
    return parsed;

  } catch (error) {
    console.error("⚠️ [LLM ERROR]:", error.message);
    return { 
        verdict: "UNVERIFIED", 
        credibility_score: 0, 
        assessment: "AI analysis failed. Please try again.", 
        is_scientifically_possible: true 
    };
  }
};