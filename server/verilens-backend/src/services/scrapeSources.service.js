// src/services/scrapeSources.service.js
import axios from 'axios';
import { parseStringPromise } from 'xml2js'; // Requires: npm install xml2js

// --- CONFIGURATION ---
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const TIMEOUT_MS = 8000; // 8 seconds per source

// API KEYS (Load from environment variables for security)
const KEYS = {
  NEWSAPI: process.env.NEWSAPI_KEY,      // Get free key at newsapi.org
  BING: process.env.BING_NEWS_KEY,       // Get key at azure.com
  NYT: process.env.NYT_API_KEY           // Get key at developer.nytimes.com
};

// In-memory cache
const sourceCache = new Map();

// --- HELPER 1: Google News RSS (The Heavy Lifter - Free & Broad) ---
// This covers "Every" major publisher (CNN, BBC, Reuters, etc.)
const fetchGoogleNewsRSS = async (query) => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    
    const { data } = await axios.get(url, { timeout: TIMEOUT_MS });
    const result = await parseStringPromise(data);
    
    // Extract items from RSS structure
    if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) return [];
    
    return result.rss.channel[0].item.slice(0, 5).map(item => {
      const title = item.title ? item.title[0] : "No Title";
      const source = item.source ? item.source[0]._ : "Google News";
      const date = item.pubDate ? item.pubDate[0] : new Date().toISOString();
      return `[${source}] (${date}): ${title}`;
    });
  } catch (error) {
    console.error("⚠️ Google RSS Failed:", error.message);
    return [];
  }
};

// --- HELPER 2: NewsAPI (Standard Aggregator) ---
const fetchNewsAPI = async (query) => {
  if (!KEYS.NEWSAPI) return []; // Skip if no key
  
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&language=en&apiKey=${KEYS.NEWSAPI}`;
    const { data } = await axios.get(url, { timeout: TIMEOUT_MS });
    
    if (data.status !== "ok") return [];
    
    return data.articles.map(article => 
      `[${article.source.name}] (${article.publishedAt}): ${article.title} - ${article.description || ""}`
    );
  } catch (error) {
    console.error("⚠️ NewsAPI Failed:", error.message);
    return [];
  }
};

// --- HELPER 3: Bing News Search (Microsoft Aggregator) ---
const fetchBingNews = async (query) => {
  if (!KEYS.BING) return []; // Skip if no key
  
  try {
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=5`;
    const { data } = await axios.get(url, { 
      headers: { 'Ocp-Apim-Subscription-Key': KEYS.BING },
      timeout: TIMEOUT_MS 
    });
    
    return data.value.map(article => 
      `[Bing News/${article.provider[0]?.name}] (${article.datePublished}): ${article.name}`
    );
  } catch (error) {
    console.error("⚠️ Bing News Failed:", error.message);
    return [];
  }
};

// --- MAIN AGGREGATOR ---
const fetchRealSources = async (query) => {
  console.log(`🌐 [Scraper] Aggregating sources for: "${query}"`);
  
  // Run all fetchers in parallel (Promise.allSettled allows some to fail without crashing others)
  const results = await Promise.allSettled([
    fetchGoogleNewsRSS(query), // Primary (Free)
    fetchNewsAPI(query),       // Secondary (Key req)
    fetchBingNews(query)       // Tertiary (Key req)
  ]);

  // Flatten results and remove duplicates
  const allArticles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // De-duplicate based on similar titles (simple check)
  const uniqueArticles = [...new Set(allArticles)];

  // Fallback for "Assassination" logic check
  // If we searched for a major event and found NOTHING, return empty array.
  // This preserves your logic: "No sources = False for high impact"
  if (uniqueArticles.length === 0) {
    console.log("⚠️ No sources found across all feeders.");
  } else {
    console.log(`✅ Found ${uniqueArticles.length} articles.`);
  }

  return uniqueArticles.slice(0, 15); // Return top 15 results max
};

export const scrapeSources = async (userText) => {
  // 1. Create Cache Key
  const cacheKey = userText.substring(0, 50).toLowerCase().trim();

  // 2. Check Cache
  if (sourceCache.has(cacheKey)) {
    const cached = sourceCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ [Scraper] Serving from Cache');
      return cached.data;
    }
  }

  try {
    // 3. Fetch from Real Aggregators
    const data = await fetchRealSources(userText);
    
    // 4. Update Cache
    sourceCache.set(cacheKey, { timestamp: Date.now(), data });
    return data;

  } catch (error) {
    console.error("❌ Critical Scraper Error:", error.message);
    return []; // Return empty so the pipeline doesn't crash
  }
};