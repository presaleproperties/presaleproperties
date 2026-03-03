
## The Core Problem

The one-pager is rendering correctly in the browser preview but when exported to PDF, it feels cramped. This happens because:

1. **The one-pager's natural rendered height exceeds 792pt** (a standard Letter page), so the current code hits the `else` branch and *scales the entire image down* to fit — compressing everything and making it look cramped.
2. **PNG vs JPEG**: PNG would improve quality for graphics/text (lossless), but won't fix the cramped layout since that's a geometry problem, not a compression one. Switching to PNG for the one-pager is worth doing for sharpness.

## The Real Fix: Use a Tabloid/Legal Format

The cleanest solution is to match the PDF page dimensions to the one-pager's natural content height rather than squeezing content into Letter size. Two options:

**Option A — Tabloid (11"×17" = 792×1224pt)**  
Gives a lot of room. The one-pager is a brochure-style document, so this is a natural fit.

**Option B — Measure the actual rendered height and use a custom page size**  
For the one-pager page only, measure `scrollHeight`, set a custom jsPDF page size to match, and render at 1:1 without any scaling. Floor plan pages stay Letter (612×792). This gives you *exactly* what you see in the preview.

**Option B is the best approach** — it's pixel-perfect to what the user sees in the browser.

## Plan

### 1. One-pager: custom page size = exact preview height
- After cloning the element off-screen, measure `clone.scrollHeight`
- Compute `naturalH_pt = scrollHeight` (1px = 1pt at our design width)
- Create the first PDF page with `format: [612, naturalH_pt]` so there's zero scaling
- Render at scale 4 for maximum quality

### 2. Switch one-pager to PNG (lossless)
- Use `canvas.toDataURL("image/png")` for the one-pager page (index 0)
- Keep JPEG for floor plan pages (smaller file, acceptable for images)

### 3. Floor plan pages: keep Letter but fix the "running into second page" issue
- The floor plan pages have `height: 792` set in CSS. The problem is that when cloned off-screen at 612px width, the flex layout may recalculate heights and overflow
- Fix: explicitly set `height: 792px; overflow: hidden` on the clone before capture
- This guarantees a clean single-page capture

### 4. No layout compression on one-pager
- Remove the scale-down fallback (`else` branch) for the one-pager entirely — instead we use a custom page height
- This preserves all padding, font sizes, and spacing exactly as seen in preview

## Summary of Changes (all in `AdminCampaignBuilder.tsx`)

```text
generatePDF()
├── Page 0 (one-pager)
│   ├── Capture at SCALE=4
│   ├── Measure naturalH_pt from canvas.height / (DESIGN_W_PX * SCALE) * PDF_W_PT
│   ├── pdf = new jsPDF({ format: [PDF_W_PT, naturalH_pt] })  ← custom tall page
│   └── addImage at full 612×naturalH_pt, no scaling, PNG format
│
└── Pages 1..N (floor plans)
    ├── Clone with explicit height: 792px; overflow: hidden
    ├── Capture at SCALE=4, JPEG quality 1.0
    └── addPage("letter") then addImage at 612×792
```

This ensures the PDF one-pager is an **exact pixel-perfect replica** of what the user sees in the browser preview — no cramping, no scaling. The user asked "can we use PNG?" — yes, and we should for the one-pager specifically (lossless = sharper text/graphics). Floor plans can stay JPEG since they're primarily photos.
