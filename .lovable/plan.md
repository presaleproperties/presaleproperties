
## Email Builder — Full Plan

### What exists today
- `AdminEmailTemplates.tsx` — manages raw HTML email templates in DB (CRUD + toggle active)
- `AdminEmailWorkflows.tsx` — automated drip sequences, triggered by events
- `AdminCampaignBuilder.tsx` — visual one-pager / PDF builder for print collateral
- `presale_projects` table has: `brochure_files[]`, `floorplan_files[]`, `pricing_sheets[]`, `gallery_images[]`, `featured_image`, `name`, `address`, `city`, `developer_name`, `starting_price`, `completion_year`, `slug`

### What the user wants
A new **Email Builder** page inside the admin portal that:
1. Select a project → auto-pulls all its data
2. Has a fixed branded HTML email template (dark header, gold accents, property CTA buttons)
3. Lets them customize: headline, body copy, which CTAs to show (brochure link, floor plan link, project page link)
4. Live preview panel
5. "Copy HTML" button to copy the final rendered code for Mailchimp paste

No sending. Pure design + export tool.

---

### Architecture

**New file:** `src/pages/admin/AdminEmailBuilder.tsx`

**New nav entry** in `AdminLayout.tsx` under "Content" section → `Email Builder` with a `Mail` icon at `/admin/email-builder`

**New route** in `App.tsx`

---

### Page Layout (3-panel, left-center-right)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Email Builder                              [Copy HTML] [Reset] │
├──────────────┬──────────────────────────┬───────────────────────┤
│              │                          │                       │
│  LEFT PANEL  │    CENTER: LIVE PREVIEW  │   RIGHT: QUICK EDIT   │
│              │                          │                       │
│ 1. Project   │  Rendered email HTML     │ Subject line          │
│    Selector  │  (iframe or div)         │ Headline text         │
│              │                          │ Body copy             │
│ 2. Template  │                          │ CTA toggles:          │
│    Picker    │                          │  ☑ Brochure button    │
│    (preset   │                          │  ☑ Floor Plans button │
│    layouts)  │                          │  ☑ Book Consult btn   │
│              │                          │  ☑ View Project btn   │
│              │                          │                       │
│              │                          │ Paste-in HTML upload  │
└──────────────┴──────────────────────────┴───────────────────────┘
```

---

### Template Design (branded, inline CSS for Mailchimp)

Single built-in template with these sections:
- **Header**: Dark `#111` background, white logo text, gold accent bar
- **Hero**: Project featured image (full width), project name overlay
- **Property Info Bar**: Address | Type | Completion (3 columns, dark bg, gold labels)
- **Body Copy**: Editable headline + paragraph text
- **CTA Buttons section**: Each button individually toggleable
  - "Download Brochure" → links to `brochure_files[0]`
  - "View Floor Plans" → links to `floorplan_files[0]`
  - "View Project" → links to `https://presaleproperties.com/presale/{slug}`
  - "Book a Consultation" → links to `/book` page
- **Footer**: Address, unsubscribe placeholder, logo

All styles are **inline** (no external CSS) for Mailchimp compatibility.

---

### User-uploaded HTML (Claude paste-in)

A "Import HTML" button opens a textarea where the user can paste custom HTML from Claude. The builder then:
- Sets that as the current HTML content in the editor
- Still allows the quick-edit panel to override subject/headline if `{{variable}}` tokens are present

---

### Data flow

1. User picks a project from dropdown (fetches `presale_projects`)
2. Builder populates template variables:
   - `{{project_name}}`, `{{address}}`, `{{city}}`, `{{developer}}`, `{{completion}}`, `{{starting_price}}`
   - `{{brochure_url}}` = first item in `brochure_files[]` (or empty → hides button)
   - `{{floorplan_url}}` = first item in `floorplan_files[]`
   - `{{project_url}}` = constructed from slug
   - `{{featured_image}}` = `featured_image` column
3. User edits copy in right panel → preview updates live
4. "Copy HTML" → copies fully rendered HTML to clipboard (all variables replaced with real values, no `{{...}}` tokens remain)

---

### Files to create/edit

1. **Create** `src/pages/admin/AdminEmailBuilder.tsx` — the main builder page
2. **Edit** `src/components/admin/AdminLayout.tsx` — add nav link under Content section
3. **Edit** `src/App.tsx` — add lazy import + route for `/admin/email-builder`

---

### Key implementation details

- Preview rendered inside a sandboxed `<iframe srcDoc={...}>` so email styles don't leak into admin UI
- "Copy HTML" uses `navigator.clipboard.writeText(finalHtml)`
- CTA buttons hidden (removed from HTML string) when their URL is empty
- "Import HTML" textarea replaces the template's `html_content` state
- Project dropdown uses existing `presale_projects` table with `supabase.from("presale_projects").select("id, name, slug, city, featured_image, brochure_files, floorplan_files, pricing_sheets, address, developer_name, starting_price, completion_year, completion_month")`
- No DB writes needed — this is a pure client-side tool
- The built-in template is stored as a TypeScript string function `buildTemplate(vars)` that returns full inline-CSS HTML

---

### Template variable tokens used in built-in template

```
{{project_name}}     {{developer_name}}   {{address}}
{{city}}             {{completion}}       {{starting_price}}
{{featured_image}}   {{brochure_url}}     {{floorplan_url}}
{{project_url}}      {{headline}}         {{body_copy}}
{{book_url}}
```

No new database tables or migrations required.
