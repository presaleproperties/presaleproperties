
## Full Lead Form Audit

This is a research/informational response — no plan needed, just a clear breakdown.

### All Forms, Their Tables, and Zapier Connection Status

**FULLY CONNECTED TO ZAPIER ✓**

1. **Project Floor Plan / Get Access Form** (`ProjectLeadForm.tsx`, `usePresaleLeadCapture.ts`)
   - Where: Project detail pages (e.g. `/presale-projects/eden`)
   - Table: `project_leads`
   - Zapier: ✅ Yes — calls `send-project-lead` → sends to `zapier_project_leads_webhook`
   - Extras: Meta Conversions API, GA4, Meta Pixel

2. **Access Pack Modal** (`AccessPackModal.tsx`)
   - Where: New Homes page, city landing pages, sticky bar, header CTA
   - Table: `project_leads`
   - Zapier: ✅ Yes — calls `send-project-lead` → `zapier_project_leads_webhook`
   - Extras: Meta Conversions API, GA4, Meta Pixel

3. **Pitch Deck Lead Form** (on public deck pages)
   - Where: `/deck/[slug]`
   - Table: `project_leads`
   - Zapier: ✅ Yes — calls `send-project-lead` → `zapier_project_leads_webhook`

4. **Booking / Schedule a Call** (`BookingModal.tsx`, `ResaleScheduleForm.tsx`)
   - Where: Project pages, New Homes page
   - Table: `bookings`
   - Zapier: ✅ Yes — calls `send-booking-notification` → `zapier_bookings_webhook` (falls back to `zapier_project_leads_webhook` if not set)

5. **ROI Calculator Lead Capture** (`CalculatorLeadCapture.tsx` via `ROILeadCapture.tsx`)
   - Where: ROI Calculator page
   - Table: `project_leads`
   - Zapier: ✅ Yes — calls `send-project-lead` → `zapier_project_leads_webhook`
   - Lead source tag: `roi_calculator`

6. **Mortgage Calculator Lead Capture** (`CalculatorLeadCapture.tsx`)
   - Where: Mortgage Calculator page
   - Table: `project_leads`
   - Zapier: ✅ Yes — calls `send-project-lead` → `zapier_project_leads_webhook`
   - Lead source tag: `mortgage_calculator`

7. **Exit Intent Popup** (`ExitIntentPopup.tsx`)
   - Where: Site-wide (triggers on exit)
   - Table: `newsletter_subscribers` + `project_leads` (dual write)
   - Zapier: ✅ Yes — creates a project_lead then calls `send-project-lead`
   - Lead source: `exit_intent_guide`
   - Note: Only captures email, no phone/name → name stored as "Guide Download"

8. **Resale Listing Lead Form** (`LeadCaptureForm.tsx`)
   - Where: Resale/assignment listing pages (agent listings)
   - Table: `leads` (separate table from `project_leads`)
   - Zapier: ✅ Yes — calls `send-lead-notification` → `zapier_listing_leads_webhook`
   - Note: Uses a **different webhook** (`ZAPIER_LISTING_LEADS_WEBHOOK`), separate Zap needed

---

**NOT CONNECTED TO ZAPIER ⚠️**

9. **Newsletter Signup** (`NewsletterSignup.tsx`)
   - Where: Homepage, blog, city pages
   - Table: `newsletter_subscribers`
   - Zapier: ❌ No — saves directly to DB only, no webhook triggered
   - Gap: These leads never hit Zapier/Lofty

10. **Price Alert Button** (`LeadMagnets.tsx`)
    - Where: Project detail pages
    - Table: `newsletter_subscribers`
    - Zapier: ❌ No — saves to DB only
    - Gap: Email captured but not sent to CRM

11. **VIP Notify Button** (`LeadMagnets.tsx`)
    - Where: Project detail pages
    - Table: `newsletter_subscribers`
    - Zapier: ❌ No — saves to DB only
    - Gap: Email captured but not sent to CRM

12. **Neighborhood Guide Button** (`LeadMagnets.tsx`)
    - Where: Project detail pages
    - Table: `newsletter_subscribers`
    - Zapier: ❌ No — saves to DB only
    - Gap: Email captured but not sent to CRM

13. **Contact Page Form** (`Contact.tsx`)
    - Where: `/contact`
    - Table: None — goes directly via `send-contact-email` (Resend email only)
    - Zapier: ❌ No — sends an email notification to admin only, not saved to DB or Zapier/Lofty
    - Gap: Contact inquiries are not in the CRM at all

14. **About Page / Team Contact Form** (`AboutContactForm.tsx`)
    - Where: `/about`, Team section, Assignments page
    - Table: `bookings`
    - Zapier: ⚠️ Partial — saves to `bookings` table, but `send-booking-notification` is NOT called. No Zapier trigger fires.
    - Gap: Booking is saved but never reaches Zapier or Lofty

---

### Summary of Gaps

| Gap | Impact |
|---|---|
| Newsletter signups (4 forms) not in Lofty | High — you're collecting emails but losing them from CRM |
| Contact page form not saved to DB | High — inquiries disappear if email fails |
| About page form doesn't trigger Zapier | Medium — bookings sit in DB unseen in Lofty |
| Listing leads use a separate webhook | Medium — need to confirm `ZAPIER_LISTING_LEADS_WEBHOOK` is configured separately |
| Booking fallback uses project leads webhook | Low — bookings use the project leads Zapier URL as fallback if no booking webhook is set |

Would you like me to fix all these gaps? I can:
1. Wire the newsletter/price alert/VIP/guide forms through `send-project-lead` so they hit Lofty
2. Save contact form submissions to the DB and trigger Zapier
3. Add `send-booking-notification` to the About page form
