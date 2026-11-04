# Chapter IV: independent integration and gate review

## Verdict and identity

**PASS for local integration, source coverage, preservation and the checks
listed below. Actual browser execution, rendered-image review and publication
remain pending. This is not a chapter-IV release approval.**

Reviewed 2026-10-26 by the independent source-inventory/integration review
agent, separate from the exercise authors and integration editor. This agent
authored the new independent source inventory and preservation fixture/test;
the preservation result below was additionally checked by direct comparison
with the original Git object, independently of that test implementation.
Individual source/mathematics/didactic reviews remain in the separate A, B, C
and theory records; integration tests do not substitute for those reviews.

- Original published base: `9cf995d30c400a6e581a3168bb8ef8f5c76ed945`.
- Locally inspected candidate commit: `574571e1e77ab102dc14722c2ef833574f544ae1`.
- Locally verified candidate tree: `1a57b3d5b4952443b067ccf6b89785679adaa5e7`.
- The coordinator reports PR #346 remote head
  `74497c3101f3d889c51bfd8ca568c0244b23f0bf` with that same tree. In run
  `40316569063`, the coordinator reports source/model job `121550542075`
  passed and board job `121550542738` rejected pending IV at the expected
  strict-review boundary. Browser job `121550737768` remains in progress.
  This record does not infer a successful browser run from those statuses.
- All-content digest: `e7ed27fcc07bf0cd69f0ab59ee5f7be939f34241060c983f65f33ca7ed614a55`.
- Chapter-IV content digest: `04f6533b0682948441563574e1b04bcc0b1948c61cd5dad233b4758f8b0a9ee6`.
- Unchanged runtime digest: `17ba8baa79b5de85864ea888a6ebcf6bd2682ee5c69867a61996e6a7454f7b07`.

This report, the final C review, and inspected cosmetic README/status edits may
be committed after the candidate identity above. The reviewed content is
bound to the file/content hashes, not an assumed
identity between later documentation commits and the submitted CI head.

## Inspected integration files

| File | SHA-256 |
| --- | --- |
| `geometry-course/textbook/data/course.json` | `9fb7cfc95c3c8ff8e8cd47f3ec7b2f1d036a4f108f5bc236a676de681ee90f6e` |
| `tools/geometry-textbook/release-scope.json` | `bddc88dee4d9b9462301816667c6766112f499b6d6f6b03f5ec8ad5ff1277250` |
| `tools/geometry-textbook/chapter-04-source-map.json` | `66bc5870902488e0a18fab436b5eaac0bcccb92acbae7766ffde4dd3666163ad` |
| `tools/geometry-textbook/published-chapters-01-03.json` | `dcb53e7b35d2b70947e079394ac8c47ae60b58e4859480868d6063959f746fd6` |
| `tools/geometry-textbook/review_scope_test.py` | `c45c1074161e7be22616ea8ef2406d4e4d3ffe13e7b360fa725406a22b32e1e9` |
| `geometry-course/textbook/README.md` | `c9bea09d918838babe5abaefbd9aacee08db772eea2774336167392589c1323f` |
| `docs/tasks/ATANASYAN_7_9_CHAPTER_IV.md` | `7e35f7a932cdda6fa6ed7e31ec7b0bec8beb5a683219aaada9ffc97d1cfb7997` |
| `docs/PROJECT_STATUS.md` | `0e88eeeb24502017f4ee353492d6487262ea9633ae9a439744caec72a7063045` |
| `tools/geometry-textbook/browser_check.js` | `07b49df556ebb6ee97ddcabbd3a4e3d12d570c7d4816446555356e214fd12577` |
| `.github/workflows/atanasyan-planimetry.yml` | `91f8b1ab37378fd3aee0b5a1a674a5166412522bde6df05448c022a20a1ca462` |

## Scope and preserved publication boundary

| Collection | Existing I–III | Added IV | Combined |
| --- | ---: | ---: | ---: |
| Numbered exercises | 227 | 103 | 330 |
| Exercise parts | 309 | 135 | 444 |
| Theory points | 30 | 8 | 38 |
| Chapter-qualified selfchecks | 64 | 23 | 87 |
| Cards | 403 | 166 | 569 |

The exact-source map, preparation inventories, release scope and generated
catalog agree on every IV exercise number/subpart and printed page, points
31–38, and selfchecks 1–23. This uses the independently inventoried source map,
not a count inferred from author preparations. Full-book completion remains
false. The documentation correctly leaves chapter V, numbers 331–412, and
grade-7 advanced exercises 413–461 unfinished; IV does not finish grade 7.

Direct comparison with `git show` of the published base confirmed exact
structural equality for all 403 earlier lesson objects and their catalog
entries, including identifiers, revisions, steps, models and status. The first
three chapter build records are unchanged. The three original release-review
files are byte-identical to their base versions. Runtime implementation file
hashes, including the engine, planar viewer, math renderer and styles, are
unchanged. These facts preserve the existing learner-state key construction;
there is no storage migration or runtime change in this scope.

All 166 new cards are `in-review`. Their publication review manifest is absent;
the combined `publicationReviewMatches` value is false, while all prior three
chapter values remain true. The ordinary content gate explicitly checks that
the public catalog exposes exactly the approved cards and withholds pending
cards. The strict `--require-reviewed` invocation was also run and correctly
rejected this candidate with the expected missing-current-review message.
That expected rejection is a working publication boundary, not a passed
publication/board release gate.

## Checks actually run

| Check | Observed result |
| --- | --- |
| `check_textbook_preparation.py` | Existing preparation/source structure gate passes. Its legacy 91-number preparation summary is not represented as independent validation of all IV mathematics. |
| `build_course.py --check` | Exact reproducible 569-card build passes on final content. |
| `review_scope_test.py` | All 8 tests pass, including the 403-card preservation test and review isolation/invalidation cases. |
| `check_models.py` | 569 models, 2,906 views, 1,912 coordinate claims pass after the final 325 case correction. |
| `model_claims_test.py` | All 6 negative/positive claim-validation tests pass. |
| `check_course.cjs` | Complete source-part/page/theory/selfcheck coverage and reachable authored views pass; pending status is retained. |
| `runtime_check.cjs` | Retained-work gate passes, 17 checks. |
| `reviewer_runtime_check.cjs` | Final independent DOM sweep passes: 569 lessons, 1,967 step checkpoints, nested theory and restored-help behavior. It explicitly reports `layoutVerified: false`. |
| `tools/geometry/check.js` | Existing geometry gate passes: 63 units, 137 points, 52 proofs, 46,551 assertions. |
| `tools/seo-check.py` | Existing entrance and canonical-signal checks pass. |
| `node --check browser_check.js` and `git diff --check` | Pass. |

The DOM gates used the already available jsdom dependency installation; no
runtime dependency or repository configuration was changed for this review.
The final build, source/content, model, preservation and full DOM sweep were
rerun after the last C correction. Unchanged generic gate results were not
treated as real-browser or rendered-pixel evidence.

AST comparison confirms that all seven pre-existing review-scope tests are
unchanged. One preservation test is added, and synthetic review manifests
continue to be confined to temporary fixtures. The browser capture/workflow
delta has its own independent review: all prior checks remain, with optional
extra IV screenshots and their roster added. No gate or failure condition was
removed or relaxed.

## Documentation, privacy and pending work

README, task and status text distinguish the 403 published cards from the new
candidate, retain manual assessment of arbitrary proofs, and do not claim
whole-course board synchronization, a real-pupil pilot, completion of the
book, unavailable-provider advice, or publication of IV. Every hash row in
the A, B, C, theory and browser-capture review records matches the inspected
file. The coordinator corrected the status-header date to 26 October and
README spacing; these final cosmetic changes were inspected and are included
in the file hashes above.

The scoped additions include no source PDF, source-page images or raw OCR.
The new text files contain no machine-local workspace paths. Screenshot
preparation helpers and synthetic fixtures remain outside the Git repository.
An untracked Python cache is not part of the reviewed candidate tree.

There is no unresolved local integration finding at these hashes. Actual
Chromium behavior, every IV screenshot at 320 and 1280 px, exact-head cloud
checks and the final reviewed-content/board gate are still required before
any chapter-IV review manifest or release decision. No such result is claimed
by this report.
