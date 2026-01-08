/**
 * Attribution Tracking
 * - First-touch UTM parameters (stored once, never overwritten)
 * - Last-touch UTM parameters (updated on each visit with UTMs)
 * - gclid and fbclid tracking
 */

const FIRST_UTM_KEY = "pp_first_utm";
const LAST_UTM_KEY = "pp_last_utm";

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  gclid?: string;
  fbclid?: string;
  landing_page_url?: string;
}

interface AttributionData {
  first_utm: UtmParams;
  last_utm: UtmParams;
}

/**
 * Parse UTM parameters from current URL
 */
function parseUtmFromUrl(): UtmParams {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  
  const utm: UtmParams = {};
  
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  const content = params.get('utm_content');
  const term = params.get('utm_term');
  const gclid = params.get('gclid');
  const fbclid = params.get('fbclid');
  
  if (source) utm.source = source;
  if (medium) utm.medium = medium;
  if (campaign) utm.campaign = campaign;
  if (content) utm.content = content;
  if (term) utm.term = term;
  if (gclid) utm.gclid = gclid;
  if (fbclid) utm.fbclid = fbclid;
  
  return utm;
}

/**
 * Check if UTM params object has any values
 */
function hasUtmParams(utm: UtmParams): boolean {
  return !!(utm.source || utm.medium || utm.campaign || utm.content || utm.term || utm.gclid || utm.fbclid);
}

/**
 * Get stored first-touch UTM from localStorage
 */
function getStoredFirstUtm(): UtmParams {
  try {
    const stored = localStorage.getItem(FIRST_UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get stored last-touch UTM from localStorage
 */
function getStoredLastUtm(): UtmParams {
  try {
    const stored = localStorage.getItem(LAST_UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Initialize and update attribution tracking
 * Call this on every page load
 */
export function initAttribution(): void {
  if (typeof window === 'undefined') return;
  
  const currentUtm = parseUtmFromUrl();
  const hasCurrentUtm = hasUtmParams(currentUtm);
  
  // First-touch: only set if not already stored
  const existingFirstUtm = getStoredFirstUtm();
  if (!hasUtmParams(existingFirstUtm)) {
    const firstUtm: UtmParams = {
      ...currentUtm,
      landing_page_url: window.location.href,
    };
    localStorage.setItem(FIRST_UTM_KEY, JSON.stringify(firstUtm));
  }
  
  // Last-touch: update if we have new UTM params
  if (hasCurrentUtm) {
    localStorage.setItem(LAST_UTM_KEY, JSON.stringify(currentUtm));
  }
}

/**
 * Get all attribution data for event payloads
 */
export function getAttributionData(): AttributionData {
  return {
    first_utm: getStoredFirstUtm(),
    last_utm: getStoredLastUtm(),
  };
}

/**
 * Get referrer (stored on first visit)
 */
export function getReferrer(): string {
  if (typeof window === 'undefined') return '';
  
  const REFERRER_KEY = "pp_referrer";
  
  let referrer = sessionStorage.getItem(REFERRER_KEY);
  
  if (!referrer && document.referrer) {
    referrer = document.referrer;
    sessionStorage.setItem(REFERRER_KEY, referrer);
  }
  
  return referrer || '';
}
