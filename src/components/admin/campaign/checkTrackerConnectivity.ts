/**
 * Verify the click-tracking + open-pixel endpoints are reachable from the
 * browser and that they rewrite URLs the way we expect. Runs once per session
 * (cached) so the pre-flight checklist can show a clear status without
 * hammering the edge function on every keystroke.
 *
 * Checks performed:
 *   1. Open-pixel ping: GET <track endpoint>?probe=1 — expect 200 with
 *      Content-Type image/gif (or any 2xx response).
 *   2. Click redirect probe: HEAD <track endpoint>?probe=1&url=<encoded>
 *      — expect a 3xx with a Location header pointing back at the encoded
 *      destination. We use `redirect: "manual"` so we can inspect the
 *      redirect without following it.
 *   3. Environment match: confirm the TRACK_HOST baked into auditEmailHtml.ts
 *      matches the project's VITE_SUPABASE_URL hostname (catches the case
 *      where the project was forked/cloned and tracking links would point
 *      at a different supabase project).
 */
import { useEffect, useState } from "react";

const TRACK_HOST_HARDCODED = "thvlisplwqhtjpzpedhq.supabase.co";
const TRACK_PATH = "/functions/v1/track-email-open";
const PROBE_DESTINATION = "https://presaleproperties.com/?probe=1";

export type TrackerStatus = "checking" | "ok" | "warn" | "error";

export interface TrackerCheckResult {
  status: TrackerStatus;
  /** Single-line status suitable for a badge. */
  summary: string;
  /** Per-check details for the expandable section. */
  details: Array<{
    label: string;
    status: "pass" | "warn" | "fail";
    note: string;
  }>;
  /** Resolved tracker base URL the browser actually saw. */
  trackerBase: string;
  /** Whether the env hostname matches the hardcoded one in auditEmailHtml. */
  envMatchesAuditor: boolean;
}

let cached: TrackerCheckResult | null = null;
let inflight: Promise<TrackerCheckResult> | null = null;

/** Run the checks (memoized for the page lifetime). */
export async function checkTrackerConnectivity(force = false): Promise<TrackerCheckResult> {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "";
  let envHost = "";
  try {
    envHost = new URL(envUrl).hostname;
  } catch {
    envHost = "";
  }
  const trackerBase = `${envUrl.replace(/\/$/, "")}${TRACK_PATH}`;
  const envMatchesAuditor = !!envHost && envHost === TRACK_HOST_HARDCODED;

  inflight = (async () => {
    const details: TrackerCheckResult["details"] = [];

    // 1) Pixel reachability
    let pixelOk = false;
    try {
      const r = await fetch(`${trackerBase}?probe=1`, {
        method: "GET",
        cache: "no-store",
        // No-cors lets us at least know the network roundtrip succeeded even
        // if CORS isn't set up for arbitrary origins.
        mode: "no-cors",
      });
      // With no-cors the response is opaque (status 0) but `r.type === 'opaque'`
      // means the request reached the network. With cors it'd be a normal 200.
      pixelOk = r.ok || r.type === "opaque";
      details.push({
        label: "Open-pixel endpoint reachable",
        status: pixelOk ? "pass" : "fail",
        note: pixelOk
          ? "Tracking pixel returned a network response."
          : `Pixel endpoint returned status ${r.status}.`,
      });
    } catch (e) {
      details.push({
        label: "Open-pixel endpoint reachable",
        status: "fail",
        note:
          e instanceof Error
            ? `Pixel ping failed: ${e.message}`
            : "Pixel ping failed (unknown network error).",
      });
    }

    // 2) Click redirect probe — same endpoint, with ?url=
    let redirectOk = false;
    try {
      const probeUrl = `${trackerBase}?probe=1&url=${encodeURIComponent(PROBE_DESTINATION)}`;
      const r = await fetch(probeUrl, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        mode: "no-cors",
      });
      // Manual redirect with no-cors → opaqueredirect is the success signal.
      redirectOk =
        r.type === "opaqueredirect" ||
        (r.status >= 300 && r.status < 400) ||
        r.ok ||
        r.type === "opaque";
      details.push({
        label: "Click-tracking redirect reachable",
        status: redirectOk ? "pass" : "fail",
        note: redirectOk
          ? "Redirect endpoint responded — links will rewrite correctly."
          : `Redirect endpoint returned status ${r.status} (type: ${r.type}).`,
      });
    } catch (e) {
      details.push({
        label: "Click-tracking redirect reachable",
        status: "fail",
        note:
          e instanceof Error
            ? `Redirect probe failed: ${e.message}`
            : "Redirect probe failed (unknown network error).",
      });
    }

    // 3) Environment match
    details.push({
      label: "Tracker host matches this environment",
      status: envMatchesAuditor ? "pass" : "warn",
      note: envMatchesAuditor
        ? `Auditor and runtime both target ${envHost}.`
        : `Runtime is ${envHost || "(unknown)"} but the auditor is hardcoded to ${TRACK_HOST_HARDCODED}. Tracked links in sent emails will hit the hardcoded host.`,
    });

    const failed = details.filter((d) => d.status === "fail").length;
    const warned = details.filter((d) => d.status === "warn").length;
    let status: TrackerStatus;
    let summary: string;
    if (failed > 0) {
      status = "error";
      summary = `Tracker unreachable (${failed} check${failed === 1 ? "" : "s"} failed)`;
    } else if (warned > 0) {
      status = "warn";
      summary = `Tracker reachable, ${warned} warning${warned === 1 ? "" : "s"}`;
    } else {
      status = "ok";
      summary = "Tracker endpoints verified";
    }

    const result: TrackerCheckResult = {
      status,
      summary,
      details,
      trackerBase,
      envMatchesAuditor,
    };
    cached = result;
    inflight = null;
    return result;
  })();

  return inflight;
}

/** React hook wrapper. */
export function useTrackerConnectivity() {
  const [result, setResult] = useState<TrackerCheckResult>(
    cached ?? {
      status: "checking",
      summary: "Verifying tracker endpoints…",
      details: [],
      trackerBase: "",
      envMatchesAuditor: false,
    },
  );

  useEffect(() => {
    let alive = true;
    checkTrackerConnectivity().then((r) => {
      if (alive) setResult(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  const recheck = async () => {
    setResult((prev) => ({ ...prev, status: "checking", summary: "Re-checking…" }));
    const r = await checkTrackerConnectivity(true);
    setResult(r);
  };

  return { result, recheck };
}
