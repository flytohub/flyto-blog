# Documentation Index

This directory holds durable documentation for `flyto-blog`.

Start with these root memory files:

- `../PROJECT.md`
- `../ARCHITECTURE.md`
- `../STATE.md`
- `../ROADMAP.md`
- `../DECISIONS.md`
- `../tasks.md`

Frontend or public-surface documentation must follow the Flyto2 Frontend Quality Gate in `../AGENTS.md`.

## Repository Contracts

- [Technical and editorial whitepaper](WHITEPAPER.md)
- [Generated source and content reference](reference/README.md)
- [Editorial inventory](reference/posts-01.md)
- [Automation and environment inputs](reference/automation.md)
- [Social and video distribution](reference/distribution.md)
- [Public discovery and assets](reference/discovery-assets.md)

Regenerate these references with `npm run docs:reference`; verify ownership and
drift with `npm run docs:check`.
