# SpaceMath graph solutions: preparation report

Date: 2026-11-10 (Asia/Novosibirsk). Status: **DRAFT — RELEASE HELD**.
Base: PR #527 `754e5cb60fed4af7535b0baa6e9a0c602af68fea`. This report covers the scoped patch; the PR carries the exact committed head and subsequent GitHub results.

## Changes

| Area | Result |
| --- | --- |
| `trainers/spacemath/expression.js` | Analysis through the existing AST; bounded rational coefficients, discriminant classification, stable numeric roots, domain and numerical safeguards. Decimal tangencies are preserved. |
| `trainers/spacemath/model.js` | Strict `functionRoot` / `functionIntersection` definitions with graph parents and branch; calculated coordinates only, recoverable undefined states, shared dependency propagation. |
| `trainers/spacemath/app.js`, `index.html` | Graph tools, two persistent branches, explicit statuses, accurate small-coordinate display, inspected results remain open in observation and refresh during parameter changes. |
| Tests and existing CI | Mathematical/DOM/server regression coverage plus graph-specific UI scenarios inside the existing real three-context shared-board suite. |
| Task/report | Scope, numerical boundaries, acceptance evidence, dependency chain and explicit owner release hold. |

## Local results

- **428 / 428 server tests passed**, including the new journal/control/restart regression.
- **90 / 90 expression, model, assets, editor and bridge tests passed**. The graph suite contains 11 test cases; one enumerates all 441 ordered integer-root pairs from −10 to 10. These combinations are not counted as 441 separate test-runner tests.
- JavaScript syntax checks and `git diff --check` passed.
- The full scripted browser run was **not completed locally**: Chromium exited during startup with `socket() failed: Operation not permitted`. No browser scenario is recorded as passing on the strength of DOM stubs or model evaluation.
- Existing GitHub CI for the base #527 was checked and the returned 17 workflows succeeded, including Unified interactive board. That is base evidence, not evidence for this extension's head.
- Independent/provider review and a real learner pilot were not performed. Deployment and live-site acceptance were not performed.

## Browser scenarios prepared for CI

The existing three-context suite creates functions and both types of points through visible editor controls; changes the parameter to produce zero/one/two roots; checks a dependent midpoint and agreement of calculated points between teacher and pupil; changes a formula to unsupported `1/x` and back; inspects rendered SVG labels; checks observer lock, local page reload, readonly history and actual server restart. Existing presentation, rejected writes, stale versions, independent seats, credential-free iframes and 320/1280 layout regressions remain in the same runner.

## Boundaries and release decision

Only everywhere-defined polynomial expressions in the supported bounded AST are solved. Unsupported or numerically unsafe expressions do not produce guessed points. Coordinates are approximations, marked ≈; infinite solutions are explained without constructing arbitrary points. Exact decimal sign decisions and numeric drawing agreement are different checks, both covered.

Do not merge or publish this extension until #526, #519 and #527 complete, final composition is checked, browser CI and independent acceptance succeed, and the owner receives the change list/results and explicitly confirms release. This task's restriction overrides the standing publication policy. Keep the PR draft and auto-merge off. Do not conflate preparation with availability on mathexam.space.

```text
EXECUTIVE STATUS
Task: SpaceMath roots and graph intersections, bounded linear/quadratic stage
PR: recorded in the task pull request
Base: 754e5cb60fed4af7535b0baa6e9a0c602af68fea
Head: recorded in the task pull request
Gate: LOCAL_MODEL_SERVER_PASS; BROWSER_AND_RELEASE_PENDING
Tests: 428 server + 90 expression/model/editor/bridge
Failures: no unresolved local assertion failures
Not run: full browser locally (Chromium socket restriction), independent review, live acceptance
Scope deviations: none
Recommendation: keep draft; validate CI and complete dependencies before acceptance
Next user decision: explicit release confirmation only after the final candidate is accepted
```
