

## Plan: Streamlined Agent Onboarding Flow

### Current Problems
1. The "Send Deck Email" button on the success screen sends an auto-generated email — not connected to Marketing Hub templates
2. The email preview/send still falls back to a generic `buildEmailHtml()` for templates without `finalHtml` stored
3. The flow has too many steps — pitch deck email send is redundant since you want to just copy the deck link manually

### New Flow (Single Screen, Fast)

```text
┌─────────────────────────────────────┐
│  FORM: Contact Info                 │
│  Name, Email, Phone, Source, Notes  │
├─────────────────────────────────────┤
│  SELECT: Pitch Deck (optional)      │
│  [Eden]  [Clover]  [Park]           │
├─────────────────────────────────────┤
│  SELECT: Email Template (optional)  │
│  [Eden Launch]  [Clover Intro]      │
│  [Preview] button when selected     │
├─────────────────────────────────────┤
│  [ Save & Send Email ]              │
└─────────────────────────────────────┘
         ↓ after submit
┌─────────────────────────────────────┐
│  ✓ Client Onboarded                 │
│                                     │
│  Deck Link: [copy field] [📋]      │
│                                     │
│  Email Template: [card]             │
│  [Preview]  [Send to John]          │
│                                     │
│  [ Onboard Another Client ]        │
└─────────────────────────────────────┘
```

### Changes

**1. Remove "Send Deck Email" button from success screen**
- File: `src/components/leads/LeadOnboardHub.tsx`
- Remove the `handleSendDeckEmail` function and the "Send Deck Email" button
- Keep the deck link + copy button so agents can manually share it
- Remove related state: `sendingEmail`, `emailSent`

**2. Ensure `finalHtml` is the source of truth for preview and sending**
- The preview dialog already prioritizes `formData.finalHtml` (line 35-48 of `EmailTemplatePreviewDialog.tsx`) — this is correct
- The edge function already prioritizes `fd.finalHtml` — this is correct
- The only requirement is that templates have been re-saved in the Marketing Hub since the `finalHtml` storage was added (previous change). Templates saved before that will use the fallback reconstruction.

**3. Auto-send email template on form submission (optional enhancement)**
- Currently the submit button says "Save & Send Email" but does NOT auto-send — it just saves the lead and shows the success screen where you manually click send
- Update `onSubmit` to automatically invoke `send-template-email` right after saving the lead (if a template was selected), so the email goes out in one click
- Show the result on the success screen (already sent, with option to preview what was sent)

**4. Clean up unused imports and state**
- Remove `Presentation` icon import (no longer used)
- Remove `sendingEmail`/`emailSent` state variables

### Technical Details
- Only `src/components/leads/LeadOnboardHub.tsx` needs editing
- No database changes needed
- No edge function changes needed — `send-template-email` already handles `finalHtml` correctly
- The email that goes out will be the exact Marketing Hub template with `{first_name}` personalized

