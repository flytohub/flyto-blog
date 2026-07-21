# Flyto2 Video Production

This directory stores reviewable video plans and generated draft artifacts for
YouTube, Shorts, and social clips. Plans are content, not credentials.

## Commands

```bash
npm run video:check
npm run video:qa
npm run video:from-post -- posts/community-growth-open-source-ai-workflow-automation.md --out video/plans/community-growth-open-source-ai-workflow-automation.json --force
npm run video:storyboard
npm run video:render -- --variant youtube-shorts
```

`video:check` is the CI-safe path. It validates plan shape, canonical links,
Flyto2 brand usage, credential hygiene, asset licensing notes, SEO metadata,
thumbnail candidates, platform variants, and private-first YouTube metadata.

`video:qa` runs `video:check` plus release-style review checks for long-tail
keywords, mobile-safe thumbnail copy, Shorts duration, narration drafts, and
canonical source links.

`video:from-post` creates a reviewable plan from a Markdown post. It parses the
frontmatter and headings, keeps the blog post as the canonical source URL, and
drafts scenes, narration, title candidates, long-tail keywords, thumbnails, and
the three default outputs.

`video:storyboard` generates review artifacts without external tools:

- `storyboard.html`
- SVG title-card frames
- SVG thumbnail candidates
- `captions.srt`
- `voiceover-script.txt`
- `youtube-metadata.json`
- `manifest.json`

Frames and thumbnail candidates embed the official transparent Flyto2 logo from
`video/assets/flyto2-logo.png`. Keep that owned brand asset in the repository so
local rendering and the GitHub Action produce identical branded output.

`video:render` additionally requires `ffmpeg` and `rsvg-convert` to create an
MP4. The manual `Video Render` GitHub Action installs those tools and uploads
the generated artifact. By default it renders every output. Use `--variant` to
render one output, such as `youtube-landscape`, `youtube-shorts`, or
`linkedin-square`.

## Plan Shape

Every plan should include:

- `seo.primaryKeyword`, `seo.longTailKeywords`, `seo.titleCandidates`, and
  `seo.hashtags`.
- `outputs` for YouTube 16:9, YouTube Shorts 9:16, and LinkedIn 1:1.
- At least three `thumbnails`.
- Per-scene `narration` and `visualCue` fields.
- A YouTube description that links back to the canonical blog post.

## Open-Source Rules

- Do not commit YouTube OAuth tokens, refresh tokens, cookies, app secrets, or
  generated API responses.
- Keep generated videos private-first until a maintainer reviews them.
- Use owned screenshots, original diagrams, permissively licensed assets, or
  generated title cards only.
- Mark `aiDisclosureRequired` truthfully when a video uses realistic synthetic
  people, voices, events, places, or altered footage.
- Do not wire video rendering to site deployment; publishing is a separate
  maintainer-controlled workflow.
- Keep generated artifacts under `video/dist/`; do not commit rendered MP4s or
  generated review files.
