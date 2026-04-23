/* Lead Approvals Push Service Worker
 * Listens for push events and handles approve/reject action clicks
 * by calling the signed approve-lead-link endpoint.
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New lead", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "New lead awaiting approval";
  const options = {
    body: data.body || "Tap to review",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    tag: data.tag || `lead-${data.leadId || Date.now()}`,
    requireInteraction: true,
    data: {
      leadId: data.leadId,
      approveUrl: data.approveUrl,
      rejectUrl: data.rejectUrl,
      reviewUrl: data.reviewUrl || "/admin/leads",
    },
    actions: [
      { action: "approve", title: "✓ Approve" },
      { action: "reject", title: "✕ Reject" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { approveUrl, rejectUrl, reviewUrl } = event.notification.data || {};

  if (event.action === "approve" && approveUrl) {
    event.waitUntil(
      fetch(approveUrl, { method: "GET", mode: "no-cors" }).catch(() => {})
    );
    return;
  }

  if (event.action === "reject" && rejectUrl) {
    event.waitUntil(
      fetch(rejectUrl, { method: "GET", mode: "no-cors" }).catch(() => {})
    );
    return;
  }

  // Default click → open dashboard
  const target = reviewUrl || "/admin/leads";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      const existing = all.find((c) => c.url.includes(target));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
