
# Plan: Document Tracking for Presale Projects

## Summary
Add the ability to track and manage **brochures, floor plans, and pricing sheets** for all presale projects, with visual indicators in the admin dashboard showing which documents are missing.

---

## Changes Overview

### 1. Database Schema Update
Add a new `pricing_sheets` column to store pricing document URLs.

**Migration SQL:**
```sql
ALTER TABLE presale_projects 
ADD COLUMN IF NOT EXISTS pricing_sheets text[];
```

---

### 2. Admin Projects List (`AdminProjects.tsx`)

**Update Project Type:**
- Add `brochure_files`, `floorplan_files`, and `pricing_sheets` fields

**Update Query:**
- Fetch document fields in `fetchProjects()`

**Add Document Status Indicators:**
Each project row will display three small badges showing document status:
- ✓ Green check if document exists
- ✗ Red X if missing

```
Project Name                    [Docs: 📄✓ 📋✓ 💲✗]  [Active] [Published]
Vancouver, Downtown              Updated Jan 30
```

**Add "Documents" Filter:**
New dropdown filter with options:
- All Projects
- Missing Brochure
- Missing Floorplans  
- Missing Pricing
- Complete (all docs present)

---

### 3. Admin Project Form (`AdminProjectForm.tsx`)

**Add Pricing Sheets Section:**
- New card similar to Brochure and Floorplan cards
- Support PDF upload to storage
- Support Google Drive link paste
- Remove functionality

**Update Form Data:**
- Add `pricing_sheets: string[]` to FormData type
- Initialize as empty array
- Include in save/load logic

---

## Technical Details

### Files Modified:
1. **Database Migration** - Add `pricing_sheets` column
2. `src/pages/admin/AdminProjects.tsx` - Document indicators + filter
3. `src/pages/admin/AdminProjectForm.tsx` - Pricing sheets upload UI

### New State in AdminProjects.tsx:
```typescript
const [docsFilter, setDocsFilter] = useState<string>("all");
// Options: "all" | "missing_brochure" | "missing_floorplan" | "missing_pricing" | "complete"
```

### Updated Project Type:
```typescript
type Project = {
  // ... existing fields
  brochure_files: string[] | null;
  floorplan_files: string[] | null;
  pricing_sheets: string[] | null;
};
```

### Document Status Badge Component:
```tsx
const DocumentStatus = ({ has }: { has: boolean }) => (
  <span className={has ? "text-green-500" : "text-red-400"}>
    {has ? "✓" : "✗"}
  </span>
);
```

---

## UI Preview

**Project List Row:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ The Heights                          Docs: 📄✓ 📋✓ 💲✗              │
│ 📍 Vancouver, Burnaby • 📅 2026     [Active] [Published]    [Edit] │
└─────────────────────────────────────────────────────────────────────┘
```

**Filter Bar:**
```
[Search...] [City ▼] [Status ▼] [Published ▼] [Documents ▼]
                                               ├─ All
                                               ├─ Missing Brochure
                                               ├─ Missing Floorplans
                                               ├─ Missing Pricing
                                               └─ Complete
```

---

## Implementation Order
1. Run database migration to add `pricing_sheets` column
2. Update `AdminProjects.tsx` with document tracking and filtering
3. Update `AdminProjectForm.tsx` with pricing sheet upload capability
