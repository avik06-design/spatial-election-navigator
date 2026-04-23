# Eluide — AI-Powered Voter Portal

![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Vite](https://img.shields.io/badge/vite-8.x-646CFF)
![React](https://img.shields.io/badge/react-19.x-61DAFB)

> An enterprise-grade, AI-powered Election Commission of India (ECI) voter services portal. Built with React 19, Vite 8, Framer Motion, and Google Gemini 2.5 Flash.

---

## 🤖 Architecture

```
src/
├── App.jsx                    # Root layout, state management, UI orchestration
├── main.jsx                   # Entry point, ErrorBoundary wrapping, SW registration
├── index.css                  # Tailwind v4 base styles, Inter font, dark theme
├── components/
│   ├── ServiceGrid.jsx        # Memoized 2×2 ECI service card grid (React.memo)
│   ├── ErrorBoundary.jsx      # Class-based React Error Boundary with fallback UI
│   └── Scene.jsx              # Three.js 3D spatial election nodes (R3F + Drei)
├── services/
│   └── geminiService.js       # Gemini 2.5 Flash SDK wrapper with retry & sanitization
├── utils/
│   ├── rateLimit.js           # Sliding-window rate limiter (10 req/min, pure JS)
│   └── calendarService.js     # Google Calendar intent URL generator
└── __tests__/
    ├── app.test.jsx           # 15 unit/integration tests (Vitest + Testing Library)
    └── geminiService.test.js  # Mocked SDK tests for JSON parsing & sanitization
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `React.lazy()` for ServiceGrid | Code-split heavy component; reduces initial bundle by ~3.5 KB |
| `React.memo()` on ServiceGrid | Prevents re-render on every keystroke in the search bar |
| IIFE closure for Gemini model | Lazy singleton — avoids re-instantiation across calls |
| `DOMPurify.sanitize()` on AI output | Prevents XSS from model-generated HTML content |
| `dangerouslySetInnerHTML` (guarded) | Enables rich-text AI responses while maintaining security |

---

## 🗺️ Google Services Used

| Service | Integration Type | File |
|---|---|---|
| **Gemini 2.5 Flash** | `@google/generative-ai` SDK, structured JSON output via `responseMimeType` | `geminiService.js` |
| **Google Calendar Intents** | URL-based `calendar.google.com/render` — no API key needed | `calendarService.js` |
| **Google Maps Search** | URL intent in Gemini system prompt for polling booth lookups | `geminiService.js` |
| **Web Speech API** | `SpeechRecognition` for voice-to-text input (`en-IN` locale) | `App.jsx` |

### Gemini Configuration

```javascript
{
  model: 'gemini-2.5-flash',
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 256,
    responseMimeType: 'application/json',
  }
}
```

Response schema enforced:
```json
{
  "intent": "string",
  "helpful_text": "string",
  "recommended_form": "Form 6 | Form 8 | Form 6B | Tracker | null",
  "summary": "string",
  "actionSteps": ["string"],
  "urgency": "high | medium | low"
}
```

---

## ♿ Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---|---|
| **Skip Navigation** | `<a href="#main-content">` skip link in `index.html` |
| **Semantic HTML** | `<main>`, `<section>`, `<nav>`, `<aside role="dialog">` |
| **ARIA Labels** | Every input, button, and interactive element has `aria-label` |
| **Focus Trap** | Modal traps Tab/Shift+Tab, Escape closes |
| **Focus Visible** | `focus-visible:ring-2` on all interactive elements |
| **Screen Reader Region** | `sr-only` region describing the spatial interface |
| **Live Regions** | `aria-live="polite" role="log"` on AI response container |
| **Keyboard Navigation** | All service cards are `<button>` elements |
| **Color Contrast** | White text on black (21:1 ratio), blue-400 accents |

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Content Security Policy** | `<meta http-equiv="CSP">` in `index.html` + Netlify `_headers` |
| **HTTP Security Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` |
| **Input Sanitization** | `query.replace(/[<>]/g, '')` strips HTML tags before Gemini API call |
| **Output Sanitization** | `DOMPurify.sanitize()` on all AI-generated content |
| **Rate Limiting** | 10 requests/minute sliding window per user ID |
| **API Key Security** | `import.meta.env.VITE_GEMINI_API_KEY` — never hardcoded |
| **External Links** | All `target="_blank"` links use `rel="noopener noreferrer"` |
| **Error Boundary** | Catches runtime crashes; prevents full-app failure |

---

## ⚡ Efficiency

| Optimization | Result |
|---|---|
| **Vendor Chunking** | `react`, `react-dom`, `framer-motion` extracted to `vendor.js` for long-term caching |
| **Code Splitting** | `ServiceGrid` loaded via `React.lazy()` — separate chunk |
| **React.memo** | ServiceGrid skips re-render on unrelated state changes |
| **Lazy Model Init** | Gemini SDK instantiated only on first query (IIFE closure) |
| **PWA** | Service Worker with NetworkFirst caching strategy |
| **Tailwind v4** | `@tailwindcss/vite` plugin — zero PostCSS config, native Vite integration |

### Bundle Analysis

```
dist/index.html                        1.06 kB │ gzip:   0.54 kB
dist/assets/index.css                 29.71 kB │ gzip:   5.70 kB
dist/assets/ServiceGrid.js             3.49 kB │ gzip:   1.66 kB
dist/assets/vendor.js                  ~180 kB │ gzip:  ~58 kB
dist/assets/index.js                  ~200 kB │ gzip:  ~65 kB
```

---

## 🧪 Testing

```bash
npm test          # Run Vitest unit/integration tests
npm run build     # Production build with type checking
```

### Test Coverage

| Suite | Tests | Status |
|---|---|---|
| `app.test.jsx` | 12 tests (render, ARIA, lazy-load, Calendar, Voice) | ✅ |
| `geminiService.test.js` | 2 tests (mock SDK, sanitization) | ✅ |
| `app.test.jsx` — Rate Limiter | 2 tests (allow, exceed) | ✅ |
| `app.test.jsx` — Calendar URL | 1 test (URL structure) | ✅ |
| `cypress/e2e/election.cy.js` | 5 E2E tests (hero, input, timeline, cards, mic) | ✅ |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# Start development server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

---

## 📄 License

MIT © 2026
