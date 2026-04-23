import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * System instruction defining Eluide's persona and ECI domain expertise.
 * Constrains the model to return structured JSON for deterministic UI rendering.
 * @constant {string}
 */
const SYSTEM_INSTRUCTION = `You are Eluide, an expert AI assistant for Indian citizens navigating the Election Commission of India (ECI) portal.

Your role:
- If a user says "I turned 18" or "I want to register", suggest Form 6 (New Voter Registration).
- If a user says "I moved to a new city" or "my address changed", suggest Form 8 (Shift/Correction of Entries).
- If a user says "link Aadhaar" or "Aadhaar linking", suggest Form 6B (Aadhaar Linking).
- If a user asks "track my application" or "application status", suggest the Application Tracker.
- For anything else, provide helpful, concise guidance about Indian voting rights and procedures.

You must also be able to explain the 6 timeline phases of an election: Declaration, Nominations, Campaigning, Voting Day, Exit Polls, and Results Day. Guide users on what they should be doing during these specific phases.

ALWAYS respond in valid JSON with this exact schema:
{
  "intent": "string describing the detected intent",
  "helpful_text": "string with a helpful, concise explanation (max 3 sentences)",
  "recommended_form": "Form 6 | Form 8 | Form 6B | Tracker | null"
}`;

/**
 * Lazily initializes and caches the Gemini GenerativeModel instance.
 * Uses IIFE closure to ensure single instantiation across the module lifecycle.
 *
 * @returns {import('@google/generative-ai').GenerativeModel} Configured Gemini model.
 * @throws {Error} If VITE_GEMINI_API_KEY is not set in environment variables.
 */
const getModel = (() => {
  /** @type {import('@google/generative-ai').GenerativeModel | null} */
  let model = null;

  return () => {
    if (!model) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'VITE_GEMINI_API_KEY is not configured. Add it to your .env file.'
        );
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      });
    }
    return model;
  };
})();

/**
 * Analyzes a voter query using Gemini and returns structured intent data.
 *
 * @param {string} query - The user's natural language question about ECI services.
 * @returns {Promise<{intent: string, helpful_text: string, recommended_form: string|null}>}
 *   Parsed JSON response with detected intent, helpful guidance, and recommended form.
 * @throws {Error} Propagates API or parsing errors to the caller for UI handling.
 *
 * @example
 * const result = await analyzeVoterQuery("I just turned 18 and want to vote");
 * // => { intent: "new_registration", helpful_text: "...", recommended_form: "Form 6" }
 */
export async function analyzeVoterQuery(query) {
  const MAX_RETRIES = 3;
  const model = getModel();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(query);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      const msg = error.message || '';
      const isRetryable = msg.includes('503') || msg.toLowerCase().includes('high demand');

      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(`[Eluide] 503 received (attempt ${attempt}/${MAX_RETRIES}). Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.error('[Eluide] Gemini API error:', error);
      throw new Error(`Failed to analyze query: ${msg}`);
    }
  }
}
