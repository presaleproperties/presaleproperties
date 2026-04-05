
## Automated Email Flow System

### Current State
- Lead forms (floor plan requests, general inquiries) insert into `project_leads` and call `trigger-workflow` → **currently DISABLED** (kill switch)
- `send-project-lead` pushes lead data to Zapier/Lofty CRM only — no auto-email to the lead
- Manual emails are sent via the Email Builder → `send-template-email` / `send-direct-email`

### What We're Building

#### 1. Two New Auto-Response Email Templates (in `AiEmailTemplate.tsx`)
Built to match the existing Modern layout aesthetic (gold accents, dark forest green, same fonts):

**Template A: "Project Details + Documents"**
- Auto-populates: project name, city, neighborhood, developer, hero image, starting price, deposit, completion
- Shows CTA buttons for brochure/floor plans **only if files exist** on the project
- Used when the project has public documents available

**Template B: "Agent Follow-Up"**  
- Same header/hero styling but body says: *"Thank you for your interest in [Project Name]. The detailed information for this project is not publicly available at this time. One of our team members will reach out to you shortly with exclusive access to floor plans and pricing."*
- No document CTAs — just a "CALL NOW" with the assigned agent's info
- Used when no brochure/floorplan files are available

#### 2. Auto-Email Edge Function: `send-lead-autoresponse`
- Called from the existing lead form submission flow (replaces the disabled `trigger-workflow`)
- Receives: `leadId`, `projectId`
- Logic:
  1. Fetch lead details from `project_leads`
  2. Fetch project details from `presale_projects` (hero image, documents, pricing, etc.)
  3. Check if `brochure_files` or `floorplan_files` or `pricing_sheets` exist
  4. If documents exist → render **Template A** with project data + document CTAs
  5. If no documents → render **Template B** (agent will follow up)
  6. Send via existing Gmail SMTP (`_shared/gmail-smtp.ts`)
  7. Log in `email_logs` table

#### 3. Admin Portal: Email Flow Center (new page)
- New route: `/admin/email-flows`
- Added to Admin sidebar under "Marketing" section
- Shows:
  - Toggle to enable/disable auto-response emails globally
  - Preview of both auto-response templates
  - Log of all auto-sent emails with recipient, project, template used, and timestamp
  - Ability to customize the fallback copy (Template B message)

#### 4. Wire Up Lead Forms
- Update `ProjectLeadForm.tsx` and `ProjectMobileCTA.tsx` to call `send-lead-autoresponse` after lead insertion
- No changes to existing manual Email Builder templates

#### 5. Workflow Mind Map
- Generated as a Mermaid diagram showing the complete flow

### What We're NOT Changing
- Existing email templates (Modern, Editorial, Modern V2)
- Agent portal access — all automation config stays in admin only
- Zapier/Lofty CRM pipeline (continues working via `send-project-lead`)

### Build Order
1. Create the two new HTML template builder functions
2. Build the `send-lead-autoresponse` edge function
3. Build the Admin Email Flows page
4. Wire up lead forms to call the new function
5. Generate the workflow mind map
