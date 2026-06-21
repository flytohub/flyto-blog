---
title: "Introducing Flyto2: Evidence-Backed CTEM and Security Automation"
description: "Meet Flyto2, a security war room and deterministic execution platform for CTEM, attack surface, code risk, dark web, pentest, red-team, and evidence-backed workflows."
date: 2025-03-05
tags: [announcement, platform, CTEM]
author: Flyto2 Team
cover: /introducing-flyto2.svg
---

Flyto2 started as a deterministic workflow automation platform: a way to run browser actions, API calls, file operations, data transforms, and evidence capture through repeatable modules. That foundation still matters. The product direction is now sharper: Flyto2 is a security war room for evidence-backed CTEM.

<!-- more -->

![The Flyto2 Ecosystem](/introducing-flyto2.svg)

## What Flyto2 is

Flyto2 helps security teams connect signals that usually live in separate tools:

- external attack surface and asset inventory
- code intelligence, SCA, SAST, secrets, license, and reachability findings
- dark web and threat intelligence feeds
- MCP and agent tool-surface risk
- pentest validation and red-team simulation
- reporting, evidence, and remediation workflows

The important point is not that every signal must originate inside Flyto2. Most teams already have scanners, external-rating tools, threat-intel feeds, CI outputs, cloud posture exports, and internal inventories they trust. Flyto2 is designed to integrate those inputs, supplement gaps where useful, correlate the combined picture, and keep evidence attached to the findings that trigger action.

That is why we describe Flyto2 as BYO-friendly. Bring the tools and data you already use. Flyto2 turns them into an operating picture instead of another isolated export.

## Why CTEM needs a war room

Continuous Threat Exposure Management is not just a scan schedule. A CTEM program has a loop:

1. Scope the assets, systems, and exposures that matter.
2. Discover the risks across internal and external surfaces.
3. Prioritize by reachability, ownership, impact, and threat context.
4. Validate high-impact findings with evidence.
5. Mobilize the teams that can fix or reduce the exposure.

Teams often have pieces of that loop, but not the connective tissue. An external attack surface tool finds an exposed host. A code scanner finds a reachable dependency. A dark web feed finds a leaked credential. A pentest creates proof that a path is exploitable. If those findings stay in different dashboards, prioritization becomes guesswork.

Flyto2's war room model is built around correlation. A finding becomes more useful when it is tied to an asset owner, a repository, a service, a credential, a threat feed, and a validation status. The goal is not to make a louder alert queue. The goal is to make the next action easier to justify.

## The execution engine underneath

The war room runs on the same deterministic substrate as Flyto2's automation engine. That engine exposes modules for browser automation, HTTP, data transformation, file I/O, Docker, crypto, validation, reporting, and more. It can run locally, through MCP, or as part of larger workflows.

Deterministic execution matters for security because evidence needs to be repeatable. If a workflow validates a finding, captures screenshots, records response metadata, or generates a report, the team should be able to replay or inspect how that result was produced. Evidence-backed security work depends on provenance.

This is also why Flyto2 supports MCP. AI agents can be useful when they operate through bounded, inspectable tools. By exposing deterministic modules as MCP tools, Flyto2 lets agents perform work while still preserving the operational trail that security teams need.

## The Flyto2 ecosystem

Flyto2 is made of several connected projects:

| Project | Purpose |
|---------|---------|
| [flyto-core](https://github.com/flytohub/flyto-core) | Deterministic execution engine and MCP-compatible module runtime |
| [flyto-indexer](https://pypi.org/project/flyto-indexer/) | Code intelligence, impact analysis, reference search, and repository context |
| [flyto-ai](https://pypi.org/project/flyto-ai/) | Natural language workflow and agent layer |
| [flyto-blueprint](https://pypi.org/project/flyto-blueprint/) | Reusable workflow patterns and learned execution blueprints |

For security teams, these are not separate stories. Code intelligence feeds the war room. The module engine runs validation and evidence capture. MCP support gives agents a controlled tool surface. Blueprints make repeatable workflows easier to share.

## Where to start

If you are evaluating Flyto2 as a security platform, start with the [CTEM landing page](https://flyto2.com/ctem/) and the [Warroom documentation](https://docs.flyto2.com/warroom/). Those pages explain the security operating model.

If you are evaluating Flyto2 as an automation engine, start with the [getting started docs](https://docs.flyto2.com/guide/getting-started), the [core engine docs](https://docs.flyto2.com/core/), and the [module reference](https://docs.flyto2.com/modules/).

If your immediate problem is code risk, read [Code Intelligence with flyto-indexer](/posts/code-intelligence-with-flyto-indexer). If your immediate problem is agent-native tooling, read [Using Flyto2 as an MCP Server](/posts/mcp-server-guide) and the [MCP security docs](https://docs.flyto2.com/warroom/surfaces/mcp-security).

## A careful positioning note

Flyto2 should not be described as a complete replacement for every scanner, external-rating platform, or dark web provider. The stronger and more accurate description is that Flyto2 complements existing tools. It integrates their outputs, adds context, validates what matters, and helps teams act with evidence.

That distinction matters. Security teams do not need another silo. They need a way to connect the tools they already trust into a CTEM workflow that can survive real operational scrutiny.
