# 2026-07-18 Community Social Syndication Handoff

## Scope

Added a community growth post, dry-run-first publisher, and guarded GitHub
Action for social publishing.

## Changes

- Added `posts/community-growth-open-source-ai-workflow-automation.md`.
- Added `social/posts/community-growth-open-source-ai-workflow-automation.json`.
- Added `social/README.md`.
- Added `scripts/social-publish.mjs` with dry-run default and live adapters for
  LinkedIn Posts API and Facebook Page feed publishing.
- Added `scripts/audit-social-publisher.mjs` and package scripts
  `social:check`, `social:dry-run`, and `social:publish`.
- Added `.github/workflows/social-publish.yml` for manual or weekly publishing
  with dry-run fallback when LinkedIn/Facebook secrets are absent.
- Added the community post to source/SEO audits, navigation, and AI-readable
  indexes.

## Verification Plan

- `npm run social:check`
- `npm run test`
- `npm run build`
- `npm run audit:seo`
- `npm run verify`

## Safety Notes

- No social credentials are stored in source.
- Live publish requires runtime environment variables.
- Deploying the blog does not publish to social channels.
- The scheduled GitHub Action requests live mode, but it exits successfully with
  a dry-run artifact when required secrets are missing.
