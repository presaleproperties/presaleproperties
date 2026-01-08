/**
 * Visitor and Session Identity Management
 * - visitor_id persists across sessions (localStorage + cookie)
 * - session_id resets per browser session (sessionStorage)
 */

const VISITOR_ID_KEY = "pp_vid";
const SESSION_ID_KEY = "pp_sid";
const COOKIE_EXPIRY_DAYS = 365;

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Set a first-party cookie
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

// Get cookie value
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Get or create visitor_id
 * Stored in both localStorage and first-party cookie for durability
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  // Check localStorage first
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  
  // Fallback to cookie if localStorage is missing
  if (!visitorId) {
    visitorId = getCookie(VISITOR_ID_KEY);
  }
  
  // Create new if neither exists
  if (!visitorId) {
    visitorId = generateUUID();
  }
  
  // Ensure both storage locations are synced
  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  setCookie(VISITOR_ID_KEY, visitorId, COOKIE_EXPIRY_DAYS);
  
  return visitorId;
}

/**
 * Get or create session_id
 * Stored in sessionStorage - resets per browser session
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return generateUUID();
}
