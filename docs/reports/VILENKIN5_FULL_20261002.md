# Vilenkin 5 release candidate, 2026-10-02

## Scope

134 original micro-lessons cover the 51 points of the supplied 2023 third revised textbook, plus a project/review unit and an explicitly additional bridge to grade 6. Reused grade-6 explanations address genuinely shared skills; new grade-5 routes and fraction laboratories do not replace previous IDs.

- Fraction models: equal wholes, common partitions, addition/subtraction, multiplication area, whole and partial portions in division.
- Decimal models: place-value exchanges, addition regrouping, subtraction borrowing, multiplication scale, equal rescaling in division.
- Other models: place-value regrouping, long-division stages, angle construction, existing geometry/data/equation models.
- In-model missions and four achievements based on two unseen, unassisted first-attempt successes per required skill. Model exploration is not marked as independent mastery.
- Fifth/sixth-class links and in-session return preserve the initial task, step and draft input.
- Board course button, 135 catalog entries, search and pagination; course and lesson iframe opening.

## Evidence before final CI

Base: `de9109b1f7ba8cb7b2ed65026a7f6d6b3b0b96e8` (published PR #170).
First checkpoint: PR #171, head `64a3b2e57ddf0613584bdbc876e9f8807cc23b19`.

- V5 mathematics: 16,080 task checks (independent arithmetic relations for new generators; shared generators are additionally covered by existing V6 independent oracles); 1,088 model boundary cases. All pass.
- V6: 23,280 independent task checks, 2,976 model frames. Editions: 13,500 tasks. Core: 11,520 tasks. Storage regression passes.
- Initial 132 guided Chromium flows passed. Follow-up adds two equation lessons, included in final 134-flow gate.
- Focused real-browser checks pass after fixes: common-denominator rejection, fraction missions, partial portion division, decimal exchanges and rescaling, keyboard angle control, sixth/fifth return, graduated hints, independent achievement, legacy progress, 360/768/1280 widths, 200% zoom at 360 px, board iframe/search/pagination.
- Fixed discovered issues: narrow-screen zoom overflow; re-entrant DOM replacement caused by input blur during model redraw. Redraw is deferred and ignored for detached models.
- Preview builder checks static links. Full final-head CI and production evidence must be recorded in PR #171; this document does not predict publication.

## Permissions / risks / limits

The owner directly authorized finishing and publishing the discussed courses, and waived independent review and separate final acceptance. No independent external review is claimed, no global rule is rewritten, and no protection is bypassed. The same ordinary self-checks and exact-tree verification remain mandatory.

The course is not a solution bank for every numbered exercise. No real-student pilot, cloud gradebook, or synchronized internal Workshop actions inside the board iframe is claimed. Progress remains compatible local version 1, with existing export/import and damaged-data handling. PDF sources and learner data are not included in this PR.

Rollback: ordinary revert of the release commit, keeping user data. No migrations or old-key deletion.
