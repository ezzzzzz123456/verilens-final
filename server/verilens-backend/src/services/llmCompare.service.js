import axios from 'axios';

// --- CLOUD-SMART URL LOGIC ---
// If OLLAMA_BASE_URL exists (on Render), use it. Otherwise, use localhost.
const BASE_OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_URL = `${BASE_OLLAMA_URL}/api/generate`;
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
    "assessment": "String",
    "is_scientifically_possible": Boolean
  }
  `;
};

export const llmCompare = async (userText, sources, claimInfo) => {
  try {
    console.log(`\n📡 [AI Bridge] Connecting to: ${BASE_OLLAMA_URL}`);
    console.log(`🔍 [Analysis] Model: ${MODEL} | Sources: ${sources.length}`);
    
    const response = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt: buildSmartPrompt(userText, sources),
      stream: false,
      format: "json",
      options: { 
        temperature: 0.1,
        num_ctx: 4096 
      }
    }, { 
      timeout: 45000, // Increased timeout for slow tunnels
      headers: { 'Content-Type': 'application/json' }
    });

    const cleanRaw = cleanJsonOutput(response.data.response);
    const parsed = JSON.parse(cleanRaw);
    
    console.log(`✅ [Success] AI Response received via tunnel.`);
    return parsed;

  } catch (error) {
    console.error("❌ [LLM BRIDGE ERROR]:", error.message);
    
    // Detailed error logging to help you debug in Render logs
    if (error.code === 'ECONNABORTED') console.error("   Reason: Request timed out (Tunnel too slow).");
    if (error.code === 'ECONNREFUSED') console.error("   Reason: Laptop/Ngrok is offline.");

    return { 
        verdict: "UNVERIFIED", 
        credibility_score: 0, 
        assessment: "AI analysis failed. Please check if your laptop is online and Ngrok is running.", 
        is_scientifically_possible: true 
    };
  }
};