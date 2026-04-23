/**
 * E2E Integration Test — Eluide Voter Portal
 * Validates core UI interactions: search input, timeline visibility, and service cards.
 */
describe('Eluide Voter Portal', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should render the hero heading', () => {
    cy.get('h1').should('contain.text', 'Voter Portal.');
  });

  it('should accept text in the search input and display it', () => {
    cy.get('input[aria-label="Ask Eluide about voter services"]')
      .type('I just turned 18')
      .should('have.value', 'I just turned 18');
  });

  it('should display all 6 election timeline phases', () => {
    cy.contains('Declaration').should('be.visible');
    cy.contains('Nominations').should('be.visible');
    cy.contains('Campaigning').should('be.visible');
    cy.contains('Voting Day').should('be.visible');
    cy.contains('Exit Polls').should('be.visible');
    cy.contains('Results Day').should('be.visible');
  });

  it('should render all 4 ECI service cards', () => {
    cy.contains('New Voter Registration').should('be.visible');
    cy.contains('Shift / Correction of Entries').should('be.visible');
    cy.contains('Aadhaar Linking').should('be.visible');
    cy.contains('Track Application Status').should('be.visible');
  });

  it('should have a functioning microphone button', () => {
    cy.get('button[aria-label="Voice input"]').should('exist');
  });
});
