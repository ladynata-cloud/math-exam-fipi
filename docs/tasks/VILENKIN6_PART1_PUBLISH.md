# Publish Vilenkin grade 6 part 1

Owner: Наталья Михайловна. Date: 2026-10-23 (Asia/Novosibirsk).
Base: main, c62e5047fa2e774d43899e4ee20d5e1127c53e64.
Branch: publish/vilenkin6-part1-course. Review: HIGH (publication and local progress).

The owner created and reviewed the delivered course in this conversation, then
explicitly requested publication on her site: «публику на сайте». This authorizes
this bounded release; it does not change other courses or site access controls.

## Scope

Publish the prepared standalone course at /courses/vilenkin-6-part-1/, linked from
both course catalogues and sitemap. Preserve the existing two-part school course.
27 modules,81 worked examples,475 authored tasks,24 concept labs plus4 supplemental
workshops. The original source navigator contains931 main numbers,37 applications
and30 checks. The supplied textbook PDF accompanies page references. This is full
topic coverage, not authored individual solutions for every original number.

No account/server/protocol changes; no automated teacher messages, cabinet writes,
mirror synchronization or shared student data. The existing textbook-course pattern
is reused. The proposed school ADR is advisory, not claimed as accepted authority.

## Release preparation

- Add nested-path public metadata and links.
- Repair task-specific answer labels/units, PDF-help quiz provenance, step-help
  retention, and bound answer/note text before persistence.
- Preserve exact rational checking, draft recovery, independent/aided distinction,
  one result per task and atomic schema-validated import.
- Rebuild portable offline HTML from canonical reviewed sources.
- Independent source review and existing arithmetic/content checks; meaningful
  regression coverage for repaired defects.

## Gates and review

Required: syntax; content/schema/rational/numbering checks; all108 DOM views and
state/import/provenance regressions; offline reproducibility; sitemap/SEO gates;
git diff --check. Final gate: VILENKIN6_PART1_PUBLISH_OK when applicable checks pass.

Browser visual QA was unavailable in the source environment due to a browser
policy block. It is not claimed complete and is not bypassed. Vector lab geometry
was independently inspected; DOM simulations are not browser/device tests.

Initial design-time Claude consultation was not performed; no advice/verdict is
invented. The delivered prototype was accepted for publication by the owner.
A bounded ready-result review is requested through the repository's established
Anthropic secret/model. It sees only public code and representative authored tasks,
not the supplied textbook PDF, student data, private documents or credentials.
Exact provider,PR,base,head,verdict,response identity and timestamp are stored in the
workflow artifact. A missing/failed review remains uncompleted; no standing waiver
from another task is assumed.

## Risk and rollback

This is an isolated additive static route with a dedicated localStorage key.
Existing catalog entries and legacy course files remain. Rollback is a scoped
revert of this release's files/catalog additions; learner localStorage is not
deleted or migrated. Export remains available in the existing delivered version.

Before merge, re-query current main and exact PR head; preserve unrelated concurrent
commits and verify the reviewed changed-file set. The current user publication
instruction is the release authorization, with technical gates still required.
After deployment verify public course/data/asset bytes against the merged commit.
