# Shestakov–Yaschenko course checks

This first-release selection covers all 27 source topics with six numbered tasks per topic, both variants: 324 exercise cards and 27 authored theory companions. The complete index contains 990 numbered tasks / 1,980 intended variants; 1,656 variants remain explicitly pending. Source: the supplied 2021 third edition, ISBN 978-5-09-078551-8, 240 PDF pages; printed and PDF page numbers match. Original scans and raw OCR are not published.

## Authoring and review

`author-1.py` through `author-6.py` deterministically generate the compact chapter files. Independent review records bind the actual chapter bytes by SHA256. `build.py` exposes only chapters with matching passed review records; stale hashes fall back to in-review. `content-reviews.json` collects the six real reviews. It is not external-provider approval.

## Checks

- `python3 tools/shestakov-yaschenko/build.py --check`
- `node tools/shestakov-yaschenko/check.cjs`
- `node tools/stereo-textbook/model-geometry.test.cjs stereo-course/shestakov-yaschenko-10-11/data/course.json`
- `python3 tools/shestakov-yaschenko/reviewer-ch1-checks.py`
- `python3 tools/shestakov-yaschenko/review-ch3-checks.py`
- `python3 tools/shestakov-yaschenko/review-ch4-checks.py`
- `python3 tools/shestakov-yaschenko/reviewer-ch5-checks.py`
- `node tools/shestakov-yaschenko/model-browser.cjs`
- `node tools/shestakov-yaschenko/runtime-browser.cjs`

Browser scripts use Playwright. An optional CHROME_PATH selects an existing executable for constrained executors. Default CI uses the pinned Playwright Chromium. Model checks cover every authored view at 320px and 1280px. Runtime checks cover every retained-step sequence plus representative answer, help, theory, restoration, search and stale-tab scenarios. Manual proofs are never auto-approved. Sampled visual inspections by independent AI reviewers and mathematical checks have separate evidence records; simulated journeys are not a real pupil trial.

The offline packager accepts one output HTML path. It embeds current course data and the same CSS/JS, makes no fetch request and requires all authored cards to be independently reviewed. The HTML can be opened directly without a server. Local progress remains browser-local; no cabinet or shared-board synchronization is claimed.

`offline-smoke.cjs` accepts that HTML path and checks it under `file://` with the browser network offline, including answer checking, restored progress and 320px rendering. `offline-smoke.json` records the tested artifact hash and actual results.

## Publication

The route is isolated and marked noindex pending separate release authorization. No old course, server, learner record or authentication contract is changed. Merge/deployment and any external-review exception are owner decisions under AGENTS.md and the MathExam release workflow.
