# Chapter V integration and published-course preservation review

EXECUTIVE STATUS

- Task: `ATANASYAN_7_9_CHAPTER_V`.
- Reviewer: independent integration review by `author_ch4_theory`; this reviewer authored the new theory fragment, so this report does **not** independently approve its mathematics, pedagogy or drawings.
- Base: `44eab4d11046d8613b50a73b00185755c814dba6`.
- Candidate: working-tree integration identified by the file hashes below, reviewed 2026-10-26 UTC. No exact-head CI or publication verdict is implied.
- Verdict: **PASS for the scoped integration, preservation oracle and publication boundary**.
- Tests: full default `chapter05-preservation.test.py`, 9 tests, passed after the finding below was fixed; independent Git-object comparisons and targeted metadata corruptions also passed.
- Open findings: none within this scope.
- Not run: real browser/PNG review, production deployment, merge. Those remain separate gates.
- Recommendation: retain these integration safeguards while completing independent content and actual-image review. No publication approval is granted here.

## Reviewed files and exact bytes

| File | SHA256 |
| --- | --- |
| `tools/geometry-textbook/release-scope.json` | `ffef0e4f19f5dedf3d97310d184818fd405cb654a05a562e473bf6a3e48f4c46` |
| `.github/workflows/atanasyan-planimetry.yml` | `22e8b1d60ae179ce688d8f8d34a920758f68e754eec5dcb074e763e36af234c8` |
| `tools/geometry-textbook/chapter05-preservation.test.py` | `2fa2c6fc314f99d9e6bf1a22f7a36f2717ffea799acab84b06f268ec5c6f2991` |
| `tools/geometry-textbook/published-chapters-01-04.json` | `379869da94677385c338d0b6332f809ff7e407ae5af60a695c7773298583b625` |
| Independent `tools/geometry-textbook/chapter-05-source-map.json` | `bd99bd11b3d4750ef0871caac769807dac65a87f1bf8686c7ab06a74cec98d4f` |
| Integration bundle tested, `geometry-course/textbook/data/course.json` | `97fa7a6e6ffaf6629e9d30ce96e5530ea030d423028ae40a6001bc8494bca6e5` |

The unchanged builder was also read: `build_course.py`, SHA256
`012cfa1ee509ff4f5256077c648df3053fe9e0a1b929b793f53f8ee266112d27`.
The unchanged browser gate was read: `browser_check.js`, SHA256
`07b49df556ebb6ee97ddcabbd3a4e3d12d570c7d4816446555356e214fd12577`.
Later authoring changes can legitimately change the bundle hash; this review does not transfer a mathematical or visual verdict to them. The preservation test must be rerun on the final bundle.

## Independence and strength of the preservation oracle

The fixture is not regenerated from the candidate. I independently fetched the original bytes with `git show 44eab4d1:<path>`, without using the candidate builder or the test's normalization helper to derive expected results. The recorded source tree matches `git rev-parse <base>^{tree}`. The original full bundle SHA256 is
`afd4228a2e1444c8fca719fcc2dc0145ca5419354980a33dcadbf637b560325d`.

The following fixture values match that exact Git object:

- All 569 complete lesson objects and all 569 complete catalog entry objects, both ordered ID lists, and every per-card hash and revision.
- The complete four chapter build/review records, normalized catalog book and full source inventory, and shared implementation hash.
- Every one of the 82 immutable-file hashes and all five runtime-file hashes. The working files also match those original hashes. The runtime files overlap the immutable set; these are not claimed as 87 distinct files.

Full-object hashing protects statements, explanations, models, help, theory links, source metadata, status and review provenance, rather than merely preserving a card count or a selection of fields. The separate per-card hashes make failures attributable to individual cards. The old file set covers preparations, models, release manifests, historical review documents, source maps, old frozen fixtures, the public entry and runtime, including the board adapter.

The fixture's own SHA is pinned inside the new test. That detects accidental fixture changes; deliberate simultaneous changes to test and fixture still require code review, as with any checked-in oracle. No claim of protection against an author intentionally rewriting the gate is made.

The old local-storage key uses book ID, lesson ID and revision. All three are unchanged, and the unchanged engine still constructs the same key. There is no storage migration or key replacement in this integration.

## Chapter V scope and negative checks

The new scope is exactly 82 main numbers, 331–412, with 99 independently inventoried subpart cards, seven theory points 39–45 and 30 chapter-specific review questions. That adds 136 cards to the published 569, yielding 705. Question IDs retain the `selfcheck-chapter-5` namespace. The source map supplies individual pages and subparts, independently of the authored lessons and release counts. Printed/PDF pages remain offset by one.

The new validator rejects missing, duplicate or foreign identities, altered pages, wrong question namespaces, unsupported top-level drawing fields, changes to previous chapter scopes, advanced exercise 413 or later, theory 46 or later, and a 31st review question. The source map is a trusted, independently reviewed input; the validator is not an OCR/source-content verifier.

The corruption probes check changed old lesson text, catalog title, revision, removed/duplicate IDs, revoked old chapter approval, false full-book completion and altered source inventory. Byte mutations of runtime, old review manifest and historical fixture are rejected. V-specific mutations exercise missing/duplicate cards, page mapping, an invisible `sectors` primitive and the wrong review-question namespace. These probes remain in memory or temporary directories and do not alter the working course.

The `--preservation-only` option is explicitly limited, reports `chapterVIntegrationChecked: false`, and is not used by CI. Default mode checks the complete V integration. The browser workflow runs only after that default source/model job succeeds.

## Publication boundary and browser workflow

The existing builder remains unchanged. Approval is computed separately for each chapter from its own manifest, its authored-content hash, the shared runtime hash, its chapter scope, all required review categories, and reviewer/date fields. V cannot inherit chapter IV approval, and adding pending V does not revoke I–IV.

The temporary-copy test removes the V review manifest and recomposes the actual course. It checks all 569 prior records again, confirms all 136 V cards are `in-review`, and calls the real JavaScript engine. Default `inspectBundle` exposes exactly 569 cards and no V card; explicit `allowInReview: true` exposes all 705 without issues. The public `index.html` does not enable that option. Pending records are present in the bundle as authoring data, but remain unavailable through the learner catalog/open-card interface; this is an availability boundary, not a data-confidentiality claim.

The workflow change selects V for full PNG capture. Reading the unchanged gate confirms this filters only additional review screenshots: the main loops still exercise **every lesson and every authored view at 320 and 1280 px**. Natural step progression, retained work and interaction checks remain enabled; neither focused-only environment flag is set. The checkout and evidence head use the PR head SHA. Evidence binds bundle, authored content, runtime and gate-script hashes. Artifacts are uploaded even after a failure. `completed` is set only after the view/error assertions and interaction phase succeed.

This is a review of the workflow and gate implementation. No browser run or screenshot is approved by this report.

## Finding and verified closure

**V-INTEGRATION-001 — minor, closed.** The original new validator checked full-textbook completion on the generated bundle but did not validate the top-level `schemaVersion`, `bookId` or `fullTextbookComplete` of `release-scope.json`. Current values were correct, but the validator had a coverage gap for those metadata corruptions.

Root added explicit checks and all three mutation probes. I independently supplied `schemaVersion=999`, `bookId="wrong-edition"` and `fullTextbookComplete=true` to the revised validator; each was rejected with the relevant assertion. The final default test suite passed all nine tests, including the new subtests, in 5.485 seconds. The corrected test hash is the one listed above. I did not edit the test, fixture, workflow, scope, runtime or bundle.
