# Flyto2 Video Production

This directory stores reviewable video plans and generated draft artifacts for
YouTube, Shorts, and social clips. Plans are content, not credentials.

## Commands

```bash
npm run video:check
npm run video:qa
npm run video:from-post -- posts/community-growth-open-source-ai-workflow-automation.md --out video/plans/community-growth-open-source-ai-workflow-automation.json --force
npm run video:storyboard
npm run video:capture -- --plan video/plans/community-growth-open-source-ai-workflow-automation.json
npm run video:voiceover -- --plan video/plans/community-growth-open-source-ai-workflow-automation.json --required
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

`video:capture` records the configured public Flyto2 product URL with
Playwright. The capture allowlist is restricted to `flyto2.com` and its
subdomains. It does not read credentials or browser profile data.

`video:voiceover` turns the reviewed scene narration into audio with
`edge-tts`. The generated YouTube metadata must disclose synthetic narration.
The command needs network access but no committed token or API key.

`video:render` additionally requires `ffmpeg` and `rsvg-convert` to create an
MP4. The manual `Video Render` GitHub Action installs those tools and uploads
the generated artifact. By default it renders every output. Use `--variant` to
render one output, such as `youtube-landscape`, `youtube-shorts`, or
`linkedin-square`.

Production MP4s include:

- `editorial`, `signal`, `proof`, and `product-demo` scene templates;
- subtle pan motion and deterministic cross-scene transitions;
- a live public Flyto2 product capture;
- neural voiceover, generated low-volume ambient audio, and final loudness
  limiting;
- burned captions sized for 16:9, 9:16, and 1:1 output.

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
- Disclose synthetic narration in platform metadata.
- Use owned screenshots, original diagrams, permissively licensed assets, or
  generated title cards only.
- Mark `aiDisclosureRequired` truthfully when a video uses realistic synthetic
  people, voices, events, places, or altered footage.
- Do not wire video rendering to site deployment; publishing is a separate
  maintainer-controlled workflow.
- Keep generated artifacts under `video/dist/`; do not commit rendered MP4s or
  generated review files.
