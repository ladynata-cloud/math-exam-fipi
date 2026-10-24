# Shestakov–Yaschenko course checks

The chapter-one completion contains 516 exercise cards and 27 authored theory companions across all 27 source topics. Chapter 1 is complete: 126 numbered tasks / 252 variants, including 192 additions to its released 60. The complete book index contains 990 numbered tasks / 1,980 variants; 1,464 variants remain explicitly pending. Source: the supplied 2021 third edition, ISBN 978-5-09-078551-8, 240 PDF pages; printed and PDF page numbers match. Original scans and raw OCR are not published.

The preceding 324-exercise/27-theory release was published by PR324. This expanded version requires its own release decision; authored coverage is not a claim that it has already replaced the public version. Source 1.3 C1б omits a condition on the point's location: its manual card explains the ambiguity with valid counterexamples instead of silently assuming a unique answer.

## Authoring and review

`author-1.py` through `author-6.py` deterministically generate the compact chapter files. Independent review records bind the actual chapter bytes by SHA256. `build.py` exposes only chapters with matching passed review records; stale hashes fall back to in-review. `content-reviews.json` collects the six real reviews. It is not external-provider approval.

Chapter-one additions live in six pure `expansion-ch1` author modules. Each has a separate independent source/mathematics/model review and executable checker, bound to both module bytes and generated records. `ch1-preservation-check.py` requires all 60 original exercise records and five theory records to retain their exact canonical hashes. `ch1-review-check.py` requires all 192 additions to be covered, without duplicates or stale reviews.

## Checks

- `python3 tools/shestakov-yaschenko/build.py --check`
- `node tools/shestakov-yaschenko/check.cjs`
- `python3 tools/shestakov-yaschenko/ch1-preservation-check.py`
- `python3 tools/shestakov-yaschenko/ch1-authoring-check.py`
- `python3 tools/shestakov-yaschenko/ch1-review-check.py`
- Every `tools/shestakov-yaschenko/expansion-ch1/review-*-checks.py`
- `node tools/stereo-textbook/model-geometry.test.cjs stereo-course/shestakov-yaschenko-10-11/data/course.json`
- `python3 tools/shestakov-yaschenko/reviewer-ch1-checks.py`
- `python3 tools/shestakov-yaschenko/review-ch3-checks.py`
- `python3 tools/shestakov-yaschenko/review-ch4-checks.py`
- `python3 tools/shestakov-yaschenko/reviewer-ch5-checks.py`
- `node tools/shestakov-yaschenko/model-browser.cjs`
- `node tools/shestakov-yaschenko/runtime-browser.cjs`
- `node tools/shestakov-yaschenko/ch1-completion-browser.cjs`

Browser scripts use Playwright. An optional CHROME_PATH selects an existing executable for constrained executors. Default CI uses the pinned Playwright Chromium. Model checks cover every authored view at 320px and 1280px. Runtime checks cover every retained-step sequence plus representative answer, help, theory, restoration, search and stale-tab scenarios. Manual proofs are never auto-approved. Sampled visual inspections by independent AI reviewers and mathematical checks have separate evidence records; simulated journeys are not a real pupil trial.

The offline packager accepts one output HTML path. It embeds current course data and the same CSS/JS, makes no fetch request and requires all authored cards to be independently reviewed. The HTML can be opened directly without a server. Local progress remains browser-local; no cabinet or shared-board synchronization is claimed.

`offline-smoke.cjs` accepts that HTML path and checks it under `file://` with the browser network offline, including answer checking, restored progress and 320px rendering. `offline-smoke.json` records the tested artifact hash and actual results.

## Publication

The route is isolated, published by direct link, and retains noindex. No old course, server, learner record or authentication contract is changed. The first publication and its one-time external-review exception do not approve newly authored content. The recorded Anthropic HTTP400 is not retried automatically; `consultation-state.json` preserves that cost boundary without granting any approval. Merge/deployment and any new external-review exception are owner decisions under AGENTS.md and the MathExam release workflow.
