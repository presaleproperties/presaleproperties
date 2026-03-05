
## Assessment: Assignment Detail Page — Public-Facing State

The current `AssignmentDetail.tsx` has the right bones but is missing several important elements that match the quality of the presale project detail pages. Here's what needs to be improved:

### What's Currently Missing / Weak

1. **No Expert Advisory Card** — The sidebar has a pricing card, deposit info, and key dates, but no `ExpertAdvisoryCard` (which exists and is used on resale/presale pages). The "Inquire About This Unit" button goes nowhere — it has no `onClick` handler and no lead form wired up.

2. **No lead capture / inquiry form** — The CTA button renders but does nothing. There's no `AboutContactForm` connected to it. Leads from assignment pages are not being captured.

3. **No document download section on the sidebar** — Documents (floor plan, brochure, one-pager) are only shown in the left column mid-page. They should also have a prominent download bundle section, especially for verified agent visitors.

4. **No agent-gate UX** — The route in `App.tsx` shows `/assignments/:id` is accessible to anyone, but the map restricts non-verified agents from clicking through. The detail page itself has no verification check — a non-agent who navigates directly sees full pricing and details with no lead capture.

5. **SEO is set to `noindex, nofollow`** — This is intentional for agent-gated content, which is fine.

6. **"Inquire About This Unit" sends no context** — When wired up, it should pre-fill the listing title/project/price into the contact form.

---

### Plan

**1. Wire up the "Inquire About This Unit" CTA**
- Import `AboutContactForm` into `AssignmentDetail.tsx`
- Add `formOpen` state and connect the button's `onClick`
- Pass `selectedAgentName` as `listing.title` so the form is pre-contextualized

**2. Add `ExpertAdvisoryCard` to the right sidebar**
- Place it below the pricing card in the right column
- This adds trust signals and a second conversion path (same pattern as presale/resale pages)

**3. Prominent Documents Download section in the sidebar**
- Add a dedicated "Downloads" card in the right sidebar showing floor plan, brochure, and a note about the one-pager being available on request
- Keep the existing documents section in the left column too, but the sidebar version is more visible for agents

**4. Non-verified agent soft gate**
- If the user is not a verified agent (using `useVerifiedAgent` hook), show a blurred/locked overlay on the pricing card with a CTA to verify — consistent with how the map already handles it
- This creates a lead capture moment instead of a dead end

**Files to edit:**
- `src/pages/AssignmentDetail.tsx` — primary changes (CTA form, expert card, sidebar downloads, agent gate)

This is a single-file change with no DB migrations needed.
