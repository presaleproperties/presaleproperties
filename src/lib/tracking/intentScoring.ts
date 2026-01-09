/**
 * Intent Scoring System
 * Tracks and persists user intent based on behavioral events
 * Provides behavior summary for Zapier/CRM integration
 */

const INTENT_DATA_KEY = "pp_intent_data";
const LAST_SEEN_KEY = "pp_last_seen";
const PROJECT_VIEWS_KEY = "pp_project_views";
const CITY_INTEREST_KEY = "pp_city_interest";
const FAVORITES_KEY = "pp_favorites";
const DOWNLOADS_KEY = "pp_downloads";
const VISIT_COUNT_KEY = "pp_visit_count";
const USER_TYPE_KEY = "pp_user_type";

// Intent score increments
const INTENT_SCORES = {
  property_view: 1,
  floorplan_view: 3,
  favorite_add: 5,
  floorplan_download: 8,
  return_visit: 4,
  form_submit: 20,
  city_cta_click: 3,
} as const;

export interface IntentData {
  intent_score: number;
  last_updated: string;
  is_realtor: boolean;
}

export interface ProjectViewRecord {
  project_id: string;
  project_name: string;
  view_count: number;
  last_viewed: string;
}

export interface BehaviorSummary {
  intent_score: number;
  top_viewed_projects: { project_id: string; project_name: string; views: number }[];
  favorited_projects: string[];
  downloaded_assets: string[];
  city_interest: string[];
  first_utm: Record<string, string>;
  last_utm: Record<string, string>;
  last_page_viewed: string;
  visit_count: number;
  user_type: "buyer" | "investor" | "realtor" | null;
  is_return_visitor: boolean;
}

/**
 * Get intent data from localStorage
 */
function getIntentData(): IntentData {
  try {
    const stored = localStorage.getItem(INTENT_DATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading intent data:", e);
  }
  return { intent_score: 0, last_updated: new Date().toISOString(), is_realtor: false };
}

/**
 * Save intent data to localStorage
 */
function saveIntentData(data: IntentData): void {
  try {
    localStorage.setItem(INTENT_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving intent data:", e);
  }
}

/**
 * Get current intent score
 */
export function getIntentScore(): number {
  return getIntentData().intent_score;
}

/**
 * Check if visitor is tagged as realtor
 */
export function isRealtorVisitor(): boolean {
  return getIntentData().is_realtor;
}

/**
 * Tag visitor as realtor (suppresses intent scoring)
 */
export function tagAsRealtor(): void {
  const data = getIntentData();
  data.is_realtor = true;
  saveIntentData(data);
  localStorage.setItem(USER_TYPE_KEY, "realtor");
}

/**
 * Increment intent score for an event
 * Realtors do not accumulate intent score
 */
export function incrementIntentScore(
  eventType: keyof typeof INTENT_SCORES
): number {
  const data = getIntentData();
  
  // Realtors don't accumulate intent score
  if (data.is_realtor) {
    return data.intent_score;
  }
  
  const increment = INTENT_SCORES[eventType] || 0;
  data.intent_score += increment;
  data.last_updated = new Date().toISOString();
  saveIntentData(data);
  
  return data.intent_score;
}

/**
 * Reset intent score (e.g., when a new lead is created)
 */
export function resetIntentScore(): void {
  const data = getIntentData();
  data.intent_score = 0;
  data.last_updated = new Date().toISOString();
  saveIntentData(data);
}

/**
 * Track project view and return view count for this project
 */
export function trackProjectView(projectId: string, projectName: string): number {
  try {
    const stored = localStorage.getItem(PROJECT_VIEWS_KEY);
    const views: Record<string, ProjectViewRecord> = stored ? JSON.parse(stored) : {};
    
    if (views[projectId]) {
      views[projectId].view_count += 1;
      views[projectId].last_viewed = new Date().toISOString();
    } else {
      views[projectId] = {
        project_id: projectId,
        project_name: projectName,
        view_count: 1,
        last_viewed: new Date().toISOString(),
      };
    }
    
    localStorage.setItem(PROJECT_VIEWS_KEY, JSON.stringify(views));
    
    // Increment intent score
    incrementIntentScore("property_view");
    
    return views[projectId].view_count;
  } catch (e) {
    console.error("Error tracking project view:", e);
    return 1;
  }
}

/**
 * Get view count for a specific project
 */
export function getProjectViewCount(projectId: string): number {
  try {
    const stored = localStorage.getItem(PROJECT_VIEWS_KEY);
    if (!stored) return 0;
    const views: Record<string, ProjectViewRecord> = JSON.parse(stored);
    return views[projectId]?.view_count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get top viewed projects (max 3)
 */
export function getTopViewedProjects(): { project_id: string; project_name: string; views: number }[] {
  try {
    const stored = localStorage.getItem(PROJECT_VIEWS_KEY);
    if (!stored) return [];
    const views: Record<string, ProjectViewRecord> = JSON.parse(stored);
    
    return Object.values(views)
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 3)
      .map((v) => ({
        project_id: v.project_id,
        project_name: v.project_name,
        views: v.view_count,
      }));
  } catch {
    return [];
  }
}

/**
 * Add city interest
 */
export function addCityInterest(city: string): void {
  try {
    const stored = localStorage.getItem(CITY_INTEREST_KEY);
    const cities: string[] = stored ? JSON.parse(stored) : [];
    
    if (!cities.includes(city)) {
      cities.push(city);
      localStorage.setItem(CITY_INTEREST_KEY, JSON.stringify(cities));
    }
  } catch (e) {
    console.error("Error adding city interest:", e);
  }
}

/**
 * Get all city interests
 */
export function getCityInterests(): string[] {
  try {
    const stored = localStorage.getItem(CITY_INTEREST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Track favorite add
 */
export function trackFavorite(projectId: string): void {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    const favorites: string[] = stored ? JSON.parse(stored) : [];
    
    if (!favorites.includes(projectId)) {
      favorites.push(projectId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    
    incrementIntentScore("favorite_add");
  } catch (e) {
    console.error("Error tracking favorite:", e);
  }
}

/**
 * Get all favorited projects
 */
export function getFavoritedProjects(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Track asset download
 */
export function trackDownload(assetUrl: string): void {
  try {
    const stored = localStorage.getItem(DOWNLOADS_KEY);
    const downloads: string[] = stored ? JSON.parse(stored) : [];
    
    if (!downloads.includes(assetUrl)) {
      downloads.push(assetUrl);
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
    }
    
    incrementIntentScore("floorplan_download");
  } catch (e) {
    console.error("Error tracking download:", e);
  }
}

/**
 * Get all downloaded assets
 */
export function getDownloadedAssets(): string[] {
  try {
    const stored = localStorage.getItem(DOWNLOADS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get and increment visit count
 */
export function incrementVisitCount(): number {
  try {
    const stored = localStorage.getItem(VISIT_COUNT_KEY);
    const count = stored ? parseInt(stored, 10) + 1 : 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    return count;
  } catch {
    return 1;
  }
}

/**
 * Get visit count
 */
export function getVisitCount(): number {
  try {
    const stored = localStorage.getItem(VISIT_COUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Set user type (from form submission)
 */
export function setUserType(type: "buyer" | "investor" | "realtor"): void {
  localStorage.setItem(USER_TYPE_KEY, type);
  if (type === "realtor") {
    tagAsRealtor();
  }
}

/**
 * Get user type
 */
export function getUserType(): "buyer" | "investor" | "realtor" | null {
  const stored = localStorage.getItem(USER_TYPE_KEY);
  if (stored === "buyer" || stored === "investor" || stored === "realtor") {
    return stored;
  }
  return null;
}

/**
 * Check for return visit (new session after 24h)
 * Returns true if this is a return visit
 */
export function checkReturnVisit(): boolean {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    const now = new Date();
    
    // Update last seen
    localStorage.setItem(LAST_SEEN_KEY, now.toISOString());
    
    if (!lastSeen) {
      // First visit ever
      incrementVisitCount();
      return false;
    }
    
    const lastSeenDate = new Date(lastSeen);
    const hoursSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    // Check if this is a new session (no session_id stored)
    const sessionId = sessionStorage.getItem("pp_sid");
    const isNewSession = !sessionId;
    
    if (isNewSession && hoursSinceLastSeen >= 24) {
      incrementVisitCount();
      incrementIntentScore("return_visit");
      return true;
    }
    
    if (isNewSession) {
      incrementVisitCount();
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get last page viewed
 */
export function getLastPageViewed(): string {
  return sessionStorage.getItem("pp_last_page") || "";
}

/**
 * Set last page viewed
 */
export function setLastPageViewed(path: string): void {
  sessionStorage.setItem("pp_last_page", path);
}

/**
 * Build complete behavior summary for webhook payloads
 */
export function getBehaviorSummary(): BehaviorSummary {
  // Get UTM data
  let firstUtm: Record<string, string> = {};
  let lastUtm: Record<string, string> = {};
  
  try {
    const storedFirst = localStorage.getItem("pp_first_utm");
    const storedLast = localStorage.getItem("pp_last_utm");
    if (storedFirst) firstUtm = JSON.parse(storedFirst);
    if (storedLast) lastUtm = JSON.parse(storedLast);
  } catch {
    // Ignore parse errors
  }
  
  const visitCount = getVisitCount();
  
  return {
    intent_score: getIntentScore(),
    top_viewed_projects: getTopViewedProjects(),
    favorited_projects: getFavoritedProjects(),
    downloaded_assets: getDownloadedAssets(),
    city_interest: getCityInterests(),
    first_utm: firstUtm,
    last_utm: lastUtm,
    last_page_viewed: getLastPageViewed(),
    visit_count: visitCount,
    user_type: getUserType(),
    is_return_visitor: visitCount > 1,
  };
}
