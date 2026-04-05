

# Installable Agent Hub App (Add to Home Screen)

## What This Does
Creates a separate "Add to Home Screen" experience specifically for the Agent Hub. When you save it to your phone, it opens directly to `/dashboard` (the Agent Hub) with its own app name, icon, and no browser chrome — it feels like a standalone app.

## How It Works

Since you already have a `manifest.json` for the public site, we'll create a **second manifest** specifically for the Agent Hub and wire it up so it only loads when you're on `/dashboard` routes.

### Changes

**1. Create `public/manifest-agent.json`**
- Name: "Presale Agent Hub" / short name: "Agent Hub"
- `start_url`: `/dashboard` — so it always opens to the Agent Hub
- Same brand icons and colors as the main site
- `display: standalone` for native-app feel

**2. Swap manifest dynamically in the app**
- Add a small component (e.g. `AgentManifestSwap`) that detects when the user is on any `/dashboard/*` route
- It replaces the `<link rel="manifest">` href from `/manifest.json` to `/manifest-agent.json`
- This means when an agent hits "Add to Home Screen" from the dashboard, the phone picks up the agent-specific manifest

**3. Auto-redirect on launch**
- When the app opens from the home screen at `/dashboard`, the existing `ProtectedRoute` handles auth — if not logged in, it redirects to `/login`, then back to `/dashboard` after login
- No extra routing needed; the current auth flow already handles this

### What You'll Do
1. Open the Agent Hub on your phone's browser
2. Tap **Share → Add to Home Screen**
3. It saves as "Agent Hub" with the brand icon
4. Opening it launches straight into the dashboard — full screen, no browser bar

### No PWA Service Worker Needed
This uses only a web app manifest for installability — no service worker, no offline caching, no complexity. It's the simplest approach that gives you a home-screen icon that launches directly to the Agent Hub.

