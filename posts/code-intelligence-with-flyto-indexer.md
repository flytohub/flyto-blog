---
title: "Code Intelligence with flyto-indexer"
description: "Code intelligence with flyto-indexer gives AI agents and security teams impact analysis, references, dependency maps, dead-code detection, taint analysis, and health scoring."
focusKeyword: "code intelligence"
date: 2025-03-05
tags: [tutorial, indexer, mcp, code security]
author: Flyto2 Team
cover: /code-intelligence.svg
---

flyto-indexer gives AI agents and security teams a structured view of a codebase: symbols, references, imports, dependency edges, routes, test relationships, hotspots, dead code, taint flow, and change impact. That context is useful for coding tasks, but it is also a core part of evidence-backed security work.

<!-- more -->

![Know What Breaks Before You Change It](/code-intelligence.svg)

## The problem: findings without code context

Security findings are often technically correct but operationally incomplete. A dependency scanner can tell you that a package has a CVE. A static analyzer can flag a tainted path. A secret scanner can find a token-shaped string. Those signals still leave important questions unanswered:

- Is the vulnerable function reachable from application code?
- Which service, owner, or API route is affected?
- What tests should run before a fix ships?
- Will changing a shared function break other projects?
- Is the finding part of a larger pattern or a one-off issue?

Without code intelligence, teams fall back to manual triage. That slows remediation and increases false-positive fatigue. flyto-indexer is designed to make the codebase itself queryable so the surrounding context is available before a developer or agent changes anything.

## What flyto-indexer builds

flyto-indexer scans a project and builds an index of files, symbols, dependencies, references, routes, types, framework conventions, and quality signals. It can be used from the CLI or as an MCP server, which lets AI coding agents ask structured questions instead of relying only on text search.

Install and scan a repository:

```bash
pip install flyto-indexer
flyto-index scan /path/to/project
```

Once indexed, you can inspect the project through targeted tools: search, impact analysis, dependency exploration, documentation scans, secret scans, architecture checks, and taint analysis.

## Impact analysis before changes

The first use case is impact analysis. Before changing a shared function, API handler, route contract, or utility module, ask what depends on it:

```text
impact("process_refund", change_type="signature_change")
```

A useful impact result should identify references, likely callers, related tests, cross-project dependencies, and risk areas. That matters for AI-generated code because the agent should understand blast radius before editing. It also matters for security remediation because a rushed fix can create a new outage or bypass.

In Flyto2 Warroom, code impact is part of the broader prioritization model. A finding that touches a widely used path, a public API route, or a recently changed hot file deserves different treatment from an isolated finding in dead code.

## Dead code and reachability

Not every finding deserves the same response. If a vulnerable dependency is present but no reachable path uses the vulnerable function, the remediation priority may change. If a SAST finding lives in an unreferenced function, it may still deserve cleanup, but it should not be ranked the same way as a reachable path behind a public endpoint.

flyto-indexer helps answer these questions by mapping symbol references and dependencies. It can also surface dead code candidates:

```text
audit(focus="dead_code")
```

Dead-code detection should not be treated as automatic deletion. It is a triage input. The practical workflow is to inspect references, confirm framework entry points, run tests, and then remove or de-prioritize with confidence.

## Taint analysis and security sinks

For application security, the important question is often data flow: can untrusted input reach a dangerous sink?

flyto-indexer supports taint-style checks and project-specific rules. A team can declare custom sources, sinks, and sanitizers so the analysis reflects local conventions. Examples include custom request wrappers, shell-out helpers, template renderers, deserializers, or internal sanitization functions.

This matters because generic SAST can miss local abstractions. A project-specific taint rule turns tribal knowledge into repeatable analysis.

## MCP support for AI agents

As an MCP server, flyto-indexer gives coding agents tools for codebase understanding. Instead of asking an agent to infer everything from a few open files, you can let it query the index:

- find relevant code by natural language or symbol name
- inspect imports and dependents
- map a planned change to affected tests
- check architecture layer rules
- scan secrets before a commit
- validate that a refactor does not cross a forbidden boundary

This is the safer pattern for agentic coding. The agent can still generate code, but it does so with structured context and verification gates.

## How it fits into Flyto2

flyto-indexer is part of the Flyto2 security story because code risk is one of the surfaces in a CTEM program. Code findings become more valuable when they are connected to asset exposure, dark web signals, MCP/tool-surface risk, pentest validation, and remediation workflow.

Relevant pages:

- [Code Intelligence docs](https://docs.flyto2.com/warroom/surfaces/code-intelligence)
- [flyto-indexer docs](https://docs.flyto2.com/indexer/)
- [CTEM overview](https://flyto2.com/ctem/)
- [AI Security Platform Guide](/posts/ai-security-platform-guide)
- [Using Flyto2 as an MCP Server](/posts/mcp-server-guide)

## Practical adoption path

Start by indexing one repository and using impact analysis during code review. Then add secret scanning, dead-code review, and architecture rules. Once those signals are useful locally, feed them into the war room so code risk can be correlated with assets, exposure, and evidence-backed validation.

That progression keeps code intelligence grounded. The index is not useful because it produces more findings. It is useful because it helps teams decide what to change, what to test, and what evidence supports the decision.
