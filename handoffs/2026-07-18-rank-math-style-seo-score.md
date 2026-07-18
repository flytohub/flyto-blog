# 2026-07-18 Rank Math-Style SEO Score Handoff

## Scope

Added a CI-native SEO scoring gate for Flyto2 Blog, inspired by Rank Math's
page-level scoring model but implemented for a static VitePress site.

## Changes

- Added `scripts/seo-score.mjs`.
- Added `npm run seo:score`.
- Added `seo:score` to `npm run verify`.
- Added `.seo/reports/` to `.gitignore`.
- Updated the SEO workflow to upload `.seo/reports/seo-score.*` artifacts,
  even when the score gate fails.
- Updated README, posting guide, state, changelog, and tasks.

## Scoring Model

Each built page receives a 0-100 score across:

- technical metadata;
- focus keyword placement;
- content structure and readability;
- links and image metadata;
- AI visibility and brand hygiene.

The gate fails when:

- the homepage score is below `SEO_HOMEPAGE_SCORE_THRESHOLD` (default 88);
- any post score is below `SEO_PAGE_SCORE_THRESHOLD` (default 82);
- the site average is below `SEO_AVERAGE_SCORE_THRESHOLD` (default 88).

## Verification Plan

- `npm run lint`
- `npm run build`
- `npm run seo:score`
- `npm run verify`
- `flyto-indexer verify --full-scan`

## Notes

- The scorer is local-only and does not call search APIs.
- Generated score reports are not source files and should not be committed.
- CI artifacts keep the reports for review.
