## Plan: Agent Marketing Hub + Email Builder

### Goal
Give agents their own Marketing Hub and Email Builder inside the agent portal (`/dashboard/...`), so they can create email templates, send them to their leads, and track everything — without touching the admin portal.

### Changes (Admin portal stays untouched)

#### 1. Agent Marketing Hub page (`/dashboard/marketing-hub`)
- Create `src/pages/dashboard/DashboardMarketingHub.tsx` — a copy of `AdminMarketingHub.tsx` but:
  - Wrapped in `DashboardLayout` instead of `AdminLayout`
  - Routes point to `/dashboard/email-builder` instead of `/admin/email-builder`
  - Data scoped: only shows templates created by the logged-in agent (filter by `user_id`)
  - Agents can create, duplicate, delete their own templates

#### 2. Agent Email Builder page (`/dashboard/email-builder`)
- Create `src/pages/dashboard/DashboardEmailBuilder.tsx` — wraps the existing `AdminAiEmailBuilder` component but:
  - Uses `DashboardLayout` instead of `AdminLayout`
  - Back button navigates to `/dashboard/marketing-hub`
  - Saves templates with the agent's `user_id` so they're scoped

#### 3. Database: Add `user_id` column to `campaign_templates`
- Add nullable `user_id` UUID column (existing admin templates have null = shared/admin)
- RLS policy: agents can CRUD their own templates; admins can manage all

#### 4. Update routing (`App.tsx`)
- Add `/dashboard/marketing-hub` → `DashboardMarketingHub`
- Add `/dashboard/email-builder` → `DashboardEmailBuilder`

#### 5. Update agent nav (`DashboardLayout.tsx`)
- Add "Marketing Hub" nav item between "Pitch Decks" and "Leads"

#### 6. No changes to admin portal
- `AdminMarketingHub`, `AdminAiEmailBuilder`, `AdminLayout` — all untouched
