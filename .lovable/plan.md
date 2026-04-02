
## What's Broken

The SMS OTP verification was only added to 3 of the 5 lead forms. Two major forms were missed and still use a plain phone text input with no verification:

- `src/components/projects/ProjectLeadForm.tsx` — the main sidebar form on all presale project pages (the one in the screenshot)
- `src/components/projects/ProjectMobileCTA.tsx` — the expandable mobile bottom bar form on all project pages

Both forms submit immediately with no OTP required, which is why the user sees the "You're All Set!" screen straight away without any verification step.

---

## What Needs to Change

### 1. `ProjectLeadForm.tsx`
- Remove the plain phone `<Input>` field and its zod validation
- Add `PhoneVerificationField` with `onVerified` storing a `verifiedPhone` state
- Block the submit button until `verifiedPhone` is set (same pattern as `AccessPackModal`)
- Use `verifiedPhone` instead of `data.phone` when inserting the lead

### 2. `ProjectMobileCTA.tsx`
- Same changes — remove plain phone input, add `PhoneVerificationField`
- Add `verifiedPhone` state, gate submit on it
- Use `verifiedPhone` in the database insert

No database changes, no new edge functions — just wiring `PhoneVerificationField` into these two remaining forms, matching the exact pattern already working in `AccessPackModal` and `DeckLeadGate`.

---

## Files to Edit

```text
EDIT  src/components/projects/ProjectLeadForm.tsx   — replace phone input with PhoneVerificationField
EDIT  src/components/projects/ProjectMobileCTA.tsx  — replace phone input with PhoneVerificationField
```
