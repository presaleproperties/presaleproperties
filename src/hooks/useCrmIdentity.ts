/**
 * React hook: returns the CRM-known identity for the current visitor.
 *
 *   const { identity, loading } = useCrmIdentity();
 *   if (identity?.known) { showAgent(identity.assigned_agent); }
 *
 * Keeps a single in-memory copy across components, refreshes when the
 * known email changes (e.g. after a form submit).
 */

import { useEffect, useState } from "react";
import { resolveCrmIdentity, type CrmIdentity } from "@/lib/crm/resolveIdentity";

let cached: CrmIdentity | null = null;
const subscribers = new Set<(v: CrmIdentity) => void>();

function notify(v: CrmIdentity) {
  cached = v;
  subscribers.forEach((cb) => cb(v));
}

export function refreshCrmIdentity(): void {
  resolveCrmIdentity({ force: true }).then(notify).catch(() => {});
}

export function useCrmIdentity(): { identity: CrmIdentity | null; loading: boolean } {
  const [identity, setIdentity] = useState<CrmIdentity | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    const cb = (v: CrmIdentity) => { if (mounted) setIdentity(v); };
    subscribers.add(cb);

    if (!cached) {
      resolveCrmIdentity()
        .then((v) => { if (mounted) { notify(v); setLoading(false); } })
        .catch(() => { if (mounted) setLoading(false); });
    } else {
      setLoading(false);
    }

    // Listen for known-email changes (other tabs / form submissions)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pp_known_email") refreshCrmIdentity();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      subscribers.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { identity, loading };
}
