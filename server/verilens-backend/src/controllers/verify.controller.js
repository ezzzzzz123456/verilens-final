// src/controllers/verify.controller.js
import { classifyClaim } from '../services/claimClassifier.service.js';
import { extractInput } from '../services/extractInput.service.js'; // <-- NEW IMPORT
import { scrapeSources } from '../services/scrapeSources.service.js';
import { llmCompare } from '../services/llmCompare.service.js';
import { rulesEngine } from '../services/rulesEngine.service.js';
import { finalDecision } from '../services/finalDecision.service.js';
import { LANE_TYPES } from '../config/constants.js';

export const verifyNews = async (req, res) => {
  const startTime = Date.now();

  try {
    const { content } = req.body;
    
    // 1. CLEAN INPUT (Sanitize text)
    const cleanedContent = extractInput(content);

    // Validation
    if (!cleanedContent || cleanedContent.length < 5) {
      return res.status(400).json({ error: "Content too short for analysis." });
    }

    console.log(`\n🔍 Processing: "${cleanedContent.substring(0, 40)}..."`);

    // 2. CLASSIFY (Lane Routing)
    const claimInfo = classifyClaim(cleanedContent);
    console.log(`🛣️  Lane: ${claimInfo.lane} (${claimInfo.category})`);

    // 3. FAST LANE RESPONSE (Instant Rejection)
    if (claimInfo.lane === LANE_TYPES.KNOWN_FALSE || claimInfo.lane === LANE_TYPES.EXTRAORDINARY) {
      return res.json({
        verdict: "Known False Information",
        riskLevel: "High",
        score: 0,
        metadata: {
          lane: claimInfo.lane,
          category: claimInfo.category,
          processingTime: `${Date.now() - startTime}ms`
        }
      });
    }

    // 4. SLOW LANE PROCESSING
    // Run Rules Engine (CPU bound)
    const rulesResult = rulesEngine(cleanedContent);

    // Run Scraper (Network bound)
    const sources = await scrapeSources(cleanedContent);

    // Run LLM (Network bound, needs sources)
    const llmResult = await llmCompare(cleanedContent, sources, claimInfo);

    // 5. FINAL DECISION
    const result = finalDecision(llmResult, rulesResult, claimInfo);

    // 6. RESPONSE
    res.json({
      ...result,
      breakdown: {
        ai_analysis: {
          status: llmResult.status,
          similarity: llmResult.similarity,
          reason: llmResult.reason
        },
        language_analysis: {
          score: rulesResult.score,
          issues: rulesResult.reasons
        }
      },
      metadata: {
        lane: claimInfo.lane,
        sources_found: sources.length,
        processingTime: `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error("❌ Pipeline Error:", error);
    res.status(500).json({ error: "Internal Verification Error" });
  }
};