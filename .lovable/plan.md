
## Root Cause Analysis

The one-pager preview renders at 612px wide in the browser, but it's displayed inside a **scrollable container** — the browser is the one doing the "fitting" visually. The `#one-pager-preview` div has `overflow: "visible"` which means its content can visually spill but `scrollHeight` may not capture everything (especially absolutely-positioned elements like the hero image, floating badges, and the bottom price text).

The core issues:

1. **`overflow: "visible"` means `scrollHeight` is unreliable** — elements positioned `absolute` or overflowing don't add to `scrollHeight`. The hero section alone is `290px` tall. The `captureH = el.scrollHeight` may be returning less than the true visual height, so `html2canvas` clips the bottom.

2. **`html2canvas` captures the element at its own coordinate space**, but when the element is inside a scaled/scrolled container, `x: 0, y: 0` may not align with the visual top of the element. The element might be partially scrolled out of view.

3. **The preview wrapper has `overflow-auto`** — if the user has scrolled, the capture origin shifts.

4. **`backgroundColor: null`** combined with absolutely positioned children can cause transparent gaps that don't get measured.

## The Fix: Off-Screen Clone Approach (Isolated Render)

The most reliable approach is to **clone the OnePagerPreview into an isolated, off-screen container** with:
- Fixed position far off-screen (`position: fixed; left: -9999px; top: 0`)
- No overflow clipping (`overflow: visible`)
- Known fixed width: exactly `612px`
- **Measure `offsetHeight` after a layout paint** (not `scrollHeight`)
- Capture the clone, then remove it

This decouples the capture from scroll position, parent overflow, and any CSS transforms applied to the preview container.

Additionally: the `print-root` wrapper has `transformOrigin: "top left"` — if any CSS scale transform is being applied to fit the preview into the panel, `html2canvas` will capture the transformed (shrunk) version, not the true 612px version.

## Plan

### Change 1 — Isolated off-screen clone for the one-pager
Instead of querying `.pdf-page` from the live DOM, clone only the `#one-pager-preview` element into a fresh `div` appended to `document.body`:
```
const clone = el.cloneNode(true) as HTMLElement;
const host = document.createElement("div");
host.style.cssText = "position:fixed;left:-10000px;top:0;width:612px;overflow:visible;z-index:-1;";
host.appendChild(clone);
document.body.appendChild(host);
await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const captureH = host.offsetHeight; // reliable, no scroll offset
```

### Change 2 — Remove CSS transform from print-root wrapper
The `print-root` div has `transformOrigin: "top left"` — strip any `transform: scale(...)` that may be applied for the visual preview fit. Use a CSS class instead of inline styles for the visual scaling, so the DOM element itself stays at true 1:1 size.

### Change 3 — Force explicit background color on the clone
Set `clone.style.background = "#0f0f0f"` (or the actual dark background) on the clone so `html2canvas` doesn't produce a transparent canvas that the PDF renders incorrectly.

### Change 4 — Use `offsetHeight` not `scrollHeight`
`offsetHeight` includes all rendered height including padding/borders. For an off-screen clone at `width: 612px` with `overflow: visible`, this gives the true total height of all content.

### Change 5 — Bump SCALE to 10 for true 2K+
At 612px design width × 10 = 6120px render width — genuine 2K+ (2160px = 4K threshold is 3840px, so 6120px exceeds it). Keeps existing "NONE" compression.

## Summary of changes (all in `AdminCampaignBuilder.tsx`)

```text
generatePDF()
├── For the one-pager:
│   ├── Clone #one-pager-preview into an isolated off-screen host div
│   ├── Wait 2 animation frames for layout
│   ├── Measure host.offsetHeight (reliable total height)
│   ├── Run html2canvas on the clone (not the live DOM element)
│   ├── Remove the host from DOM after capture
│   └── Create PDF with [612, offsetHeight] custom page — zero scaling
│
└── print-root wrapper:
    └── Remove transformOrigin / any scale transforms from inline style
        (visual scaling for preview panel = separate CSS class only)
```

This eliminates the compression by ensuring the captured element is never subject to scroll offsets, parent overflow clipping, or CSS transforms.
