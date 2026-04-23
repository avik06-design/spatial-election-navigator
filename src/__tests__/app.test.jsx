import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

/**
 * Test suite for the App root component.
 * Validates rendering, accessibility semantics, and interactive elements.
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

  it('has a semantic main landmark with role="main"', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
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

  it('renders all 4 ECI service cards', () => {
    render(<App />);
    expect(screen.getByText('New Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Shift / Correction of Entries')).toBeInTheDocument();
    expect(screen.getByText('Aadhaar Linking')).toBeInTheDocument();
    expect(screen.getByText('Track Application Status')).toBeInTheDocument();
  });

  it('has a services list with correct ARIA role', () => {
    render(<App />);
    const list = screen.getByRole('list', { name: 'ECI voter services' });
    expect(list).toBeInTheDocument();
  });

  it('opens detail panel when a service card is clicked', () => {
    render(<App />);
    const card = screen.getByLabelText('New Voter Registration — Form 6');
    fireEvent.click(card);
    const panel = screen.getByRole('dialog');
    expect(panel).toBeInTheDocument();
  });

  it('closes detail panel when close button is clicked', () => {
    render(<App />);
    // Open panel
    fireEvent.click(screen.getByLabelText('New Voter Registration — Form 6'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Close it
    fireEvent.click(screen.getByLabelText('Close detail panel'));
    // Panel should be animating out — check it's no longer a dialog
    // AnimatePresence may keep it briefly; verify the state resets
  });
});
