---
title: "Unified Security Scoring: One Number Across Nine Surfaces"
description: "Unified security scoring guide: compute a 250-900 score across code, attack surface, diligence vectors, modifiers, grade caps, and evidence."
focusKeyword: "unified security scoring"
date: 2026-06-10
tags: [security, scoring]
author: Flyto2 Team
cover: /security/unified-scoring.jpg
---

A security rating is only useful if a board member can read one number and a security engineer can trace that number all the way back to the finding that moved it. Most tools give you one or the other: a tidy grade with no evidence, or a flood of findings with no grade. Unified security scoring has to do both — collapse nine independently-closed-loop surfaces into a single value on a **250–900** band, and keep every point on the curve reproducible from its inputs.

<!-- more -->

![Nine independently-closed-loop surfaces folding into one 250–900 unified security score across code security, attack surface, and diligence categories with their sub-vectors](/security/unified-scoring.jpg)

## What a unified security score is

In the Flyto2 Warroom, the **unified security score** is a single number on the industry-standard **250–900** band, mapped to an **A–F** grade. It is not a vanity metric bolted on after the fact. It is the convergence point where nine surfaces — external attack surface, code intelligence + code red-team, MCP security, container/runtime + cloud identity, darkweb/threat-intel, footprint/attribution, asset map, pentest, and red-team simulation — fold into one operational picture without losing the audit trail underneath.

The important design choice up front: the score is **not customizable per organization**. Every org is evaluated with the same weights, boundaries, and formulas. That is what makes scores comparable across organizations and what prevents score gaming — you cannot tune your own grade. A unified security rating is only meaningful if the same inputs always produce the same number.

## Nine surfaces, three categories

The unified score is **not** an average of nine surface scores. The nine surfaces fold into three top-level categories, each weighted to reflect how much it actually tells you about exploitable risk:

| Category | Weight | Which surfaces roll up | Sub-vectors |
|----------|--------|------------------------|-------------|
| **Code Security** | ~40% | code intelligence + code red-team, container/runtime, pentest verdicts on code | 5 — CVE findings, exposed secrets, taint flows, SAST, malware |
| **Attack Surface** | ~35% | external attack surface / exposure, asset map, footprint, darkweb / leak exposure | 11 — TLS, web headers, DNS, ports, sensitive files, API, email, breach, threat-intel, IP intel, WAF |
| **Diligence** | ~25% | operations / compliance, scan coverage, triage, MTTR, supply chain | 5 — coverage, licenses, triage, supply chain, remediation speed |

Code Security carries the most weight because exploitable, unpatched, internet-reachable code is the thing that actually gets organizations breached. Attack Surface is close behind because it is what an attacker sees before they touch your code. Diligence — coverage, triage discipline, mean-time-to-remediate — is the slower-moving signal that tells you whether the first two are being managed or just measured.

## The sub-vector model

Each category is not a single dial. It is a roll-up of **sub-vectors**, and the sub-vectors are where the honesty lives. Code Security has 5 sub-vectors, Attack Surface has 11, and Diligence has 5 — twenty-one measured facets in total, each one scored on its own evidence and rolled up under its category weight.

This granularity matters for two reasons. First, it means the score can explain itself: a B that drops to a C can point at the exact sub-vector — say, a new exposed-secret finding or a TLS regression — instead of waving at a category. Second, and more importantly, it lets the score be honest about partial knowledge. A category is rarely "fully known" or "fully unknown." It is usually some sub-vectors with confident verdicts and some still collecting data, and the sub-vector model preserves that distinction instead of flattening it into one falsely-confident number.

## Three scoring modes

A unified security rating has to adapt to what you have actually connected. A surface you never integrated should not silently drag your grade down with zeros. The score runs in one of three modes:

| Mode | When | What's scored |
|------|------|---------------|
| **Internal** | Repos connected, no domains | Code Security + Diligence |
| **External** | Domains added, no repos | Attack Surface |
| **Combined** | Both repos and domains | All categories + cross-dimensional correlation |

A facet that isn't in your active mode isn't penalized as a zero — it simply isn't in the active picture. This is the difference between "we don't know your attack surface because you haven't connected domains" and "your attack surface is terrible." The first is honest; the second is a lie a lazy scoring model tells.

## Confidence, modifiers, and grade caps

Three mechanisms turn the raw sub-vector data into a score that reflects *how much it actually knows*, not just *what it found*.

**Confidence system (L0/L1/L2).** A scanner-only finding is not treated as ground truth. Scanner-only signals are weighted at **0.3×**, and only objective corroboration — a second independent source, a verified exploit path — promotes a finding to full weight. This is what keeps a noisy scanner from dominating the grade.

**Cross-dimensional modifiers (±15 pts max).** A per-category view keeps surfaces apart that an attacker would connect. Modifiers reach across categories — blast radius, PR adjacency, taint adjacency, pentest verdict, MTTR — so that, for example, a vulnerability that a pentest *verified* as reachable moves the score differently than the same CVE sitting unvalidated. This is the correlation step: it is why the roll-up is more than a weighted sum.

**Grade caps.** Some conditions are non-negotiable floors. An unpatched critical CVE, scan coverage below 50%, or an MTTR over 14 days each **cap the grade at B** no matter how good the rest of the picture looks. You cannot average your way out of an unpatched critical with a great TLS config.

Finally, the displayed score has **30-day smoothing** applied, so the gauge and the API agree by construction and a single noisy scan doesn't whipsaw the grade.

## The honesty invariants

A unified security score is only worth folding nine surfaces into if it tells the truth about what it actually knows. Two properties are load-bearing here, and both are **enforced, not asserted**.

### No fake-scoring of observing sub-vectors

A sub-vector that is in **observing** mode — collecting data, not yet at a confident verdict — is reported as *observing*, not silently assigned a number. The score does **not** manufacture a plausible-looking value to fill a gap. An unscanned facet shows an honest empty state ("尚未掃描" / insufficient data), and an observing sub-vector contributes its observing status to the breakdown rather than a fabricated value that would move the grade on data the system does not have.

This is the same no-fake-data principle that governs the confidence system: the score is allowed to say "I'm still observing this," and it is allowed to have gaps. What it is never allowed to do is invent a value. A score that fabricates the unknown is worse than no score, because it launders missing data into false confidence.

### No lying retired-worker score

When a scoring worker is **retired** — superseded, decommissioned, or shutting down mid-cycle — it does **not** emit a final unified-score log line as if it had completed a real computation. A retired worker records its retirement honestly; it does not stamp a stale or partial number into the score history that would later read as a genuine recomputation.

The result is that every entry in the unified score history is a *real* score event from a *real* completed computation. There are no phantom data points to mislead a trend chart or an audit. Combined with a `scoring_version` stamped on every snapshot and indefinite snapshot retention behind the audit trail, this is what lets the score survive scrutiny: every point on the curve is reproducible from its inputs.

These two invariants are why the roll-up is trustworthy and not just impressive — and they were hard-won, because the most tempting bug in any scoring system is to paper over a gap with a number that looks right.

## How the loop closes

Scoring runs the same five beats as every surface — **ingest → correlate → score → act → evidence** — across the combined picture:

1. **Ingest** — each surface's current findings (plus any data you brought via [bring-your-own integration](/posts/byo-mssp-integration-model)) are gathered on a scan- or discovery-complete trigger, with confidence levels intact.
2. **Correlate** — cross-dimensional modifiers connect surfaces; observing sub-vectors are carried as observing, never coerced into a value.
3. **Score** — weights, confidence multipliers, modifiers, grade caps, and 30-day smoothing fold the picture into one raw → display → grade value.
4. **Act** — a grade-boundary crossing emits a score event; cross-surface ranking decides what to fix first; downgrades can fire alerts.
5. **Evidence** — the snapshot is written with its `scoring_version` to the unified score history and the audit trail, replayable end to end.

That replayability is not a coincidence. The Warroom rides the same execution substrate as Flyto2's automation line — flyto-core's deterministic modules, YAML recipes, and evidence/replay. The recomputation itself runs as a deterministic recipe: collect each surface's findings, apply the weights and caps, write the snapshot and any score event. A score is reproducible because it is produced the same auditable way every time.

## One number, fully traceable

The promise of a unified security score is a single number leadership can read and an engineer can defend. That only holds if the number is computed identically for everyone, refuses to fabricate what it hasn't measured, and never logs a computation that didn't happen. That is the whole design: nine surfaces, three categories, twenty-one sub-vectors, three modes, modifiers and caps on top — folded into one **250–900** grade with every point traceable back to its inputs.

For the cross-surface roll-up view — routes, query keys, events, and recipes — see [Unified Scoring Across Surfaces](https://docs.flyto2.com/warroom/surfaces/unified-scoring). For the canonical formula — exact weights, confidence multipliers, modifiers, grade caps, and smoothing — see the [Scoring Methodology](https://docs.flyto2.com/warroom/scoring-methodology). And for why an MSSP runs this algorithm on your *combined* picture rather than re-selling you a rating you already own, read the [BYO MSSP integration model](/posts/byo-mssp-integration-model).
