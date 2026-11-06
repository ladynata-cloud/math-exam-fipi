# Original introductory lesson: What is a logarithm?

## Identity and permission

- Owner request: create an original interactive introduction, connect to the existing course and shared practice, verify mathematics/mobile/return.
- Date: 2026-11-06, Asia/Novosibirsk.
- Base: main `47059d1e808186dea8df08a030a8dea85a145b84`.
- Branch: `feat/logarithm-discovery-lesson`.
- Review: MEDIUM, bounded static lesson and existing course navigation; no new platform or server protocol.
- The current imperative request authorizes implementation. Branch/commits/push/Draft PR and checked release are covered by the request and [standing publication authorization](../OWNER_RELEASE_AUTHORIZATION.md). No repeat confirmation or external audit is required.

## Verified context

PR #460 is merged as `60deda9b2a5eddd7d91790a88500d907edb5e5f9`. Its existing 60-task/248-step course includes shared state and graphs. The live Amvera registry read during this task contains `college-logarithms`; public registry digest `308e762cc9cd192e37b9e0dc385f9f7de350ecfe559969b78a84c1d89fdd0ff2`. Registry presence alone does not establish successful live two-participant operation.

## Approved scope

An original eight-stage introduction at `/trainers/college-logarithms/intro/`: powers, inverse question, logarithm notation, zero/negative exponents, fractional exponents, domain, graph observations, practice. Thirteen checked discoveries. Small SVG/HTML experiments, targeted misconception explanations, hints after two errors, saved progress and retained discovery list. Explicit practice links select existing meaning/values/graph tasks. Trainer links back to the lesson. Board practice opens separately using the existing trainer/registry/SDK; the introduction itself is individual and is not registered as a mirrored trainer. Add canonical/sitemap discovery and scoped automated checks.

No copied Brilliant content, account changes, server/authentication changes, paid services, student assignments or personal results. Existing course attempts are preserved. No broad catalog redesign.

## Learning design and review

The learner first predicts repeated doubling, then reverses the question to find the exponent. Introduce notation only after the reverse question. Counterexamples separate logarithm from division and distinguish negative exponents from negative values. Fractional exponents prevent the misconception that logarithms are only whole-step counts. The graph uses x as the argument and y as the exponent, fixed axes, an explicitly labelled moving point and both increasing/decreasing bases. Conditions a > 0, a ≠ 1, b > 0 are stated with reasons. Values remain exact at the provided sample points.

Self-review before implementation and ready-result mathematical/interaction checks are required. External provider consultation and real-pupil pilot: not performed under standing policy; no external verdict is claimed. Original text, CSS and geometric models were written for this lesson without access to protected Brilliant course materials.

## Acceptance and gates

- Independently verify exponent identities, argument/base restrictions and graph direction.
- Complete all 13 answers; incorrect responses cannot advance; hints after two errors; prior answers remain available.
- Restore after reload, return from all three practice links, safe behavior with blocked/corrupt storage.
- Preserve standalone course attempts and initialize requested existing tasks on shared board; reject unknown task IDs by retaining ordinary default/resume behavior.
- Real browser widths 320, 390, 1280 × 900: no horizontal overflow, models in first viewport, keyboard-operable controls, full learner journey, screenshots.
- Existing course mathematics/DOM/transport and actual two-context board browser suite.
- Sitemap/canonical checks and `git diff --check`.
- Gate: `LOG_INTRO_BROWSER_OK` plus course/registry/SEO regressions, all applicable CI on exact candidate.

## Risk and rollback

Potential risks: confusing exponent/result, an incorrect curve or practice task, unavailable browser storage, stale client assets. Tests cover these; app cache key version is bumped. Progress is local only in a separate key and contains no identifying information. Existing room hydration remains authoritative. Revert this PR using ordinary git history to remove lesson/navigation; no data migration. Existing course results and server state are not altered.

## Execution record

Exact head/PR, passed/failed/not-run checks, final base comparison and deployed evidence are recorded in the PR. Local initial course/lesson run found JavaScript negative zero at log base 1/2 of 1; the calculation now normalizes the result to zero. The normal system Chromium cannot start in this execution environment (socket restriction); browser evidence must come from a working headless runtime or GitHub CI, not be inferred from DOM tests. No product/test assertion is weakened to resolve environment limitations.
