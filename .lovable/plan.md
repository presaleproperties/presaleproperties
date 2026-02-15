

## Two Changes: "About" in Nav + Trust Line Under Hero Search

### 1. Add "About" link to the main navigation

**Desktop nav** (ConversionHeader.tsx): Add an "About" link after Calculator, styled identically to the Blog and Calculator links, using the `Users` icon from lucide-react and linking to `/about`.

**Mobile nav** (same file): Add an "About" link after the Calculator link in the mobile slide-out menu, following the same pattern (icon in a rounded box + "About" label).

### 2. Add trust line under the hero search card

**HeroSection.tsx** (homepage): Insert a single reassuring line directly below the search card (before the "Explore Interactive Map" button):

> "Expert guidance at no extra cost"

Styled as small, white/semi-transparent text with a subtle shield or checkmark icon, matching the existing animation delay sequence.

**ResaleHeroSection.tsx**: Add the same trust line below the PowerSearch card, before the "Top Cities" section.

---

### Technical Details

**File: `src/components/conversion/ConversionHeader.tsx`**
- Import `Users` from lucide-react (line 3)
- After the Calculator `<Link>` block (lines 243-254), add an identical "About" link pointing to `/about`
- In the mobile menu, after the Calculator link block (lines 425-434), add a divider + About link following the same pattern

**File: `src/components/home/HeroSection.tsx`**
- Import `ShieldCheck` from lucide-react
- Replace the "Explore Interactive Map" block (around line 135) with a trust line first, then the map button. The trust line:
  ```
  <p className="text-white/70 text-sm font-medium flex items-center justify-center gap-2">
    <ShieldCheck className="h-4 w-4 text-primary" />
    Expert guidance at no extra cost
  </p>
  ```
  Placed inside the existing animated div at delay 0.25s, above the map link.

**File: `src/components/resale/ResaleHeroSection.tsx`**
- Import `ShieldCheck` from lucide-react
- Add the same trust line between the search card and the "Top Cities" section, with matching animation delay styling.

