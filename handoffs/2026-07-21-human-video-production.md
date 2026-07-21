# 2026-07-21 Human Video Production Handoff

## Scope

Upgraded the Flyto2 review-video renderer from animated cards and product
capture alone to a branded six-scene production with licensed real-human
footage.

## Changes

- Added a reviewed Mixkit human-workflow clip to
  `video/assets/stock-sources.json` with its item page, commercial-use license,
  attribution rule, dimensions, and SHA-256 checksum.
- Added `scripts/fetch-video-assets.mjs` to download only from an allowlisted
  provider host and reject content-type, size, or checksum changes.
- Kept raw third-party footage under ignored `video/dist/`; open-source source
  control contains provenance but does not redistribute the stock file.
- Added a `human-broll` scene to the video plan, template catalog, renderer, and
  artifact QA.
- Added a real public `flyto2.com/cloud/` product recording, neural narration,
  generated ambient audio, transitions, timed burned captions, and six
  final-video verification frames per platform output.
- Added aspect-aware product framing for 16:9, 9:16, and 1:1 renders.
- Raised square-video captions above the footer and enforced per-ratio caption
  bottom margins in artifact QA.

## Verification Plan

- `npm run video:check`
- `npm run video:qa`
- `npm run video:storyboard`
- `npm run lint`
- `npm test`
- `npm run build`
- Run the manual `Video Render` workflow for all variants.
- Inspect all 18 final-video verification frames from the workflow artifact.

## Safety Notes

- The human footage is licensed stock B-roll, not footage of the Flyto2 team.
- The product recording covers the public site and does not use a signed-in
  browser profile or credentials.
- Generated videos remain review-only artifacts and are not auto-published.
- Synthetic narration remains disclosed in generated platform metadata.
