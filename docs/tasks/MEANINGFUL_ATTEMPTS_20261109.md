# Meaningful attempts across existing learning engines

- Owner request (9 November 2026): improve MathExam courses and trainers using the Obrazavr, Brilliant, GeoGebra and Metodaizer audits. Implementation and checked publication are authorized by that request and `docs/OWNER_RELEASE_AUTHORIZATION.md`.
- Base: `main` at `39705bc5669acb5b97a33c72f5badc044faff298`.
- Branch: `improve/all-courses-independent-practice-20261109`.
- Review level: **MEDIUM**. Bounded input-validation presentation using existing controls; no new protocol, generator, storage schema or achievement rule.

## Outcome and evidence

A blank submit must not become evidence of a mathematical error. Before this change, the workshop incremented `session.attempt` and wrote a failed result, college logarithms incremented `errors`, and college functions penalized unfinished tables, selections and coordinate pairs. This could disqualify a later correct first answer from independent credit. Managed arithmetic already ignored blanks, but gave no explanation.

The audits distinguish actual individual attempts, corrections and assistance. This patch applies that distinction at the input boundary. It does not claim that third-party exercises or all their interfaces have been reproduced.

## Scope

- Workshop engine: 666 registered lessons across 13 course routes, including Vilenkin and Makarychev routes: reject whitespace-only input before touching the session, result journal or attempt counter.
- All 60 college logarithm tasks / 248 steps: explain the missing choice or answer without changing saved or shared state.
- All 40 college function tasks: unfinished tables, intervals, parity selections and coordinate pairs focus the first missing field. Explicit `нет`/empty-set answers and numeric zero remain mathematical input.
- Shared arithmetic renderer: explain the missing answer/choice without emitting a check event; keep read-only observation unchanged.
- Add actual-DOM regressions and CI wiring. Existing mathematical banks, validators, completed work, assistance flags, history, account APIs and room schemas are unchanged.

Other prepared course updates remain in their existing PRs (#497, #499, #502, #504, #505, #507–509); this work does not duplicate or publish those unaccepted candidates. Status documents contain historical release preparation, so current GitHub/production evidence takes precedence. At task start, authoritative remote main is the base above; exact-head checks for several predecessors remain pending. No blanket claim that the whole program is published is made.

## Acceptance and checks

- Repeated blank/whitespace submit preserves the stored state byte for byte.
- A correct answer after blank submits retains first-try independent credit where the existing engine supports it.
- A genuine wrong answer still counts; subsequent blanks do not erase it.
- Partial tables and coordinates retain entered values; first missing control receives focus. `0`, fractions and explicit empty sets remain accepted through unchanged validators.
- Hint/board state and server event boundaries stay unchanged; observers cannot submit.
- `node --test tools/meaningful-attempts.test.cjs`, retained college math/DOM/board suites, workshop state and arithmetic renderer suites; syntax and diff checks.
- Existing CI/browser gates remain enabled. DOM tests are not presented as real-browser evidence.

## Review, release and rollback

Focused self-review checks the early-return order, error/credit preservation, choice/point handling and unchanged state serializers. No new learning archetype or external consultation is required; external provider review and a real-pupil study are not performed.

Release is allowed after applicable checks and fresh main/head verification, followed by established Pages/live verification. Pending CI is a technical gate, not a request for renewed owner permission. An ordinary scoped revert is safe because no new persisted fields, schema or keys are introduced. Historical failed attempts are not retroactively rewritten.

## Local execution record

- New actual-DOM scenarios: **8/8 PASS**. The same scenarios against the unchanged four source files from the base commit fail **8/8**, reproducing the three accounting defects and the missing arithmetic guidance.
- Every logarithm task and all 248 steps are exercised with repeated empty submissions, then valid answers, in both personal and board modes. Functions cover partial tables, missing coordinates, zero, explicit empty sets, parity, full completion and retained first-try credit.
- Retained functions engine/UI and logarithm course suites pass, including all 40 function tasks and 60 logarithm tasks. Workshop state gate passes (7,400 generated tasks/steps).
- Actual teacher/student Socket.IO transport regressions: **9/9 PASS**.
- Retained column-multiplication DOM suite: **30/30 PASS**, run in eleven exhaustive groups using its existing test names. The initial unbounded and 256 MiB whole-file runs terminated from resource pressure (the latter reports V8 OOM). Grouping changes neither source nor assertions. The hosted workflow retains the complete existing suite.
- Initial local setup lacked JSDOM and the board transport dependencies. Matching existing pinned dependencies were reused; the subsequent tests above passed. No dependency files changed.
- Focused code review: validation returns before attempt/error writes; only transient DOM guidance is added; numeric zero and explicit absence remain valid inputs; room serializers, data, hints, completion rules and read-only controls are unchanged.
- Syntax and `git diff --check`: PASS. Current-head GitHub Actions, browser and production verification still required. The shared preview daemon is occupied; no takeover or local real-browser pass is claimed.
- External provider review and pupil pilot: not performed. No further owner decision is needed within this scope.

## Arithmetic evidence refresh after current-head CI

The first Unified learning run on `85019f85adbe984914b93fb672a8df2a19ce3c81` (`42625098765`, job `129186709690`) correctly rejected stale arithmetic reports: they described the earlier managed renderer instead of this change. The historical baseline, fixtures, robot policy, oracle, executable tests and workflow assertions are unchanged.

On 9 November 2026 the following unchanged commands were executed against that exact source commit using Node.js 24.22.1 and JSDOM 26.1.0 with real SQLite persistence:

```sh
node tools/learning-arithmetic-robots.cjs --generator-version=1 --output=docs/reports/arithmetic-robots-after.json
node tools/learning-arithmetic-robots.cjs --output=docs/reports/arithmetic-robots-current.json
node tools/learning-arithmetic-robots-compare.cjs
```

Both robot runs passed all 22 scenarios across 11 fixed profiles with zero unresolved findings. The legacy replay independently verified 475 arithmetic steps; the current generators verified 470. Each run retained all 22 saved-work/observer and next-practice scenarios, with 28 explicitly requested solutions. The generated comparison passed; complete scenario results are identical to the previous reports. Only the actual source commit, renderer digest and derived report digests changed. These are synthetic DOM/SQLite results, not a Chromium run or a pupil study.

The historical baseline remains byte-identical (SHA-256 `2b03bf848066b6b2842cc45ad6d64b8fc165715ab1161a72cc0f8afa63d1aa21`). The updated renderer digest recorded by the real runs is `5136c5b5bdf25ce541b3e8614729b385d59b708b24eb219dfb92ce7430f9e5d3`.

The original fixed-book run `42625098832` also failed, reporting screenshot protocol and navigation/stability timeouts. Infrastructure is a possible explanation, not an established cause or a passing result. The full unchanged fixed-book gate, Unified learning gate and remaining applicable checks must pass on the corrective head before release; no test, timeout or acceptance condition is relaxed.
