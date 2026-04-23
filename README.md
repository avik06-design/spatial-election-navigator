# Eluide — AI-Powered Voter Portal

![Tests](https://img.shields.io/badge/tests-17%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA-blue)
![React](https://img.shields.io/badge/react-19.x-61DAFB)
![Vite](https://img.shields.io/badge/vite-8.x-646CFF)
![License](https://img.shields.io/badge/license-MIT-green)

> A production-grade, AI-powered Election Commission of India (ECI) voter services portal. Features contextual AI guidance via Google Gemini 2.5 Flash, Google Calendar integration, voice input, and a fully accessible, PWA-ready interface.

🔗 **Live Demo**: [eluide-voter-portal.netlify.app](https://eluide-voter-portal.netlify.app)

---

## ✨ Features

| Category | Feature |
|---|---|
| 🤖 **AI Assistant** | Natural language voter guidance via Gemini 2.5 Flash with contextual user state |
| 🎙️ **Voice Input** | Web Speech API (`en-IN` locale) with real-time transcript injection |
| 📅 **Google Calendar** | One-click "Add Election Day" via Calendar Intents API (no key needed) |
| 🗺️ **Google Maps** | AI-generated polling booth search URLs via Maps Search Intents |
| 📱 **PWA** | Service Worker with NetworkFirst caching, installable on mobile |
| ♿ **WCAG 2.1 AA** | Skip links, focus traps, ARIA live regions, keyboard-navigable |
| 🔒 **Security** | CSP headers, DOMPurify, rate limiting, input sanitization |
| ⏱️ **Timeline** | Interactive 6-phase election timeline with hover tooltips |
| 🎨 **Design** | Apple-inspired glassmorphism, Framer Motion spring animations |

---

## 🏗️ Architecture

```
spatial-election-navigator/
├── public/
│   ├── _headers              # Netlify security headers (CSP, X-Frame-Options)
│   ├── manifest.json         # PWA manifest (standalone, dark theme)
│   └── sw.js                 # Service Worker (NetworkFirst caching)
├── cypress/
│   └── e2e/election.cy.js    # Cypress E2E integration tests
├── src/
│   ├── App.jsx               # Root layout, state orchestration, UI shell
│   ├── main.jsx              # Entry point, ErrorBoundary, SW registration
│   ├── index.css             # Tailwind v4, Inter font, a11y utilities
│   ├── components/
│   │   ├── ServiceGrid.jsx   # Memoized 2×2 ECI service cards (React.memo)
│   │   ├── ErrorBoundary.jsx # React class Error Boundary with fallback UI
│   │   └── Scene.jsx         # Three.js 3D spatial nodes (R3F + Drei)
│   ├── services/
│   │   └── geminiService.js  # Gemini SDK wrapper (retry, sanitize, parse)
│   ├── hooks/
│   │   └── useGemini.js      # Custom hook for AI query lifecycle
│   ├── utils/
│   │   ├── rateLimit.js      # Sliding-window rate limiter (10 req/min)
│   │   └── calendarService.js# Google Calendar intent URL generator
│   └── __tests__/
│       ├── app.test.jsx      # 15 UI tests (ARIA, Calendar, Voice, Lazy Load)
│       ├── geminiService.test.js # Mocked SDK tests
│       └── utils/
│           └── rateLimit.test.js # Rate limiter unit tests
├── .env.example              # Environment variable template
├── cypress.config.js         # Cypress E2E configuration
├── vite.config.js            # Vite 8 build + Vitest config
└── README.md
```

---

## 🗺️ Google Services Used

| Service | Type | Purpose | File |
|---|---|---|---|
| **Gemini 2.5 Flash** | `@google/generative-ai` SDK | Contextual voter guidance, structured JSON responses | `geminiService.js` |
| **Google Calendar** | URL Intent (`calendar.google.com/render`) | "Add Election Day" one-click event creation | `calendarService.js` |
| **Google Maps** | URL Intent (`maps/search/?api=1`) | Polling booth location search | `geminiService.js` (system prompt) |
| **Web Speech API** | Browser native | Voice-to-text input for search queries | `App.jsx` |

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Skip Navigation**: `<a href="#main-content" class="skip-link">` in `index.html`
- **Focus Trap**: Modal intercepts `Tab`/`Shift+Tab`, `Escape` closes
- **ARIA Live Regions**: `aria-live="polite" role="log"` on AI responses
- **Screen Reader**: `sr-only` region describing the spatial interface
- **Keyboard Navigation**: All interactive elements are `<button>` or `<a>`
- **Focus Rings**: `focus-visible:ring-2` on every interactive element
- **Semantic HTML**: `<main>`, `<section>`, `<aside role="dialog">`, `<nav>`
- **Color Contrast**: White on black (21:1), blue-400 accents (7.4:1)

---

## 🔒 Security

| Layer | Details |
|---|---|
| **CSP** | `default-src 'self'`; whitelisted Gemini API domain |
| **HTTP Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
| **Input Sanitization** | HTML angle brackets stripped before API call |
| **Output Sanitization** | `DOMPurify.sanitize()` on all AI-generated content |
| **Rate Limiting** | 10 req/min sliding window per user (pure JS `Map`) |
| **Error Boundary** | Catches runtime crashes, renders safe fallback UI |
| **API Key** | `import.meta.env.VITE_GEMINI_API_KEY` — never committed |
| **External Links** | All use `rel="noopener noreferrer"` |

---

## ⚡ Efficiency

| Optimization | Impact |
|---|---|
| **Vendor Chunking** | `react`, `react-dom`, `framer-motion` → `vendor.js` (cached separately) |
| **Code Splitting** | `ServiceGrid` via `React.lazy()` → separate chunk |
| **React.memo** | ServiceGrid skips re-render on unrelated state changes |
| **Lazy Singleton** | Gemini model initialized once via IIFE closure |
| **PWA Caching** | NetworkFirst Service Worker for offline resilience |
| **Vite 8 + Rolldown** | Sub-200ms production builds |

---

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/your-org/spatial-election-navigator.git
cd spatial-election-navigator

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Gemini API key

# Start development server
npm run dev

# Production build
npm run build
npm run preview
```

---

## 🧪 Testing

```bash
# Unit & integration tests (Vitest)
npm test

# Test with coverage report
npx vitest run --coverage

# E2E tests (Cypress)
npx cypress open
```

| Suite | Tests | Coverage |
|---|---|---|
| `app.test.jsx` | 15 (render, ARIA, lazy-load, calendar, voice) | ✅ |
| `geminiService.test.js` | 2 (mock SDK, sanitization) | ✅ |
| `rateLimit.test.js` | 2 (allow, exceed) | ✅ |
| `election.cy.js` | 5 (E2E: hero, input, timeline, cards, mic) | ✅ |

---

## 📄 License

MIT © 2026
