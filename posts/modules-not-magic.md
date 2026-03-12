---
title: "We Don't Do Magic Prompts"
description: "Why Flyto2 uses 412 validated modules instead of letting AI write code from scratch. Deterministic automation that you can actually debug."
date: 2026-03-13
tags: [engineering, announcement]
author: Flyto2 Team
cover: /modules-not-magic.svg
---

Most AI automation tools sell you a dream: *"Just tell the AI what you want and it figures it out."*

We tried that. It doesn't work.

<!-- more -->

![Modules, Not Magic](/modules-not-magic.svg)

## The Honest Problem With AI Agents

Here's what actually happens when an AI agent "writes code for you":

The AI guesses a shell command. Runs it. Gets an error. Tries a different approach. Maybe it works, maybe it doesn't. You get a result — but you have no idea what it did, you can't reproduce it tomorrow, and if it breaks halfway through, you start over.

We've been building automation tools for a while now. We've seen this pattern play out hundreds of times. The issue isn't that AI is bad — it's that **letting an AI improvise code on every run is the wrong architecture for automation.**

Automation should be boring. Predictable. Debuggable.

## What We Actually Built

Flyto2 has **412 pre-built, schema-validated modules**. When you ask it to do something, the AI doesn't write code. It picks the right module and fills in the parameters.

```
"Screenshot this page"  →  browser.screenshot  →  validated, traced, reproducible
"Extract all links"     →  browser.extract      →  same params = same result
"Send a Slack alert"    →  notification.slack   →  schema-checked before execution
```

Every parameter is validated before it runs. Every step is traced with timing and I/O. If step 6 out of 12 fails, you fix the issue and resume from step 6.

```
Step  1/12  browser.launch         ✓      420ms
Step  2/12  browser.goto           ✓    1,203ms
Step  3/12  browser.evaluate       ✓       89ms
Step  4/12  browser.screenshot     ✓    1,847ms
Step  5/12  browser.viewport       ✓       12ms
Step  6/12  browser.screenshot     ✗    timeout

→  flyto replay --from-step 6
→  Steps 1-5 are instant. Only step 6 re-executes.
```

No black box. You see exactly what happened and why.

## Data Speaks Louder Than Prompts

We don't believe in "prompt engineering" as a product feature. A good prompt might work today and break when the model updates tomorrow. Instead, we put the intelligence in the **modules and schemas**, not in clever prompt wording.

Here's what that means in practice:

**Schema validation catches errors before execution.** If you pass a string where a number is expected, it fails immediately with a clear message — not three steps later with a cryptic traceback.

**412 modules encode real-world knowledge.** Browser quirks, timeout handling, retry logic, encoding edge cases — these are solved once in the module, not re-discovered by the AI on every run.

**Blueprints learn from success, not from prompts.** When a workflow works, Flyto2 saves it as a reusable pattern. Next time, it loads the proven blueprint instead of asking the AI to figure it out again.

- First run: AI selects modules, builds workflow — ~15 seconds
- Second run: loads saved blueprint, zero AI cost — ~3 seconds
- Every run after: same blueprint, still reliable — ~3 seconds

The AI gets out of the way as fast as possible. That's by design.

## 100% Local

Flyto2 runs on your machine. Your data, your credentials, your screenshots — nothing leaves your computer. There's no cloud dependency and no third-party data processing.

## What People Use It For

- Pull data from websites that don't have APIs
- Fill the same form with hundreds of rows from a spreadsheet
- Monitor pages for changes and get alerts
- Run health checks on internal systems
- Batch-process files — rename, convert, compress, upload

## Open Source Core

The engine behind Flyto2 is fully open source: [flyto-core](https://github.com/flytohub/flyto-core) — 412 modules, Apache-2.0 licensed.

```bash
pip install flyto-core[browser]
flyto recipe competitor-intel --url https://example.com/pricing
```

Pair it with [flyto-ai](https://github.com/flytohub/flyto-ai) for natural language:

```
❯ extract all product names and prices from example.com, save as CSV
```

The AI picks from validated modules. Same input, same output. Every time.

## Try It

**[flyto2.com](https://flyto2.com)** — Free download for Windows, macOS, and Linux. No account required.

We believe automation should be debuggable, reproducible, and transparent. If you're tired of magic prompts that work on Tuesdays and break on Wednesdays, give Flyto2 a try.
