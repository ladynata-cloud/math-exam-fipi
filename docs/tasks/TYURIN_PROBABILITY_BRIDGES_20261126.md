# WORK-12 — учебные мосты вероятности и статистики Тюрина

## Identity

- Task: WORK-12 / PROB-01/02, integration PROB-07
- Date: 26.11.2026
- Base: main `ecf4cd2078c2c67da38f0c5fd1de3ebc41f257b0`
- Branch: `course/tyurin-probability-bridges`
- Review: HIGH (two instructional laboratories and existing-course integration)
- Related: #763 (merged), #736, #526, #679; no board or architecture change.

## Goal and scope

Build the progression from outcomes and conditional probability to discrete distributions, expectation, variance and dependence of sums in the existing Tyurin course. Two self-contained author-written laboratories, twelve exercises, graduated hints, independent checks and transfer. No external services, accounts, storage or student information in new labs.

PROB-03/04 proposed an index edit; do not apply it in this branch. #526/#679 still modify index, and canonical normalization can change the rendering mode. PROB-07 instead appends a separate idempotent mount to the existing condition-lab.js; it does not alter the original IIFE, existing IDs, state, progress, storage, board protocol, index, CSS, common manifest, sitemap, or unrelated files. It is standalone only, and direct laboratory URLs have paper fallbacks. Existing course already requires JavaScript, so its new links are runtime links. Canonical defect is separately retained for TECH-01.

## Acceptance and gates

- Verify unchanged original condition-lab.js prefix, main index blob and exact changed paths.
- Run node tools/tyurin-probability-bridges.test.cjs. Mount adds exactly two links once, avoids frames, preserves original anchor, no network or storage access. Reuse existing author labs and exact mathematical kernels.
- Run old course unit tests and tools/tyurin-condition.browser.cjs plus tools/tyurin-statistics.board.browser.cjs in a full checkout, with synthetic participants only. Check course ID list, draft restoration, 320/390/1280 px, actual links, iframe exclusion and full applicable CI.
- Independent review and exact head/base validation before release. No external paid review requested; external review not run.
- Previous isolated checks in center: PROB-01/02 mathematical 21,972 assertions, PROB-03 browser 291 assertions (not whole-course), PROB-05 6,612 logic assertions on exact old JS, PROB-06 1,089 independently recalculated keys. Not claims of full CI on this head.
- Current local isolated mount: 4 Node groups, 39 Chromium checks, fixture uses original index without external scripts/styles; full HTTP/browser/board gate not run here. Initial wrong Node CLI invocation corrected; actual test groups pass.

## Risk and rollback

Risk: the added links are JavaScript-rendered, no new mirroring capability; existing navigation/SEO or full-course regressions may block release. Revert the task commit without touching old records. Do not weaken any gates.

## Permissions / handoff

Owner's 26.11 WORK-12 and continuation authorize a scoped Draft PR only. Later task-specific hold overrides standing release authorization: no merge, deployment, shared file edits, paid API or nested tasks. Full gate and independent review pending; no claim of whole-course completeness. Base and head recorded in PR; fresh main guard before any later release decision.

## PROB-08 — public route gate correction

On head `8e5d113ea1f02092dcb7f8d01ab9b2c323201837`, GitHub Actions exposed real publication requirements: the two new HTML pages lacked the standard home-return mechanism and sitemap entries (SEO run 45728651639; navigator run 45728651664, all four shards). Board manifest preflight passed. This branch adds the exact existing deferred public navigator pair and distinct self-canonical/description to each lab; the original static relative course/home navigation, no-JS paper tasks and complete inline mathematical and learner UI scripts remain byte-identical. The optional site navigation is not required for mathematical use offline.

Local exact-blob checks: updated Node test 4/4 groups; discrete mathematics 86/86 and sum/dependence mathematics 21,886/21,886; offline Chromium 84/84 and 147/147 on the two updated HTML pages at 320/390/1280 px. Offline set_content, not full site navigation. Actual home-bundle predicate evaluated on both files with a same-origin URL adapter. No shared scripts, gates, sitemap or manifest edited here.

Coordinator request: reserve the two exact routes in `tools/seo-public-pages.json` (seed_paths), regenerate `sitemap.xml` using `python3 tools/build-sitemap.py` on the composed candidate, and review explicit public navigator inventory/provenance for browser coverage. Never add noindex, alias canonicals or gate exclusions to hide new learner pages. Full CI, browser/board regression and HIGH review remain required; merge/publication remain prohibited.
