/**
 * @module calendarService
 * Generates Google Calendar event links using the Calendar Intents API.
 * No API key or OAuth required — uses URL-based intent rendering.
 */

/**
 * Generates a Google Calendar "Add Event" URL with pre-filled details.
 *
 * @param {string} title - The event title (e.g., "General Election 2026 — Voting Day").
 * @param {string} details - Description body with instructions or reminders.
 * @param {string} date - Date in YYYYMMDD format (e.g., "20260501").
 * @returns {string} A fully formed Google Calendar intent URL.
 *
 * @example
 * const url = generateGoogleCalendarLink(
 *   "General Election 2026",
 *   "Remember to bring your EPIC card",
 *   "20260501"
 * );
 * // => "https://calendar.google.com/calendar/render?action=TEMPLATE&text=..."
 */
export function generateGoogleCalendarLink(title, details, date) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    dates: `${date}/${date}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
