---
title: "Red-Team Simulation: From Attack Paths to Validated Risk"
description: "Red-team simulation guide: use pentest evidence and mapped attack paths to run adversary campaigns and feed validated risk into security scoring."
date: 2026-06-10
tags: [security, red-team]
author: Flyto2 Team
cover: /security/pentest-as-a-service.jpg
---

Most security programs accumulate findings faster than they can answer the only question that matters: *is this exploitable, and does it change our actual risk?* A scanner says a port is open. A code analyzer flags a sink. An exposure rating drops a grade. None of them prove an adversary can chain those signals into impact. Red-team simulation is the step that does — it takes mapped attack paths and verified findings, runs an adversary against the combined picture, and folds the *validated* result back into a single score.

<!-- more -->

This guide walks through how red-team simulation works in the Flyto2 war-room: how a campaign consumes the surfaces upstream of it, how it executes through a deterministic state machine, and how its outcome turns theoretical posture into validated risk.

## Red-team simulation vs. pentest vs. scanning

These three are routinely conflated, and the conflation is where programs lose signal. They are distinct loops:

| Activity | Question it answers | Scope |
|----------|---------------------|-------|
| Scanning | Does this vulnerability *appear* to exist? | Per-asset, signature-based |
| Pentest | Is this specific finding *real*? | Per-finding verification |
| Red-team simulation | Can an adversary chain these into *impact*? | Campaign-scoped, whole-target |

Scanning produces candidates. Pentest verifies whether a finding is genuinely exploitable. Red-team simulation is the act-step the other surfaces build toward — it runs an adversary campaign against the whole target and produces *verified adversary outcomes*, not another list of maybes.

In the war-room, red-team is the ninth converged surface, and it stands alone the same way the other eight do: you can launch a campaign against a single target with no other surface connected, and it will baseline, probe, verify, recheck, and report on its own. Joins to pentest, exposure, and asset data are *additive* — they seed sharper attack vectors, but are never a precondition for the loop to close.

## How a campaign consumes attack paths and pentest evidence

A red-team simulation is most valuable when it doesn't start from a blank target. Two upstream joins seed it:

**Attack paths.** The external attack-surface surface computes `/attack-paths` — the routes an adversary could chain from an exposed entry point to real impact, weighted by blast radius. The campaign's Baseline phase reads these as candidate attack vectors, so probes exercise *real, mapped paths* instead of generic checks.

**Pentest evidence.** The pentest surface verifies findings through its `/findings/${fingerprint}/verify` machinery, promoting them when exploitation succeeds. Red-team's Verify phase reuses *exactly that machinery* — it does not invent a second verification path. A campaign that runs after pentest verification starts with findings already carrying confidence levels and evidence, so it targets what is most likely real rather than re-discovering from zero.

The seam that carries this upstream data into a scoped campaign is a deterministic recipe, `footprint-to-pentest-target.yaml`, shared with the pentest surface. It turns confirmed footprint and exposure data into a target definition:

```
exposure (/attack-paths) ─┐
                          ├─> footprint-to-pentest-target.yaml ─> scoped campaign
footprint (verified) ─────┘                                            │
                                                                        ▼
pentest (verify.terminal) ──────> seeded findings ──> Baseline → Probe → Verify
```

The campaign begins from verified assets and real attack paths.

## The five-phase state machine

Every campaign progresses through five sequential phases, each producing evidence:

```
Baseline → Probe → Verify → Recheck → Report
```

- **Baseline** collects the target's current state — open ports, services, technologies, endpoints — captures a score snapshot for before/after comparison, and identifies attack vectors from discovery data. Typically 1–5 minutes.
- **Probe** dispatches lightweight, budget-aware probes against those vectors, testing for injection, auth bypass, and misconfiguration. Every probe records its evidence and reports token consumption.
- **Verify** attempts actual exploitation of probe findings using closed-loop dynamic verification. Successful exploitation promotes a finding's confidence; failed attempts are annotated and recorded for audit.
- **Recheck** re-scans to detect any state change the probing caused and confirms the target is still healthy — no accidental denial of service.
- **Report** generates the campaign report: findings with evidence, exploitation results, a before/after score comparison, and the verdict modifier that feeds scoring.

A campaign can be **paused** at any phase boundary and **cancelled** at any time; a cancelled campaign still produces a partial report from collected data — a simulation under rules of engagement should be stoppable without losing the evidence already gathered.

### Budget controls keep simulation bounded

A live adversary simulation that runs unbounded is a liability, so every campaign carries a token budget with explicit caps:

| Parameter | Role | Default |
|-----------|------|---------|
| `soft_limit` | Warning threshold; campaign begins winding down | 80% of budget |
| `hard_limit` | Absolute maximum; campaign stops immediately | full budget cap |
| `per_probe_cap` | Maximum tokens per individual probe | 5% of budget |

When the soft limit is reached, no new probes are dispatched, in-flight probes complete, and the campaign transitions to the next phase, emitting a `budget.soft_breach` event. The hard limit stops the campaign outright. Resource consumption is a first-class, observable property of the simulation — not an afterthought.

## Simulation as a deterministic, replayable recipe

Because red-team runs on the same deterministic execution substrate as every other surface — and the same engine behind the automation funnel — a campaign is a YAML recipe in, evidence and replay out. The surface owns `pentest-campaign-dryrun.yaml`, which plans and dry-runs a campaign: it walks the would-be Baseline → Probe → Verify → Recheck → Report progression, estimates budget consumption, and surfaces which attack vectors *would* be exercised — before a single live probe is dispatched.

That dry-run is itself a replayable artifact. You can attach it to a change ticket or a rules-of-engagement approval, get human sign-off, then execute. A red-team run is replayable, schedulable, and human-in-the-loop gateable exactly like a workflow automation — the same evidence-and-replay property the Report phase depends on.

## Feeding validated risk back into one score

The loop closes when the campaign outcome re-enters scoring. The Report phase computes a **pentest verdict modifier** — a cross-dimensional adjustment to the unified score:

- A campaign that **fails to exploit** a finding is evidence the control held — the verdict moves the score *up*.
- A campaign that **succeeds** is evidence it did not — the verdict moves it *down*.

This is the difference between assumed and validated risk. A finding at theoretical severity contributes one thing to a posture score; the same finding after a campaign *proves* it exploitable contributes something the org can act on with confidence.

The modifier is recorded as a reason in the war-room's score events — for example, `"Pentest verdict: clean (+3)"` — so a grade change driven by a campaign is traceable to the exact campaign that caused it. Because verdicts are cross-dimensional modifiers on top of the smoothed base score rather than per-finding values, the audit trail makes the cause explicit: this campaign, against this target, moved this grade.

At the surface level, the war-room subscribes to a single rolled-up event, `campaign_execution.updated`, which fires on every material change — a phase transition, a probe batch, an exploitation result, a budget breach, terminal completion — letting the live Pulse feed and the scoring layer track a running campaign without consuming the full per-probe event stream.

## The MSSP / BYO angle

Red-team is where the bring-your-own integration model pays off most directly. A campaign does **not** re-run an algorithm you already own. It consumes whatever you brought — your existing exposure ratings, your pentest findings, your asset inventory — supplements the gaps the war-room discovered, and then executes the one thing that ties them together: a live, evidence-producing adversary simulation across the *combined* picture, all the way back into one score.

That is the structural reason the surfaces are worth more together than apart. Pentest tells you what's real; red-team tells you what an adversary can actually *do* with all of it — and writes the answer back as validated risk, not another open finding.

## Where to go next

- **[Red Team Pipeline](https://docs.flyto2.com/warroom/red-team)** — the full campaign workflow: the five-phase state machine, budget policies, runner dispatch and callback, and the complete SSE event catalogue.
- **[Red-Team Simulation (Surface)](https://docs.flyto2.com/warroom/surfaces/red-team)** — how red-team sits in the registry, the `campaign_execution.updated` event, the campaign recipes, and how it converges with the other eight surfaces.
- **[Pentest (Surface)](https://docs.flyto2.com/warroom/surfaces/pentest)** — finding verification, the machinery red-team's Verify phase reuses.
- **[Scoring Methodology](https://docs.flyto2.com/warroom/scoring-methodology)** — the pentest verdict modifier and the unified score it adjusts.
