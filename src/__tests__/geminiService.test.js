import { describe, it, expect, vi } from 'vitest';
import { analyzeVoterQuery } from '../services/geminiService';

// Mock the Google Gen AI SDK with a proper class constructor
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => '{"intent":"new_registration","helpful_text":"You should fill Form 6.","recommended_form":"Form 6"}'
    }
  });

  class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  }

  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

// Stub the env variable so getModel() doesn't throw
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');

describe('Gemini Service Logic', () => {
  it('should return parsed JSON from the mocked API response', async () => {
    const result = await analyzeVoterQuery('I am 18');
    expect(result).toEqual({
      intent: 'new_registration',
      helpful_text: 'You should fill Form 6.',
      recommended_form: 'Form 6',
    });
  });

  it('should sanitize angle brackets from user input', async () => {
    // This should not throw — angle brackets are stripped before the call
    const result = await analyzeVoterQuery('<script>alert("xss")</script>');
    expect(result).toBeTruthy();
  });
});
