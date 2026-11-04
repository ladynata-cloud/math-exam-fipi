# Shestakov–Yaschenko geometry companion course

## Identity and authorization
- Task: SHESTAKOV_YASCHENKO_10_11_COURSE
- Owner request, 2026-10-24 Asia/Novosibirsk: create a course from the attached problem book in the style of the textbook courses created during the last day. This is implementation START.
- Base: main, d524c9107133d6a948ff11c18095b5ca01b660de
- Branch: feat/shestakov-yaschenko-10-11-course
- Review level: HIGH (large mathematical content set).
- No new architecture/ADR: reuse the published textbook engine and scene viewer, with isolated source identity/page mapping and filters.

## Outcome and scope
Create a working topic-complete companion course: 27 source subsections, theory support, selected faithful source tasks with justified retained steps and separate task-specific geometric models. Inventory all 990 numbered tasks/1,980 intended variants and distinguish available solutions from pending material. This first release does not claim all 1,980 solutions. No source PDF, learner data, cabinets, authentication, shared board or existing curricula changed.

## Acceptance and checks
- Exact source IDs include subsection/level/number/variant; printed/PDF pages match the supplied 2021 third edition.
- Every available card has a complete solution and geometrically consistent model. Theory is labelled as an authored companion.
- Task-first interface; optional help; previous steps/drafts retained; manual proof entries never auto-grade; independent/assisted accounting.
- Topic/level search, mobile rendering, clean labels, deep links, progress persistence, stale-tab protection.
- Source inventory check, schema/model checks, independent mathematical review, real browser interactions at desktop/mobile, git diff --check.
- Gate: SHESTAKOV_YASCHENKO_COURSE_CHECKED (only when actual checks pass).

## Review and access
Before implementation: existing source/engine inspected, focused design brief in tools/shestakov-yaschenko/design-brief.md. Claude consultation unavailable in this executor: no ANTHROPIC_API_KEY; no Claude connector. This is not advice or approval. Continue authorized implementation and independent review per TRAINER_CLAUDE_CONSULTATION.md. No repeated paid requests or billing change. Final external review/owner exception remains required for release.

## Risk and rollback
Risk: source transcription, mathematical correctness, visual clarity. Isolated new route/data and runtime copy; no data migration. Rollback removes the new route/catalog link; local course storage is independently namespaced.

## Permissions
Branch, local commits, push and Draft PR follow the direct creation request. Merge/auto-merge/deployment not performed without the separate authorization required by AGENTS.md and mathexam-pr/SKILL.md.

## Completed first release
- 324 exercise variants and 27 theory companions across all 27 source topics; all six chapter reviews match their exact content hashes. The remaining 1,656 source variants are explicitly pending.
- Source/schema and independent mathematics passed. Geometry checks covered 1,093 planar polygons and 8,595 nonzero segments; browser checks covered all 351 cards and 2,318 view/width states at 320px and 1280px.
- Runtime checks passed 351 retained-step journeys and 12 representative interaction scenarios. A separate file:// check with network disabled passed answer checking, progress restoration and mobile layout.
- Visual review records identify the exact sampled screenshots. No real pupil trial, external-provider release approval, merge or deployment is claimed.
- Detailed results: tools/shestakov-yaschenko/execution-report.json. Upstream changes observed during implementation are documented separately in base-drift.json; common scene, math and style dependencies remained unchanged.
