export interface TrackingData {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrerUrl: string | null;
  landingPage: string;
  pagesViewed: number;
  pagesVisited: string[];
  timeOnSite: number;
  sessionCount: number;
  firstVisitDate: string | null;
  usedCalculator: boolean;
  calculatorData: Record<string, unknown> | null;
  currentPageUrl: string;
  currentPageTitle: string;
  deviceType: "mobile" | "desktop";
  userLanguage: string;
}

export function collectTrackingData(): TrackingData {
  const ss = (key: string) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  };
  const ls = (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };

  const sessionStart = parseInt(ss("session_start") || "0", 10);
  const timeOnSite = sessionStart ? Math.round((Date.now() - sessionStart) / 1000) : 0;

  let pagesVisited: string[] = [];
  try {
    pagesVisited = JSON.parse(ss("pages_visited") || "[]");
  } catch {
    pagesVisited = [];
  }

  let calculatorData: Record<string, unknown> | null = null;
  try {
    const raw = ss("calculator_data");
    if (raw) calculatorData = JSON.parse(raw);
  } catch {
    calculatorData = null;
  }

  return {
    utmSource: ss("utm_source"),
    utmMedium: ss("utm_medium"),
    utmCampaign: ss("utm_campaign"),
    utmTerm: ss("utm_term"),
    utmContent: ss("utm_content"),
    referrerUrl: ss("referrer_url") || ss("referrer") || (document.referrer || null),
    landingPage: ss("landing_page") || window.location.href,
    pagesViewed: parseInt(ss("pages_viewed") || "1", 10),
    pagesVisited,
    timeOnSite,
    sessionCount: parseInt(ls("session_count") || "1", 10),
    firstVisitDate: ls("first_visit_date"),
    usedCalculator: ss("used_calculator") === "true",
    calculatorData,
    currentPageUrl: window.location.href,
    currentPageTitle: document.title,
    deviceType: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
    userLanguage: navigator.language,
  };
}
