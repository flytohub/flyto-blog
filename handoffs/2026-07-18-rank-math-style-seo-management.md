# 2026-07-18 Rank Math-Style SEO Management Handoff

## Scope

Added a local-first SEO management layer on top of the Flyto2 Blog scoring gate.
The goal is to keep Rank Math-style review loops in CI without adding
credentials or WordPress-specific runtime dependencies.

## Changes

- Added `scripts/seo-manage.mjs`.
- Added `npm run seo:manage`.
- Added `seo:manage` to `npm run verify`.
- Added syntax checking for `scripts/seo-manage.mjs` to `npm run lint`.
- Updated the SEO workflow artifact upload to include `seo-management.*`.
- Added `.env.example` for SEO thresholds and optional data inputs.
- Added `.seo/search-console/README.md` for local Search Console CSV formats.
- Updated README, posting guide, state, changelog, tasks, and registry.

## Management Model

The report writes:

- page-level score opportunities;
- keyword coverage gaps from the keyword matrix and i18n SEO manifest;
- rank targets from `rank-targets.csv` or generated keyword-matrix targets;
- optional Search Console striking-distance and low-CTR opportunities;
- internal-link suggestions;
- editor recommendations;
- focus-keyword cannibalization checks.

Search Console data is optional by default. Set
`SEO_MANAGEMENT_REQUIRE_GSC=true` only when CI has CSV exports available.

## Verification Plan

- `npm run lint`
- `npm run build`
- `npm run seo:score`
- `npm run seo:manage`
- `npm run verify`
- `flyto-indexer verify --full-scan`

## Notes

- Raw Search Console CSV/JSON exports are ignored by Git.
- No Google tokens, OAuth files, or API credentials are required.
- Generated SEO management reports are CI artifacts, not source files.
