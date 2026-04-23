import { useState, useCallback } from 'react';
import { analyzeVoterQuery } from '../services/geminiService';
import { checkRateLimit } from '../utils/rateLimit';

/**
 * @typedef {Object} GeminiMessage
 * @property {'user'|'assistant'|'error'} role - Message sender role.
 * @property {string} content - Message text content.
 * @property {Object|null} structured - Parsed structured response from Gemini.
 */

/**
 * @typedef {Object} UseGeminiReturn
 * @property {GeminiMessage[]} messages - Conversation history.
 * @property {boolean} isLoading - Whether a request is in flight.
 * @property {string|null} error - Latest error message, if any.
 * @property {(query: string, userContext?: string) => Promise<void>} sendMessage - Send a query to Gemini.
 * @property {() => void} clearMessages - Reset conversation history.
 */

/**
 * Custom hook encapsulating the Gemini AI query lifecycle.
 * Manages conversation history, loading state, rate limiting, and error handling.
 *
 * @returns {UseGeminiReturn}
 *
 * @example
 * const { messages, isLoading, error, sendMessage } = useGemini();
 * await sendMessage("I just turned 18", "Maharashtra");
 */
export function useGemini() {
  /** @type {[GeminiMessage[], Function]} */
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sends a user query to the Gemini API with optional context.
   *
   * @param {string} query - The user's natural language question.
   * @param {string} [userContext] - Optional regional/contextual modifier (e.g., state name).
   */
  const sendMessage = useCallback(async (query, userContext) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    // Add user message to history
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, structured: null }]);

    try {
      checkRateLimit('default-user');
      const response = await analyzeVoterQuery(trimmed, userContext);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.helpful_text || response.summary || '',
          structured: response,
        },
      ]);
    } catch (err) {
      const errMsg = err.message || 'An unexpected error occurred.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: errMsg, structured: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Clears conversation history and error state. */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
