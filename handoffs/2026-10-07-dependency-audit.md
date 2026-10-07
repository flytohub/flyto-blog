# Dependency audit fix

Owner: claude
Branch: claude/fix-dependency-audit (PR #23)
Date: 2026-10-07

## What changed

- `package-lock.json`: `npm audit fix` — vue/@vue/* 3.5.29 -> 3.5.43,
  js-yaml 3.15.1 -> 3.15.2, source-map-js 1.2.1 -> 1.2.2 (no range changes).
- `scripts/security-regressions.test.mjs`: symlink cleanup uses `unlinkSync`
  instead of `rmSync` (EISDIR on Node 23+ left `.security-path-link-<pid>`).
- `docs/reference/README.md`: regenerated fingerprint. `CHANGELOG.md`: entry.

## Why

The scheduled Security run on main failed `npm audit --audit-level=high` on
GHSA-g2v6-rqmx-r4w6 (vue SSR XSS), GHSA-2883-xcg3-v3hh, GHSA-68fv-2mgg-jv7q.

## Verified

- `npm ci && npm run verify`: pass (tests 14/14, build, links, SEO gates).
- `npm audit --audit-level=high`: 0 high.
- `flyto-index verify . --full-scan --strict`: no FAIL/WARN.

## Not verified

- Lighthouse job runs only in CI.

## Follow-ups

- `sprintf-js` (moderate, GHSA-hp3w-g68c-fv3c) via gray-matter -> js-yaml@3 ->
  argparse@1 has no patched release; revisit if gray-matter moves to js-yaml 4.
