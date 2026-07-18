# Flyto2 Social Syndication

This directory stores reviewable social publishing plans. Plans are content,
not credentials.

## Commands

```bash
npm run social:check
npm run social:dry-run
npm run social:publish -- --plan social/posts/community-growth-open-source-ai-workflow-automation.json --live
```

`social:dry-run` is the default safe path. It prints the payloads that would be
sent to each supported channel and the environment variables needed for live
publishing.

## GitHub Automation

`.github/workflows/social-publish.yml` runs `npm run social:check`, then either
publishes live or writes a dry-run artifact:

- `workflow_dispatch` lets a maintainer pick the plan and choose live mode.
- The weekly schedule requests live mode, but downgrades to dry-run when any
  required secret is missing.
- Live mode only reads GitHub Secrets at runtime; the repository stores plans,
  scripts, and audit rules, never credentials.

## Live Credentials

Live publishing reads credentials only from runtime environment variables:

| Channel | Required variables |
|---------|--------------------|
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` |
| Facebook Page | `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` |

Optional variables:

- `LINKEDIN_VERSION`: LinkedIn Marketing API version header in `YYYYMM` format.
- `META_GRAPH_VERSION`: Meta Graph API version, for example `v25.0`.

Do not commit tokens, refresh tokens, app secrets, cookies, local account data,
or generated live API responses that expose private identifiers.

## Platform Notes

- LinkedIn publishing uses the Posts API with `Authorization`,
  `X-Restli-Protocol-Version`, and `Linkedin-Version` headers.
- Facebook Page publishing uses the Page feed endpoint with a Page access token.
- Manual channels such as GitHub Discussions, YouTube descriptions, package
  pages, Reddit, or Hacker News remain checklist items until a maintainer
  chooses a dedicated integration.
