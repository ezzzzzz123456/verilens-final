// src/services/extractInput.service.js

export const extractInput = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return "";
  }
  
  // 1. Trim leading/trailing whitespace
  let cleanText = rawText.trim();
  
  // 2. Collapse multiple spaces/tabs/newlines into a single space
  // Example: "Hello    world\n\n" becomes "Hello world"
  cleanText = cleanText.replace(/\s+/g, ' ');

  // 3. Basic character sanitization (optional)
  // Removing purely invisible control characters if any
  cleanText = cleanText.replace(/[\x00-\x1F\x7F]/g, "");

  return cleanText;
};