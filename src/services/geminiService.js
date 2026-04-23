import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates the system instruction for Eluide with optional user context.
 * Enables contextual decision-making based on the user's region or situation.
 *
 * @param {string} [userContext] - Optional regional context (e.g., 'Maharashtra', 'first-time voter').
 * @returns {string} The complete system instruction string.
 */
function buildSystemInstruction(userContext) {
  const contextLine = userContext
    ? `\nThe user is asking about elections in the context of: ${userContext}. Tailor deadlines, rules, and regional guidance accordingly.`
    : '';

  return `You are Eluide, an expert AI assistant for Indian citizens navigating the Election Commission of India (ECI) portal.${contextLine}

Your role:
- If a user says "I turned 18" or "I want to register", suggest Form 6 (New Voter Registration).
- If a user says "I moved to a new city" or "my address changed", suggest Form 8 (Shift/Correction of Entries).
- If a user says "link Aadhaar" or "Aadhaar linking", suggest Form 6B (Aadhaar Linking).
- If a user asks "track my application" or "application status", suggest the Application Tracker.
- For anything else, provide helpful, concise guidance about Indian voting rights and procedures.

You must also be able to explain the 6 timeline phases of an election: Declaration, Nominations, Campaigning, Voting Day, Exit Polls, and Results Day. Guide users on what they should be doing during these specific phases.

If the user asks 'where' to vote or requests a physical location, instruct them to search and provide this exact Google Maps URL structure: https://www.google.com/maps/search/?api=1&query=polling+booth+[Their_City].

ALWAYS respond in valid JSON with this exact schema:
{
  "intent": "string describing the detected intent",
  "helpful_text": "string with a helpful, concise explanation (max 3 sentences)",
  "recommended_form": "Form 6 | Form 8 | Form 6B | Tracker | null",
  "summary": "one-line summary of the guidance",
  "actionSteps": ["step 1", "step 2"],
  "urgency": "high | medium | low"
}

DO NOT use markdown formatting, backticks, or conversational text. Output ONLY the raw, minified JSON object.`;
}

/**
 * Lazily initializes and caches the Gemini GenerativeModel instance.
 * Uses IIFE closure to ensure single instantiation across the module lifecycle.
 * Rebuilds the model if userContext changes.
 *
 * @param {string} [userContext] - Optional regional context for the system instruction.
 * @returns {import('@google/generative-ai').GenerativeModel} Configured Gemini model.
 * @throws {Error} If VITE_GEMINI_API_KEY is not set in environment variables.
 */
const getModel = (() => {
  /** @type {import('@google/generative-ai').GenerativeModel | null} */
  let model = null;
  /** @type {string|undefined} */
  let cachedContext;

  return (userContext) => {
    if (!model || cachedContext !== userContext) {
      cachedContext = userContext;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'VITE_GEMINI_API_KEY is not configured. Add it to your .env file.'
        );
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: buildSystemInstruction(userContext),
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
 * @param {string} [userContext] - Optional regional/situational context.
 * @returns {Promise<{intent: string, helpful_text: string, recommended_form: string|null, summary: string, actionSteps: string[], urgency: string}>}
 *   Parsed JSON response with detected intent, helpful guidance, and recommended form.
 * @throws {Error} Propagates API or parsing errors to the caller for UI handling.
 *
 * @example
 * const result = await analyzeVoterQuery("I just turned 18 and want to vote");
 * // => { intent: "new_registration", helpful_text: "...", recommended_form: "Form 6" }
 */
export async function analyzeVoterQuery(query, userContext) {
  const MAX_RETRIES = 3;
  const model = getModel(userContext);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Sanitize input to prevent basic prompt injection via HTML tags
      const sanitizedPrompt = query.replace(/[<>]/g, '').trim();
      const result = await model.generateContent(sanitizedPrompt);
      const rawText = result.response.text();

      // Strip markdown code blocks that break JSON.parse
      let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      // Extract just the JSON object if surrounded by conversational text
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      let parsedData;
      try {
        parsedData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('[Eluide] Failed to parse cleaned JSON:', cleanText);
        // Fallback structure to prevent UI crash
        parsedData = {
          intent: 'parse_error',
          helpful_text: rawText.substring(0, 200),
          recommended_form: null,
          summary: 'I found the information, but the data format was interrupted. Please try asking again.',
          actionSteps: ['Refresh the page', 'Try a shorter query'],
          urgency: 'medium',
        };
      }
      return parsedData;
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
