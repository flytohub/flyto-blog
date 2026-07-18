# 2026-07-18 Video Pipeline Upgrade Handoff

## Scope

Upgraded the Flyto2 blog video pipeline from a single storyboard/MP4 starter
into a reviewable multi-platform production workflow.

## Changes

- Added `scripts/video-from-post.mjs` to create video plans from Markdown posts.
- Added `scripts/video-qa.mjs` for release-style video SEO and review checks.
- Upgraded `scripts/render-video.mjs` to render every output variant or one
  selected variant.
- Upgraded `scripts/video-plan-check.mjs` to validate SEO keywords, long-tail
  keywords, platform outputs, thumbnail candidates, narration drafts, and
  private-first YouTube metadata.
- Updated the community video plan with:
  - 16:9 YouTube output;
  - 9:16 YouTube Shorts output;
  - 1:1 LinkedIn output;
  - three thumbnail candidates;
  - title candidates, hashtags, and long-tail keywords;
  - per-scene narration and visual cues.
- Updated the manual `Video Render` workflow with a `variant` input and 14-day
  artifact retention.
- Updated README, posting guide, state, changelog, and tasks.

## Verification Plan

- `npm run video:check`
- `npm run video:qa`
- `npm run video:storyboard`
- `npm run lint`
- `npm run verify`
- `flyto-indexer verify --full-scan`

## Safety Notes

- The workflow remains artifact-only; it does not upload to YouTube.
- YouTube metadata remains `private` or `unlisted` only.
- Generated files stay under `video/dist/` and should not be committed.
- No platform credential, OAuth token, refresh token, API response, or cookie is
  stored in the repo.
