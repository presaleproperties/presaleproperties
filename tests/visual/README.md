# Visual Regression Tests

End-to-end Playwright suite that screenshots key pages and diffs them against
committed baselines. A diff fails CI — the safety net for theme/styling drift.

## Layout

```
tests/visual/
  helpers.ts            Shared page-stabilization (fonts, animations, images)
  global-setup.ts       Logs in admin once, persists session for admin specs
  public.spec.ts        Homepage, About, Blog, Presale Projects, Contact
  admin.spec.ts         Admin Overview, Leads, Blogs (auth-gated)
  __screenshots__/      Committed baseline PNGs (one per page × project)
  .auth/                gitignored — runtime auth state
```

Each spec runs across 3 projects defined in `playwright.config.ts`:
mobile (375×812), tablet (768×1024), desktop (1440×900).

## Commands

```bash
bun run test:visual           # Run suite, fail on diff
bun run test:visual:update    # Regenerate baselines (after intentional theme change)
bun run test:visual:report    # Open HTML report from last run
```

Narrow scope while iterating:

```bash
bunx playwright test tests/visual/public.spec.ts --project=desktop
bunx playwright test -g "home"
```

## First-time setup

```bash
bunx playwright install chromium    # one-time browser download
bun run test:visual:update          # generate initial baselines
git add tests/visual/__screenshots__ # commit them
```

## Admin tests (optional)

Admin specs auto-skip unless these env vars are set:

```
VR_ADMIN_EMAIL=test-admin@example.com
VR_ADMIN_PASSWORD=••••••
```

Add them to `.env.local` (gitignored) for local runs, or to CI secrets.
The login flow runs once per test invocation and the resulting session is
reused across every admin spec.

## When a test fails

1. Open the HTML report (`bun run test:visual:report`) — diff images are
   rendered side-by-side: expected | actual | diff.
2. If the change is intentional (you updated a token, changed copy on a
   marketing page, etc.), regenerate the baseline:
   `bun run test:visual:update` then commit the new PNGs.
3. If the change is unexpected, investigate the regression before merging.

## Stability tips

- The `stabilizePage` helper disables animations, waits for fonts and
  images, and hides marquee/embedded-map iframes. Add `data-vr-hide` to
  any element that needs to be excluded from the screenshot.
- Avoid time-sensitive copy ("posted 3 minutes ago") on screenshotted
  surfaces — use static dates or hide the element.
