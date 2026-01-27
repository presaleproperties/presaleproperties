
# Lead Form Optimization Plan

## Overview
After analyzing the codebase, I found **10 distinct lead form types**. Per your requirements, I'll exclude **Floor Plan Request**, **Download List**, and **Scheduler** from optimization. This leaves **7 form types** to evaluate for consolidation.

## Current Form Inventory

| Form Type | Component | Purpose | Can Consolidate? |
|-----------|-----------|---------|------------------|
| `city_list_*` | AccessPackModal | Download city list | ❌ Protected |
| `floor_plan_request` | ProjectLeadForm | Floor plans | ❌ Protected |
| `scheduler` / `resale_tour` | ResaleScheduleForm | Book showings | ❌ Protected |
| `sticky_bar` | AccessPackModal (fit_call) | Request callback | ✅ Already unified |
| `header_inquiry` | AccessPackModal (fit_call) | Request callback | ✅ Already unified |
| `callback_request` | AccessPackModal (fit_call) | Request callback | ✅ Already unified |
| `roi_calculator` | ROILeadCapture | ROI report | ⚠️ Evaluate |
| `mortgage_calculator` | MortgageCalculatorPage | Mortgage estimate | ⚠️ Evaluate |
| `new_homes_page` | NewHomesLeadCapture | New homes interest | ⚠️ Evaluate |
| `resale_inquiry` | ResaleScheduleForm | Ask a question | ⚠️ Evaluate |
| `vip_membership` | VIPMembershipForm | VIP signup | ❌ Keep (unique) |
| `exit_intent_guide` | ExitIntentPopup | Guide download | ❌ Keep (unique) |

## Recommended Consolidations

### 1. Create Unified "Calculator Lead Capture" Component
**Merge:** `roi_calculator` + `mortgage_calculator`

Both forms capture similar data (name, email, phone) with calculator results. Create a shared `CalculatorLeadCapture` component.

**Files to modify:**
- `src/components/roi/ROILeadCapture.tsx` → Extract to shared component
- `src/pages/MortgageCalculatorPage.tsx` → Use shared component

**Savings:** 1 form type eliminated

---

### 2. Consolidate "General Interest" Forms
**Merge:** `new_homes_page` + `resale_inquiry`

Both capture general interest for non-presale properties. The `NewHomesLeadCapture` (used only on /resale) could use the existing `AccessPackModal` with a new variant.

**Files to modify:**
- `src/components/resale/NewHomesLeadCapture.tsx` → Replace with `AccessPackModal`
- `src/components/conversion/AccessPackModal.tsx` → Add "general_interest" variant

**Savings:** 1 form type eliminated

---

### 3. Standardize Callback Forms (Already Done ✅)
**Status:** `sticky_bar`, `header_inquiry`, and `callback_request` already use the same `AccessPackModal` component with different `source` values for tracking. No changes needed.

---

## Form Architecture After Optimization

```text
┌─────────────────────────────────────────────────────────────┐
│                    LEAD CAPTURE FORMS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AccessPackModal (Unified)                  │   │
│  │  • floorplans variant → Floor plans, City lists     │   │
│  │  • fit_call variant → Callbacks (sticky/header)     │   │
│  │  • general_interest variant → New homes interest    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────┐  ┌────────────────────────────┐     │
│  │  ProjectLeadForm  │  │    ResaleScheduleForm      │     │
│  │  (Project Detail) │  │  (Tour + Ask Question)     │     │
│  └───────────────────┘  └────────────────────────────┘     │
│                                                             │
│  ┌───────────────────┐  ┌────────────────────────────┐     │
│  │ CalculatorLeadCap │  │     ExitIntentPopup        │     │
│  │ (ROI + Mortgage)  │  │    (Guide Download)        │     │
│  └───────────────────┘  └────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              VIPMembershipForm (Unique)               │ │
│  │         (Email verification, premium flow)            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Summary

| Task | Components Affected | Lines Changed | Impact |
|------|---------------------|---------------|--------|
| Create CalculatorLeadCapture | ROILeadCapture, MortgageCalculatorPage | ~150 lines | -1 form |
| Add general_interest variant | AccessPackModal, NewHomesLeadCapture | ~80 lines | -1 form |
| Update edge function mapping | send-project-lead | ~10 lines | Tracking |

## Final Form Count

**Before:** 10 distinct form types
**After:** 8 distinct form types
**Reduction:** 2 forms consolidated

## Technical Changes

### File 1: Create shared CalculatorLeadCapture component
**Path:** `src/components/conversion/CalculatorLeadCapture.tsx`

A new reusable component that accepts:
- `calculatorType: "roi" | "mortgage"`
- `calculatorData: object` (the results to include in lead message)
- `onSubmitSuccess: () => void`

### File 2: Update ROILeadCapture
**Path:** `src/components/roi/ROILeadCapture.tsx`

Replace with the new shared component, passing ROI-specific data.

### File 3: Update MortgageCalculatorPage
**Path:** `src/pages/MortgageCalculatorPage.tsx`

Replace inline form with shared component, passing mortgage-specific data.

### File 4: Update AccessPackModal
**Path:** `src/components/conversion/AccessPackModal.tsx`

Add new `variant: "general_interest"` option with appropriate copy and tracking.

### File 5: Update NewHomesLeadCapture
**Path:** `src/components/resale/NewHomesLeadCapture.tsx`

Replace entire component with `AccessPackModal` using the new variant.

### File 6: Update Edge Function
**Path:** `supabase/functions/send-project-lead/index.ts`

Add mapping for new `calculator_lead` and `general_interest` source types.
