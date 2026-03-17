
## Add Pitch Decks to Admin Portal

The pitch deck builder lives at `/dashboard/decks` (agent-facing). The admin portal has its own nav defined in `src/components/admin/AdminLayout.tsx`. We need to:

1. **Add a "Pitch Decks" nav item** to the Content section in `AdminLayout.tsx` (line 92–98), pointing to `/dashboard/decks` with an `ExternalLink`-style indicator, OR add an admin-specific decks management page.

Looking at the existing items, the simplest and most consistent approach is to add a nav entry in the Content section that links directly to `/dashboard/decks` — since the deck builder is already built and works there. We can also optionally link to `/admin/decks` if we want an admin overview of all agents' decks.

**Best approach**: Add to the Content group in admin nav pointing to `/dashboard/decks` with a `Presentation` icon (already imported in DashboardLayout). The `Presentation` icon needs to be imported in AdminLayout.tsx.

### Changes

**`src/components/admin/AdminLayout.tsx`**:
1. Import `Presentation` from `lucide-react` (line 5–41)
2. Add to Content section items array (after line 97):
```ts
{ href: "/dashboard/decks", label: "Pitch Decks", icon: Presentation, color: "text-sky-500", badgeKey: null },
```

That's it — one file, two line changes. The nav item will appear under Content and clicking it navigates to the existing deck builder dashboard.
