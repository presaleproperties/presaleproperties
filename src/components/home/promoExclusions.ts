/**
 * Slugs already pinned as hand-picked promos elsewhere on the homepage
 * (see CityProjectsSection.PRE_CITY_PROMOS). The auto-trending promos
 * (Spotlight #1, Trending #2, Secondary #3, Rising Star #4) skip these
 * to avoid duplicates — e.g. The Loop appearing both as the Surrey
 * hand-picked card AND as the top-ranked Spotlight.
 */
export const HAND_PICKED_PROMO_SLUGS = new Set<string>([
  "the-loop",
  "ironwood",
  "baden-park",
]);
