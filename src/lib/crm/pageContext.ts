/**
 * Page context registry for presence broadcasts.
 *
 * Project detail pages call `setCurrentPageContext({ project_id, ... })`
 * on mount and `clearCurrentPageContext()` on unmount. The next
 * `broadcastPresence("page_view", ...)` from BehaviorTracker reads from
 * here and includes the project context in the payload, so the CRM can
 * show "Sarah is viewing The Mason right now" instead of a generic page.
 */

export interface PageContext {
  project_id?: string;
  project_name?: string;
  project_slug?: string;
  city?: string;
  neighborhood?: string;
  page_type?:
    | "project_detail"
    | "lp_project"
    | "assignment_detail"
    | "deck_view"
    | "city_hub"
    | "search"
    | "other";
}

let current: PageContext = {};

export function setCurrentPageContext(ctx: PageContext): void {
  current = { ...ctx };
}

export function clearCurrentPageContext(): void {
  current = {};
}

export function getCurrentPageContext(): PageContext {
  return { ...current };
}
