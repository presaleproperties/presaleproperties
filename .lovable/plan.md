

## Plan: Use Saved Email Builder HTML for Preview & Sending

### Problem
The onboarding flow fetches templates from `campaign_templates` (same table as Marketing Hub) — so the **data source is correct**. However, the preview and send functions rebuild HTML from raw `form_data` fields using a simplified `buildEmailHtml()`, which produces a stripped-down version that doesn't match the actual email built in the Email Builder (missing fonts, layout versions, agent signatures, image cards, etc.).

The real email builder uses a much more complex `buildFinalHtml()` with 10+ parameters. The solution is to **store the final rendered HTML** when saving templates, then reuse it directly.

### Changes

**1. Store `finalHtml` when saving in the AI Email Builder**
- In `src/pages/admin/AdminAiEmailBuilder.tsx`, add `finalHtml` to the `form_data` object in both `handleSaveClick` (update) and `handleSaveNewTemplate` (insert) flows.
- The `finalHtml` variable already exists in the component — just include it in `buildFormData()` or append it to the saved object.

**2. Store `finalHtml` in the legacy Email Builder too**
- In `src/pages/admin/AdminEmailBuilder.tsx`, same approach — include `finalHtml` in saved `form_data`.

**3. Update preview dialog to use stored `finalHtml`**
- In `src/components/leads/EmailTemplatePreviewDialog.tsx`, check for `formData.finalHtml` first. If present, use it directly (with `{first_name}` personalization applied). Fall back to the current `buildEmailHtml()` reconstruction only if `finalHtml` is missing.

**4. Update the send edge function to use stored `finalHtml`**
- In `supabase/functions/send-template-email/index.ts`, check for `fd.finalHtml` first. If present, apply personalization (`{first_name}` replacement) and send it. Fall back to the current reconstruction logic for older templates without `finalHtml`.

### Technical Details
- `buildFormData()` in `AdminAiEmailBuilder.tsx` (~line 650-700) constructs the object saved to DB — add `finalHtml` field there.
- The `finalHtml` const at line 748 always reflects the latest rendered state.
- No database migration needed — `form_data` is a `jsonb` column, so adding a new key is seamless.
- Existing saved templates without `finalHtml` will continue to work via the fallback reconstruction.

