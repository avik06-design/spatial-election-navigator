import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, Calendar, FileText, Megaphone, CheckSquare, BarChart, Trophy, Mic } from 'lucide-react';
import DOMPurify from 'dompurify';
const ServiceGrid = React.lazy(() => import('./components/ServiceGrid'));
import { analyzeVoterQuery } from './services/geminiService';
import { generateGoogleCalendarLink } from './utils/calendarService';

/**
 * Simplified ECI knowledge base mapping service IDs to their
 * official form details, eligibility criteria, and required documents.
 * @constant {Record<string, {title: string, form: string, criteria: string, docs: string[]}>}
 */
const eciData = {
  registration: {
    title: 'New Voter Registration',
    form: 'Form 6',
    criteria: 'Indian citizen who has turned 18 years of age on or before the qualifying date (1st January of the year).',
    docs: [
      'Proof of Age — Passport, Birth Certificate, or Class 10 marksheet',
      'Proof of Address — Aadhaar Card, Utility Bill, Bank Passbook, or Rent Agreement',
      'Recent passport-size colour photograph',
    ],
  },
  correction: {
    title: 'Shift / Correction of Entries',
    form: 'Form 8',
    criteria: 'Existing voter who has shifted residence to a new constituency, needs to correct name/DOB/photo errors, or requires a replacement EPIC card.',
    docs: [
      'Proof of new residential address (if shifting)',
      'Supporting document showing the correct name, date of birth, or other detail',
      'Existing EPIC (Voter ID) number for reference',
    ],
  },
  aadhaar: {
    title: 'Aadhaar Linking',
    form: 'Form 6B',
    criteria: 'Existing registered voter who wishes to voluntarily link their Aadhaar number for biometric authentication and de-duplication.',
    docs: [
      'Aadhaar Card number (12-digit UID)',
      'EPIC (Voter ID) number',
    ],
  },
  tracker: {
    title: 'Track Application Status',
    form: 'Reference ID Lookup',
    criteria: 'Any applicant who has submitted Form 6, 6B, 7, or 8 online and received a Reference ID upon submission.',
    docs: [
      'Reference ID generated after form submission',
    ],
  },
};

/**
 * Timeline phases of an Indian general election.
 * Each phase includes an icon, title, description, and recommended citizen action.
 * @constant {Array<{id: string, icon: import('lucide-react').LucideIcon, title: string, desc: string, action: string}>}
 */
const timelinePhases = [
  { id: 'declaration', icon: Calendar, title: 'Declaration', desc: 'ECI announces election dates and Model Code of Conduct begins.', action: 'Verify your name is on the electoral roll.' },
  { id: 'nominations', icon: FileText, title: 'Nominations', desc: 'Candidates file their official papers to contest.', action: 'Research candidates in your constituency.' },
  { id: 'campaigning', icon: Megaphone, title: 'Campaigning', desc: 'Parties hold rallies and distribute manifestos.', action: 'Read manifestos and attend local debates.' },
  { id: 'voting', icon: CheckSquare, title: 'Voting Day', desc: 'Citizens cast their votes via EVMs at polling booths.', action: 'Bring your EPIC or valid ID to the booth and vote.' },
  { id: 'exitpolls', icon: BarChart, title: 'Exit Polls', desc: 'Agencies predict results immediately after voting ends.', action: 'Stay informed, but wait for official results.' },
  { id: 'results', icon: Trophy, title: 'Results Day', desc: 'EVMs are counted and winners are officially declared.', action: 'Watch the live counting on the ECI portal.' }
];

/**
 * @typedef {Object} EluideResponse
 * @property {string} intent - Detected user intent.
 * @property {string} helpful_text - AI-generated guidance text.
 * @property {string|null} recommended_form - Recommended ECI form or null.
 */

/**
 * App — Root layout component for the ECI Voter Portal.
 *
 * Architecture:
 * - Apple-inspired minimalist design on pitch-black background.
 * - Centered hero typography with glassmorphic search bar and service grid.
 * - Slide-in detail panel triggered by service card clicks or Gemini responses.
 * - Full semantic HTML and ARIA compliance for WCAG 2.1 AA.
 *
 * @returns {JSX.Element} The complete application shell.
 */
export default function App() {
  const [query, setQuery] = useState('');
  const [activeService, setActiveService] = useState(null);
  const [novaResponse, setNovaResponse] = useState(/** @type {EluideResponse|null} */ (null));
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const panelRef = useRef(null);

  /**
   * Focus trap — prevents Tab from escaping the detail modal while it is open.
   * Traps focus within the panel by intercepting Tab/Shift+Tab on the boundary elements.
   */
  useEffect(() => {
    if (!activeService || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === 'Escape') handleClose();
    };
    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [activeService]);

  /**
   * Activates the Web Speech API to capture voice input.
   * Sets the recognized transcript into the search query state.
   */
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, []);

  /**
   * Handles search form submission. Sends the query to Gemini for analysis
   * and displays the structured response in the detail panel.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setActiveService('eluide');
    try {
      const response = await analyzeVoterQuery(trimmed);
      setNovaResponse(response);
    } catch {
      setNovaResponse({
        intent: 'error',
        helpful_text: 'Eluide is temporarily unavailable. Please try again or select a service below.',
        recommended_form: null,
      });
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  }, [query]);

  /**
   * Handles service card click from ServiceGrid.
   * Opens the detail panel with service-specific context.
   *
   * @param {string} serviceId - The clicked service identifier.
   */
  const handleServiceClick = useCallback((serviceId) => {
    setActiveService(serviceId);
    setNovaResponse(null);
  }, []);

  /**
   * Closes the detail panel and resets state.
   */
  const handleClose = useCallback(() => {
    setActiveService(null);
    setNovaResponse(null);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#000000] overflow-hidden">
      {/* Skip Navigation Link — WCAG 2.1 AA */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Screen-reader accessible description of the spatial interface */}
      <div className="sr-only" role="region" aria-label="Interactive 3D Election Hub Navigation">
        This application provides an interactive election information hub. Use the search bar to ask Eluide for voter guidance, browse the election timeline phases, or select a service card to access ECI forms and resources.
      </div>

      {/* ─── Main Content ─── */}
      <main
        id="main-content"
        role="main"
        className="relative z-10 w-full h-full overflow-y-auto flex flex-col items-center px-6 py-16 md:py-24"
      >
        {/* Hero Section */}
        <section aria-labelledby="hero-heading" className="w-full max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 100 }}
            className="text-center"
          >
            <p className="text-blue-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">
              Election Assistant
            </p>
            <h1
              id="hero-heading"
              className="text-white text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-6"
            >
              Voter Portal.
            </h1>
            <p className="text-white/40 text-lg md:text-xl font-light tracking-tight max-w-md mx-auto">
              Powered by Eluide — your AI-guided gateway to every ECI service.
            </p>
          </motion.div>
        </section>

        {/* Search Bar */}
        <section aria-label="Ask Eluide" className="w-full max-w-2xl mx-auto mb-16">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.15 }}
            className="relative flex items-center bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl transition-all duration-300 focus-within:border-white/25 focus-within:bg-white/[0.06]"
          >
            <Sparkles
              size={18}
              className="ml-4 text-white/20 flex-shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="eluide-search" className="sr-only">
              Ask Eluide about ECI voter services
            </label>
            <input
              id="eluide-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Eluide — &quot;I just turned 18&quot;, &quot;I moved cities&quot;..."
              aria-label="Ask Eluide about voter services"
              autoComplete="off"
              className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-white/30 text-base font-light tracking-tight"
            />
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Submit query to Eluide"
              aria-expanded={activeService === 'eluide'}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none flex-shrink-0"
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleVoiceInput}
              aria-label="Voice input"
              className={`p-3 ml-1 rounded-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none flex-shrink-0 ${
                isListening
                  ? 'bg-red-500/30 text-red-400 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Mic size={20} aria-hidden="true" />
            </button>
          </motion.form>
        </section>

        {/* Election Timeline */}
        <section aria-label="Election phase timeline" className="w-full max-w-4xl mx-auto mt-4 mb-8 relative">
          {/* The connecting horizontal line */}
          <div className="absolute top-6 left-0 w-full h-[2px] bg-white/10 z-0" aria-hidden="true"></div>

          <div className="flex justify-between items-start relative z-10 w-full px-4">
            {timelinePhases.map((phase) => {
              const Icon = phase.icon;
              return (
                <div
                  key={phase.id}
                  className="flex flex-col items-center relative group cursor-pointer"
                  onMouseEnter={() => setHoveredPhase(phase.id)}
                  onMouseLeave={() => setHoveredPhase(null)}
                >
                  {/* The Timeline Node */}
                  <div className="w-12 h-12 rounded-full bg-[#05070a] border border-white/20 flex items-center justify-center transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] z-10">
                    <Icon size={20} className="text-white/70 group-hover:text-blue-400 transition-colors" aria-hidden="true" />
                  </div>
                  {/* Phase Title */}
                  <span className="text-white/60 text-xs font-medium mt-3 tracking-wide">{phase.title}</span>

                  {/* Hover Pop-up Card */}
                  <AnimatePresence>
                    {hoveredPhase === phase.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-4 w-64 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 shadow-2xl z-50 pointer-events-none"
                      >
                        <h4 className="text-white font-bold text-sm mb-2">{phase.title}</h4>
                        <p className="text-white/70 text-xs leading-relaxed mb-3">{phase.desc}</p>
                        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                          <span className="block text-blue-400 text-[10px] uppercase font-bold tracking-wider mb-1">Your Action</span>
                          <p className="text-white/90 text-xs">{phase.action}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Google Calendar CTA */}
        <div className="w-full max-w-4xl mx-auto mb-8 flex justify-center">
          <a
            href={generateGoogleCalendarLink(
              'General Election 2026 — Voting Day',
              'Remember to bring your EPIC (Voter ID) card and a valid photo ID. Polls open 7 AM — 6 PM. Find your booth at voters.eci.gov.in',
              '20260501'
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Add Election Day to Google Calendar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl text-white/80 text-sm font-medium tracking-wide hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all duration-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
          >
            <Calendar size={16} aria-hidden="true" />
            Add Election Day to Google Calendar
          </a>
        </div>

        {/* Service Grid */}
        <section
          aria-label="Voter services"
          className="w-full max-w-3xl mx-auto"
        >
          <Suspense fallback={<div className="text-white/50 text-sm">Loading visual engine...</div>}>
            <ServiceGrid onServiceClick={handleServiceClick} />
          </Suspense>
        </section>
      </main>

      {/* ─── Detail Panel Overlay ─── */}
      <AnimatePresence>
        {activeService && (
          <motion.aside
            key="detail-panel"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeService} details panel`}
            className="absolute z-50 bg-black/40 backdrop-blur-3xl p-8 shadow-2xl overflow-y-auto border-white/10 bottom-0 w-full h-[85vh] rounded-t-3xl border-t md:top-0 md:right-0 md:w-[450px] md:h-full md:border-t-0 md:border-l md:rounded-none"
            ref={panelRef}
          >
            <div className="p-8 md:p-10 flex flex-col min-h-full">
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-white text-2xl font-bold tracking-tight capitalize">
                  {activeService === 'eluide' ? 'Eluide Response' : (eciData[activeService]?.title ?? activeService)}
                </h2>
                <button
                  onClick={handleClose}
                  aria-label="Close detail panel"
                  className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 space-y-6">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-white/30">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    >
                      <Sparkles size={16} aria-hidden="true" />
                    </motion.div>
                    <span className="text-sm font-light">Eluide is thinking...</span>
                  </div>
                ) : novaResponse ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="space-y-6"
                    aria-live="polite"
                    role="log"
                  >
                    {/* Intent Badge */}
                    <span className="inline-block text-xs font-medium tracking-wider uppercase text-blue-400/80 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                      {novaResponse.intent}
                    </span>

                    {/* Response Text — sanitized via DOMPurify */}
                    <div
                      className="text-white/70 text-base leading-relaxed font-light"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(novaResponse.helpful_text) }}
                    />

                    {/* Recommended Form CTA */}
                    {novaResponse.recommended_form && (
                      <button
                        onClick={() => window.open('https://voters.eci.gov.in/', '_blank', 'noopener,noreferrer')}
                        className="w-full py-4 bg-white/[0.05] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-medium tracking-tight transition-all duration-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
                        aria-label={`Open ${novaResponse.recommended_form} on ECI portal`}
                      >
                        Open {novaResponse.recommended_form} →
                      </button>
                    )}
                  </motion.div>
                ) : eciData[activeService] ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="space-y-6"
                  >
                    {/* Form Badge */}
                    <span className="inline-block text-xs font-semibold tracking-wider uppercase text-blue-400/80 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                      {eciData[activeService].form}
                    </span>

                    {/* Criteria Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                      <h3 className="text-white/50 text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                        Who is this for?
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed font-light">
                        {eciData[activeService].criteria}
                      </p>
                    </div>

                    {/* Required Documents Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                      <h3 className="text-white/50 text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                        Required Documents
                      </h3>
                      <ul className="space-y-3">
                        {eciData[activeService].docs.map((doc, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" aria-hidden="true" />
                            <span className="text-white/80 text-sm leading-relaxed font-light">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => window.open('https://voters.eci.gov.in/', '_blank', 'noopener,noreferrer')}
                      className="w-full py-4 bg-white/[0.05] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-medium tracking-tight transition-all duration-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
                      aria-label={`Begin ${eciData[activeService].title} on ECI portal`}
                    >
                      Begin {eciData[activeService].title} →
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="space-y-4"
                  >
                    <p className="text-white/50 text-base leading-relaxed font-light">
                      This service module is ready. Ask Eluide for guidance.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
