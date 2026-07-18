# Flyto2 Video Production

This directory stores reviewable video plans and generated draft artifacts for
YouTube, Shorts, and social clips. Plans are content, not credentials.

## Commands

```bash
npm run video:check
npm run video:storyboard
npm run video:render
```

`video:check` is the CI-safe path. It validates plan shape, canonical links,
Flyto2 brand usage, credential hygiene, asset licensing notes, and private-first
YouTube metadata.

`video:storyboard` generates review artifacts without external tools:

- `storyboard.html`
- SVG title-card frames
- `captions.srt`
- `youtube-metadata.json`

`video:render` additionally requires `ffmpeg` and `rsvg-convert` to create an
MP4. The manual `Video Render` GitHub Action installs those tools and uploads
the generated artifact.

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
