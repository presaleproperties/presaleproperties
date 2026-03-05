
## Plan: Assignment of Contract Campaign Type

### What gets built
Add a **Presale / Assignment toggle** at the top of the Campaign Builder. When in Assignment mode, the builder pulls from live `listings`, auto-fills unit data, and renders a dedicated Assignment one-pager for PNG export.

### Layout: Assignment One-Pager (612px)
```
HERO photo + logo + project name + "Assignment of Contract" + unit #
PRICE BAR: Asking $XXX,XXX  |  Deposit to Lock $XX,XXX
SPECS STRIP: Unit Type | Interior Sqft | Floor Level | Exposure
DETAILS GRID: Parking / Locker / Completion / Dev Approval / Commission
DESCRIPTION block
AGENT FOOTER (identical to presale)
```

### Implementation steps
1. Add `AssignmentFormState` type + `DEFAULT_ASSIGNMENT_STATE`
2. Add `campaignType` state (`"presale" | "assignment"`)
3. Add `assignmentListings` fetch from `listings` table (status = published)
4. Add `handleAssignmentSelect()` — maps listing fields to form
5. Add `AssignmentOnePagerPreview` component (inline, same colour palette + export pipeline)
6. Add campaign type toggle pill buttons in left panel header
7. Add Assignment-specific left panel tabs: Unit / Pricing / Agent
8. Conditionally render presale vs assignment preview and left panel

### Files changed
- `src/pages/admin/AdminCampaignBuilder.tsx` only — no DB changes needed
