---
title: "Container Image Scanning: Secure Your Build Pipeline"
description: Container image scanning explained — how it works, scanning for vulnerabilities, secrets, and misconfigurations, shifting left in CI/CD, signing, and a practical checklist.
date: 2026-06-10
author: Flyto2 Team
tags: ["container security", "image scanning", "CI/CD", "supply chain"]
cover: /blog/container-image-scanning-guide.jpg
---

![Container Image Scanning: Secure Your Build Pipeline](/blog/container-image-scanning-guide.jpg)

**Container image scanning** is the automated inspection of a container image for known vulnerabilities, leaked secrets, and insecure configurations before that image ever runs in production. An image is not a single artifact — it is a stack of filesystem layers, each carrying an operating system, system packages, language dependencies, and your own code. Any one of those layers can ship a CVE you never wrote, a private key someone pasted by accident, or a `USER root` line that hands an attacker the whole host. Scanning turns that opaque blob into a list you can act on.

<!-- more -->

The hard part of container security is that most of what you ship is not yours. When you write `FROM node:20`, you inherit hundreds of OS packages and their entire vulnerability history. Scanning is how you find out what you actually pulled in — and whether it is safe to run.

## Why Scan Images at All?

A container image is built in layers, and risk accumulates at every one:

- **Base image risk.** A `node`, `python`, or `ubuntu` base brings a full distro userland. The day you build is the day it was patched — by next week new CVEs are published against packages you never touched.
- **Dependency risk.** Your `npm install` or `pip install` step resolves dozens of direct dependencies into hundreds of transitive ones. This is the same supply chain problem an [SBOM](/posts/what-is-an-sbom-software-supply-chain-security) is designed to make visible.
- **Secret risk.** Build args, copied `.env` files, and cached layers routinely embed API keys and private certificates. Deleting a secret in a later layer does **not** remove it — it still lives in the earlier layer and ships in the image.
- **Misconfiguration risk.** Running as root, exposing unnecessary ports, or baking in a writable filesystem all widen the blast radius if the workload is ever compromised.

You cannot remediate what you cannot see. Scanning produces the inventory; everything else is triage.

## How Container Image Scanning Works

A scanner does not "run" the image. It unpacks the layers and analyzes them statically. The typical flow:

1. **Pull and unpack.** The scanner fetches the image manifest and extracts each layer's filesystem.
2. **Build an inventory.** It catalogs OS packages (from `dpkg`, `rpm`, `apk` databases) and application dependencies (from `package-lock.json`, `requirements.txt`, `go.sum`, etc.). This inventory *is* an SBOM.
3. **Match against vulnerability data.** Each component and version is matched against feeds like the NVD, distro security trackers, and the GitHub Advisory Database to find known CVEs.
4. **Scan for secrets and misconfigurations.** Regex and entropy checks surface embedded credentials; policy checks flag `Dockerfile` and config issues (root user, `latest` tags, missing health checks).
5. **Report and gate.** Findings are scored by severity and exploitability, then either reported or used to **fail the build**.

### The Three Things You Are Actually Scanning For

| Scan type | What it finds | Example |
|-----------|---------------|---------|
| Vulnerabilities | Known CVEs in OS and app packages | `openssl 3.0.2` vulnerable to CVE-2022-3602 |
| Secrets | Hardcoded credentials in layers | AWS access key in a cached build layer |
| Misconfiguration | Insecure image/Dockerfile settings | Container running as `root`, `:latest` base tag |

A complete program covers all three. Many teams only run a CVE scanner and quietly ship secrets and root containers for years.

## Shift Left: Scanning in CI/CD

The cheapest place to catch a bad image is before it is built or pushed — not after it is deployed. "Shift-left" means moving scanning into the pipeline so problems surface at the speed of a pull request.

A practical sequence of gates:

- **Pre-commit / Dockerfile lint.** Catch root users, `latest` tags, and obvious anti-patterns before an image is even built.
- **Build-time scan.** Right after `docker build`, scan the image. Fail the pipeline on new **critical/high** vulnerabilities that have a fix available.
- **Registry scan.** Re-scan images already in your registry on a schedule. An image that was clean last month may be vulnerable today because a new CVE was published — nothing about the image changed, the world did.
- **Admission control.** At the cluster, block images that are unsigned or that fail policy from being deployed at all.

The key insight: scan once at build, but **keep re-scanning at rest**. Vulnerability data moves; your images don't.

## Signing and Provenance

Finding vulnerabilities is half the job. The other half is proving the image you scanned is the image you are running. Without that link, an attacker can swap a clean, scanned image for a tampered one.

- **Signing** (e.g., Sigstore/cosign) cryptographically binds an image digest to a signer, so the cluster can reject anything unsigned.
- **Provenance / attestations** (SLSA-style) record *how* and *where* the image was built, so you can verify it came from your pipeline and not a developer laptop.
- **Pin by digest, not tag.** `image@sha256:...` is immutable; `image:latest` is a moving target an attacker can repoint.

Together, signing and SBOM attestations give you a verifiable chain from source to running container.

## Common Mistakes

- **Only scanning at build, never at rest.** New CVEs appear daily. A one-time scan is a snapshot, not a guarantee.
- **Ignoring secrets and misconfig.** A CVE-only scan misses the hardcoded key and the root user that are far easier to exploit.
- **Alerting on everything.** Thousands of "low" findings train teams to ignore the scanner. Gate on *exploitable* + *fixable* first.
- **Bloated base images.** A full OS image has a huge attack surface. Distroless or minimal bases cut both vulnerabilities and noise dramatically.
- **Treating the image as the whole story.** A clean image with an over-permissioned runtime identity is still dangerous — image risk and runtime risk have to be correlated, which is the heart of [container & cloud identity security](/posts/container-cloud-identity-security).

## Container Image Scanning Checklist

- [ ] Use a minimal or distroless base image, pinned by digest.
- [ ] Run as a non-root user; drop unnecessary capabilities.
- [ ] Scan for vulnerabilities **and** secrets **and** misconfigurations.
- [ ] Fail CI on new critical/high CVEs that have a fix available.
- [ ] Generate and store an SBOM as a build attestation.
- [ ] Re-scan registry images on a schedule, not just at build.
- [ ] Sign images and verify signatures at admission.
- [ ] Correlate image findings with the workload's runtime identity and permissions.

## Where the Flyto2 Warroom Fits

A scanner gives you a list. What it rarely gives you is *priority that reflects your environment*. A critical CVE in a package that is never loaded, in a container with no network exposure and a tightly scoped identity, is not the same emergency as a medium CVE in an internet-facing service that can assume a powerful cloud role.

The Flyto2 Warroom's **container & cloud identity surface** exists to close that gap. Instead of treating image scanning as an isolated check, it correlates image findings with the runtime context: what permissions the workload holds, what it can reach, and how that ties back to your broader cloud posture — the same lens covered in [CSPM](/posts/what-is-cspm-cloud-security-posture-management). The BYO/MSSP thesis applies directly here: if you already run an image scanner, you keep it. Flyto2 ingests its output, joins it with identity and posture data, and runs the scoring and correlation in one closed loop — so you are paying for integration and prioritized answers, not for re-running an algorithm you already own.

Under the hood, the Flyto2 automation engine drives this with deterministic, evidence-backed modules: pull an image, extract its SBOM, match vulnerabilities, scan for secrets, and feed results into the same correlation loop as the rest of your attack surface — with replayable evidence for every finding. The result is fewer, sharper signals: not "you have 4,000 vulnerabilities," but "these three images are exploitable today and here is why."

Scanning is table stakes. Knowing which findings actually matter — and being able to prove it — is the work that follows.
