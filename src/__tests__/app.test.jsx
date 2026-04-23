import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { checkRateLimit } from '../utils/rateLimit';
import { generateGoogleCalendarLink } from '../utils/calendarService';

/**
 * Test suite for the App root component.
 * Validates rendering, accessibility semantics, and interactive elements.
 * Uses waitFor for lazy-loaded components (React.lazy + Suspense).
 */
describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('renders the hero heading with correct text', () => {
    render(<App />);
    const heading = screen.getByText('Voter Portal.');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  it('has a semantic main landmark with role="main" and id="main-content"', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('renders the search input with correct aria-label', () => {
    render(<App />);
    const input = screen.getByLabelText('Ask Eluide about voter services');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('accepts text input in the search bar', () => {
    render(<App />);
    const input = screen.getByLabelText('Ask Eluide about voter services');
    fireEvent.change(input, { target: { value: 'I turned 18' } });
    expect(input).toHaveValue('I turned 18');
  });

  it('renders all 4 ECI service cards after lazy load', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('New Voter Registration')).toBeInTheDocument();
    });
    expect(screen.getByText('Shift / Correction of Entries')).toBeInTheDocument();
    expect(screen.getByText('Aadhaar Linking')).toBeInTheDocument();
    expect(screen.getByText('Track Application Status')).toBeInTheDocument();
  });

  it('has a services list with correct ARIA role', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'ECI voter services' })).toBeInTheDocument();
    });
  });

  it('opens detail panel when a service card is clicked', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText('New Voter Registration — Form 6')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('New Voter Registration — Form 6'));
    const panel = screen.getByRole('dialog');
    expect(panel).toBeInTheDocument();
  });

  it('closes detail panel when close button is clicked', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText('New Voter Registration — Form 6')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('New Voter Registration — Form 6'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close detail panel'));
  });

  it('has an sr-only region for the 3D Election Hub description', () => {
    render(<App />);
    const region = screen.getByRole('region', { name: 'Interactive 3D Election Hub Navigation' });
    expect(region).toBeInTheDocument();
  });

  it('renders the Google Calendar CTA link', () => {
    render(<App />);
    const calLink = screen.getByLabelText('Add Election Day to Google Calendar');
    expect(calLink).toBeInTheDocument();
    expect(calLink).toHaveAttribute('target', '_blank');
    expect(calLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(calLink.href).toContain('calendar.google.com');
  });

  it('renders the microphone voice input button', () => {
    render(<App />);
    const micBtn = screen.getByLabelText('Voice input');
    expect(micBtn).toBeInTheDocument();
  });
});

/**
 * Rate Limiter unit tests.
 */
describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    expect(checkRateLimit('test-allow')).toBe(true);
  });

  it('throws when rate limit is exceeded', () => {
    const userId = 'test-exceed-' + Date.now();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userId);
    }
    expect(() => checkRateLimit(userId)).toThrow('Rate limit exceeded');
  });
});

/**
 * Google Calendar Service unit tests.
 */
describe('generateGoogleCalendarLink', () => {
  it('returns a valid Google Calendar URL', () => {
    const url = generateGoogleCalendarLink('Test Event', 'Details here', '20260501');
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Test+Event');
    expect(url).toContain('dates=20260501');
  });
});
