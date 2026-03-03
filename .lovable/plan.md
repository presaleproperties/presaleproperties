
## Root Cause

There are two separate rendering systems:
1. **Browser preview** → `OnePagerPreview` (HTML/CSS, rendered by Chromium)
2. **Downloaded PDF** → `CampaignPDFDocument` (react-pdf/renderer, uses its own PDF layout engine)

These two engines interpret layout, fonts, spacing, and flexbox differently. No amount of style-tweaking will make them match — they are fundamentally different renderers. The react-pdf engine does not support CSS grid, gradient backgrounds, `textDecoration: line-through` reliably, emoji in circles, custom fonts, etc.

## Options

### Option A — Capture the HTML preview directly (html2canvas → PDF)
**How it works:** Screenshot the existing `OnePagerPreview` HTML at high resolution using `html2canvas` at `scale: 4`, embed as a single image in a jsPDF page. Floor plan pages use the same approach — capture each floor plan HTML block.

**Pros:**
- PDF is a **pixel-perfect screenshot** of exactly what you see in the browser preview
- One rendering engine (Chromium/html2canvas) = zero alignment gap
- All CSS features work: gradients, grid, flexbox, emoji, custom fonts

**Cons:**
- Result is a raster image inside a PDF (not vector text) — but at 4x scale this is ~2448px wide, which is well above print quality
- File size ~3–6 MB for a 5-page document

### Option B — Fix and align the react-pdf component to match the HTML preview
**How it works:** Manually re-tune every font size, padding, margin, and color in `CampaignPDF.tsx` until the react-pdf output visually matches the HTML preview.

**Pros:**
- Vector PDF with selectable text
- Smaller file size (~200–400 KB)

**Cons:**
- React-pdf does not support CSS grid → floor plan cards would need manual width math
- React-pdf does not support gradient backgrounds → green incentive section loses gradient
- React-pdf's font metrics differ from browser fonts → can never be a true pixel match
- Any future change to the preview requires a parallel change in the PDF component
- Ongoing maintenance burden — two codebases for one design

### Option C — Print-to-PDF via browser window.print() (CSS @media print)
**How it works:** Style the HTML preview with `@media print` CSS and trigger `window.print()`. The browser prints exactly what it renders.

**Pros:**
- True pixel match, uses the same Chromium renderer as the preview
- Vector text (browser PDF export is vector)
- Zero dependency changes

**Cons:**
- User sees the browser's native "Print" dialog — not a direct download
- Print dialog varies by OS/browser
- Page break control is limited — multi-page needs careful CSS

---

## Recommendation: Option A

Option A is the right choice here because:
- It guarantees **exact visual fidelity** to the preview — no tuning needed
- It works reliably in all browsers with no print dialog
- At `scale: 4`, the quality is ~2448 × 3168px (above 4K) — indistinguishable from vector for a marketing PDF
- The floor plan pages already have a fixed 612×792 container in HTML, so they capture cleanly

## Implementation Plan (Option A)

### Step 1 — Restore html2canvas + jsPDF as the PDF engine
- Re-add `html2canvas` to the project (it's already installed)
- Remove `PDFDownloadLink` from the action bar
- Replace with a `Button` that calls an async `generatePDF()` function

### Step 2 — Capture the one-pager
```
1. Query #one-pager-preview
2. Clone it into an off-screen host div (position: fixed; left: -9999px; width: 612px)
3. Wait 2 animation frames for layout
4. html2canvas(clone, { scale: 4, useCORS: true, allowTaint: true, logging: false })
5. const pdf = new jsPDF({ unit: "pt", format: [612, clone.offsetHeight] })
6. pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 612, clone.offsetHeight)
```

### Step 3 — Capture each floor plan page
```
For each .floor-plan-page element:
  1. Same off-screen clone pattern (width: 612, height: 792)
  2. html2canvas at scale: 4
  3. pdf.addPage([612, 792], "pt")
  4. pdf.addImage(...)
```

### Step 4 — Save
```
pdf.save(`${projectName}-exclusive.pdf`)
```

### Step 5 — Remove CampaignPDF.tsx (optional cleanup)
The react-pdf component becomes unused — can be deleted or kept for future reference.

### Files to change
- `src/pages/admin/AdminCampaignBuilder.tsx` — swap PDFDownloadLink for button + generatePDF()
- `src/components/admin/CampaignPDF.tsx` — can be removed (no longer used)
- `package.json` — remove `@react-pdf/renderer`, keep `html2canvas` + `jspdf`

### Quality note
At `scale: 4` with JPEG 0.95:
- One-pager: ~2448px wide (exceeds 2K)  
- Floor plan pages: 2448 × 3168px (exceeds 4K height)
- File size estimate: ~2–4 MB for a 5-page PDF — acceptable for a marketing document
