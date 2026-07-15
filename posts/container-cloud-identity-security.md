---
title: "Container and Cloud Identity Security in One Picture"
description: A practical guide to container security and cloud identity security — OS-package CVE posture, runtime events, and cloud-identity risk like over-privileged roles and exposed credential classes — and why correlating them with code and exposure beats three disconnected scanner outputs.
date: 2026-06-10
tags: [security, container, cloud]
author: Flyto2 Team
cover: /security/byo-mssp.jpg
---

Container security and cloud identity security are usually bought, run, and read as two separate disciplines: a scanner tells you which images carry CVEs, a CSPM tells you which roles are over-privileged, and the two reports never meet. The problem is that attackers don't respect that boundary. A CVE in an image only matters in proportion to what the workload running it can reach — and what it can reach is decided by the cloud identity it assumes. This post explains container CVE posture, runtime events, and cloud-identity risk as they actually behave, and why correlating them with each other (and with your code and external exposure) is what turns three scanner outputs into one operational picture.

<!-- more -->

## Three signals, one workload

A deployed service is not three things. It is one workload that happens to be observed by three different lenses:

- the **image** it was built from, which carries OS-package CVEs;
- the **container** that runs it, which produces runtime activity;
- the **cloud identity** it assumes, which decides its blast radius.

Tooling that keeps these in separate dashboards forces a human to do the correlation by hand, usually under incident pressure. In the [Flyto2 War-Room](https://docs.flyto2.com/warroom/), the container/runtime and cloud-identity signals are the workload half of the platform — the place where a deployed image, the container running it, and the identity it assumes are scored as **one connected exposure** rather than three disconnected outputs. Like every other surface in the war-room, it stands alone and closes its own loop: you can run container posture with no cloud account connected, or cloud-identity posture with no images registered, and each still ingests, correlates, scores, and produces evidence on its own.

| Concern | War-room route | Query key |
|---------|----------------|-----------|
| Cloud posture + identity | `/cloud` | `cloud-posture` |
| Container posture (image inventory, base-image age, layer drift) | `/container-posture` | `container-posture` |
| Container findings (per-CVE, per-package) | `/container-findings` | `container-findings` |
| Runtime telemetry | `/runtime-events` | `runtime-events` |

## Container CVE posture

Container findings begin as Trivy-style **OS-package CVEs**. Flyto2 scans Docker images for vulnerabilities in their OS packages and normalizes every result into the same finding format the rest of the war-room understands. A scan fires when a Dockerfile is detected in a connected repository, when a container image reference is configured for that repository, or when a scan explicitly includes the `container` category.

The output is deliberately not a flat CVE dump, because a flat dump is exactly what makes container posture unmanageable. Two routes split the picture:

- **`/container-posture`** carries the image inventory and posture signal — which images are in service, how stale their base layers are, and where **layer drift** has reintroduced a package version you already remediated upstream. Base-image age and drift are where most container risk actually lives: a single outdated base layer can re-add dozens of "fixed" CVEs across every image built on it.
- **`/container-findings`** carries the per-package, per-CVE detail with the fixed-version delta. A finding answers the operational question — *which package, in which image, upgrade to what* — rather than just naming a CVE id and leaving you to chase the remediation.

That structure matters because a CVE count is not a priority list. The question is never "how many CVEs," it is "which of these are on an image that is actually running, with a fixed version available, on a workload that can reach something valuable."

## Runtime events: what could run vs. what did

Container posture is a point-in-time picture of what *could* run. Runtime telemetry is what *did*. The `/runtime-events` feed (query key `runtime-events`, event `activity.logged`) records workload-level activity, so a vulnerable package that never executes is scored differently from one that is live on a running workload.

This distinction collapses a lot of noise. A critical CVE in a package that is installed but never loaded is real, but it is not the same emergency as the same CVE in a package handling live traffic. Runtime events are what let the scoring engine penalize what is **exploitable, reachable, and executing**, and discount what is unreachable or dormant — instead of treating every CVE as equally on fire.

It is also worth being precise about what this telemetry spine is shared with. The same `/runtime-events` feed is read by the [MCP security](https://docs.flyto2.com/warroom/surfaces/mcp-security) loop, which closes a distinct loop over the same telemetry. The two surfaces correlate over shared runtime events without collapsing into each other — which is exactly why the war-room organizes by closed loop rather than by data source.

## Cloud identity risk

The `/cloud` route (query key `cloud-posture`, modules `cloud_posture` and `identity`) covers the control-plane side of the same workload. Two finding classes carry most of the weight:

**Over-privileged roles.** These are identities and roles whose effective permissions exceed what the workload demonstrably uses. An over-broad role is the difference between a *contained* container CVE and a *full account compromise*. So it is not scored as an isolated checkbox — it is scored as an amplifier on every workload it can reach. The honest framing is reachability: a role that can read every bucket is dangerous in proportion to which compromisable workloads can assume it.

**Exposed-credential class.** These are credentials reachable from where they should not be — long-lived keys baked into an image layer, a secret surfaced at runtime, or a credential whose blast radius crosses a trust boundary. This class is precisely where the container half and the cloud half meet: a key found in a container layer (`/container-findings`) becomes a cloud-identity exposure (`/cloud`) the moment that key grants cloud access. One finding, two lenses, and you only understand the severity when you look through both at once.

Cloud-identity posture is correlated with container posture for exactly this reason — so that "a CVE in this image" and "this image's role can read every bucket" are read as **one path**, not two unrelated rows in two unrelated tools.

## Why correlation with code and exposure matters

Keeping container, runtime, and cloud identity together is the first win. Joining that workload picture to the rest of the war-room is the second — and it is where a list of findings becomes an attack path.

- **Container × code.** Container findings contribute to the same Code Security category as the [code intelligence](https://docs.flyto2.com/warroom/surfaces/code-intelligence) surface. A vulnerable dependency you ship in source and the OS-package CVE that ships in the image built from it are two views of one supply chain, and scoring them in one category stops you from patching one while ignoring the other.
- **Cloud identity × exposure.** An over-privileged role on a workload that is *also* externally reachable through your [attack surface](https://docs.flyto2.com/warroom/surfaces/attack-surface) is not a posture nit — it is the front and back of the same break-in. Internal privilege only becomes an external risk when something outside can touch the workload that holds it.
- **Runtime × threat intel.** An IP that matches a known C2 indicator in your darkweb feed is interesting on its own; the same IP appearing in your `/runtime-events` is an incident. The runtime spine is what turns intel into a confirmed finding.

When an exposed credential or a reachable, privileged CVE warrants active confirmation, it can be promoted to the [pentest](https://docs.flyto2.com/warroom/surfaces/pentest) surface, where it is validated and carries its proof — not just its claim — through the shared evidence/replay substrate.

## How the loop closes back to one score

The `containers-vuln-loop.yaml` recipe drives the surface end to end, and cloud-identity posture and policy simulation reuse `runtime-mcp-policy-simulate.yaml`, shared with the MCP loop:

1. **Ingest** — pull image inventory and CVEs (native Trivy-style scan plus any bring-your-own scanner or CSPM output), pull cloud posture and identity from `/cloud`, and normalize everything into the standard finding format.
2. **Correlate** — join container findings to the cloud identity their workload assumes and to `runtime-events`, so reachability and privilege amplify or discount each raw CVE.
3. **Score** — fold the correlated result into the [unified score](https://docs.flyto2.com/warroom/scoring-methodology). The recompute is driven by `scan.complete` and `discovery.complete`, the same events that wake the cross-surface [Pulse](https://docs.flyto2.com/warroom/pulse) feed.
4. **Act** — remediation surfaces as a fixed-version upgrade (container) or a least-privilege change (identity), and an over-privileged role on an exposed workload ranks in Pulse next to the CVE it amplifies.
5. **Evidence** — every step is captured and replayable, so a container finding promoted by runtime reachability or a credential exposure confirmed in pentest carries replayable proof.

The result is one OS-package CVE on an image, amplified by the cloud role its workload assumes and the runtime activity it shows, scored into a single 250–900 number with replayable evidence the whole way through.

## The BYO angle: ingest your CSPM and container scanner

If you already run a **CSPM** for cloud posture or a **container scanner** in CI, you should not re-buy that capability to get value from a war-room. You already paid for the algorithm; you shouldn't pay again to re-run it.

Flyto2 is an MSSP / BYO platform. The first thing this surface does on entry is **integrate the workload assets and scanner output you already own**, then **ingest external data to fill the gaps**, then **run the correlation and scoring algorithms on the combined picture**. Concretely:

1. **Bring your scanners.** Existing container-scanner and CSPM results are normalized into the standard finding format and merged into `/container-findings` and `/cloud` alongside Flyto2's own Trivy-style scan — deduplicated against the same image and the same identity, feeding the same score. No re-purchase.
2. **We supplement what you lack.** No runtime telemetry, or no cloud-identity coverage? Those signals fill in around your existing tools instead of duplicating them.
3. **We run the loop.** A CVE gets joined to the role its workload assumes and the runtime activity it shows; an exposed credential gets promoted toward pentest. All the way through to evidence collection and red-team simulation, unified in one war-room.

We charge for the **integration and the closed loop**, not for re-running a scan you already paid for. And it is the same deterministic engine behind our automation line — [flyto-core](https://docs.flyto2.com/): 451 deterministic modules, MCP-native, YAML recipes, evidence and replay — that literally runs these scans, collects the evidence, and joins the picture. Automation is the *how*; the war-room is the *what and why*.

## Where to go next

Container security and cloud identity security stop being two disconnected reports the moment the image, the runtime, and the identity are scored as one workload — and that workload is correlated with your code and your external exposure.

- Read the full [Container, Runtime & Cloud Identity surface docs](https://docs.flyto2.com/warroom/surfaces/container-cloud-identity) — routes, query keys, events, and the `containers-vuln-loop.yaml` recipe end to end.
- See how findings promote across surfaces in [Closed-Loop Verify](https://docs.flyto2.com/warroom/closed-loop).
- Understand how container and cloud-identity findings fold into one number in the [Scoring Methodology](https://docs.flyto2.com/warroom/scoring-methodology).
- Connect what you already own via [Integrations](https://docs.flyto2.com/warroom/integrations) — BYO ingest for Trivy, container scanners, CSPM, and threat feeds.
