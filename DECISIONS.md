# Decisions

## 2026-07-18 - Social publishing is review-first

Decision: social syndication plans live under `social/posts/`; the publisher
defaults to dry-run and publishes live only when a maintainer passes platform
credentials through runtime environment variables.

Reason: LinkedIn and Facebook publishing require account/page authorization and
rate-limit-aware API usage. Site deploys should not accidentally post to social
channels, and secrets must not enter source control.

Follow-up: the `Social Publish` GitHub Action may run on demand or by weekly
schedule. It requests live mode only through GitHub Secrets and falls back to
dry-run when credentials are absent, so open-source contributors can review the
automation without seeing private tokens.

## 2026-07-18 - Blog keeps hreflang tied to published posts

Decision: blog reads `.seo/i18n-seo-manifest.json` from the shared Flyto2 i18n
SEO contract, but VitePress emits hreflang alternate links only for posts/pages
that exist in the repository.

Reason: the blog is currently English-first. The SEO contract should prepare
for multilingual expansion without advertising non-existent localized articles.

## 2026-07-15 - Blog owns both automation and security search intent

Decision: the blog homepage, metadata, and AI-readable files must cover AI
workflow automation, open-source AI agent frameworks, MCP server automation,
no-code browser workflows, CTEM, ASM/EASM, dark web, AI security, MSSP/BYO,
pentest, and red-team clusters.

Reason: keyword research shows automation and open-source agent searches are
separate discovery paths from security terms. Blog should educate both paths
and hand off technical mechanics to docs plus product positioning to landing.

## 2026-06-21 - Blog owns educational search intent

Decision: use the blog for concept education, guides, comparisons, and buyer
research questions.

Reason: landing pages should stay product-focused and docs should stay
technical. Blog can answer broad queries while citing product and docs pages for
details.

## 2026-06-21 - Project memory is non-content

Decision: root memory files, workflows, and handoffs are filtered from public
VitePress content.

Reason: internal memory helps agents continue work, but should not be indexed as
public product content.
