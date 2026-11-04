# Chapter III: technical review of gates

## Verdict and boundary

**PASS for the independently reviewed integration changes.** Existing assertions
remain intact or are extended to chapter III. One confirmed view-reachability
gap was reported and then corrected in `check_course.cjs` at root's request;
the full positive gate and all six negative fixtures pass.

- Reviewer: `chapter3_exercises_b`, independent of the integration changes.
- Completed: **2026-10-24 17:34:03 UTC**.
- Compared against base `631d2d644d87162d60585c3efb8365af8311a3f5`.
- The reviewer authored the subsequently requested narrow reachability guard.
  This record reports its implementation and tests; root performs the separate
  independent review of that correction.
- No browser was launched for this review. The final whole-course browser run,
  publication manifest and exact-head CI are separate evidence.

## Exact reviewed files

| File under `tools/geometry-textbook/` | SHA-256 |
| --- | --- |
| `check_course.cjs` | `b34e6f0de652b7c55bc60ab108979054bdb1c88f859bb6af964a01f17c8a447f` |
| `review_scope_test.py` | `65231fb800ce540dece08e65d8cbf831a9f4dc38865508a9860f814eb29b41b6` |
| `runtime_check.cjs` | `7c1148e68c42e5d2cf5bb3246064bb2a5d60ee54fae5dcb75c0a179516c64577` |
| `browser_check.js` | `5ab1711e51cb0e6831c911908b80bbf9eb82a85d856dd6fd444adcaeae48d6f9` |
| `release-scope.json` | `a0269a3e5bb0d5942e0fb7d84e0ee6cde17d42b5e17693a0bfaedc23d0e102fb` |
| `published-chapters-01-02.json` | `62c6b4efb3d9eceb6b6d5bbc8d65aeedc16becf21882f12e66531fb5a872e58f` |
| `chapter-03-source-map.json` | `de20ef06a0155f74286540449eaf2f895f798edf7193ad1caf0fb80e33c42a75` |

## Preservation, source coverage and fixtures

The reviewer independently loaded the base commit's `course.json` using
`git show`, reproduced the normalized hashes of all 336 lessons and catalog
entries, and reproduced each chapter's counts and authored-content hash.
Every value in the new published baseline agrees with that Git blob. The
existing chapter-I baseline check is retained; the new test additionally
protects both published chapters and their normalized review provenance.

The original source inventory and chapter-II source map are byte-identical to
the base. Chapter III adds exactly exercises 191–227, 43 exercise cards, theory
24–30 and 17 review questions: 67 new cards, 403 total. Its source map agrees
with the independently inspected source structure, including 191 а/б/в and
208, 211, 212 and 216 а/б, the inherited questions in 212, and the printed/PDF
page offset of one. `check_course.cjs` retains chapter-II comparisons and
applies the same source/subpart/page checks to III.

The review-boundary tests copy the course into a fresh temporary directory.
Synthetic approvals are explicitly marked `TEST FIXTURE ONLY`, used only in
those copies, and are never written to the working course. They exercise
missing reviews, cross-chapter reuse, content invalidation, runtime
invalidation and missing source/model data. Original published provenance is
checked separately against the real composed course and frozen base hashes.

The runtime tests retain draft persistence, save-failure handling, two-window
conflicts, public review boundaries and honest manual-answer feedback. Their
chapter loop now includes III while preserving II. Browser interactions
likewise retain II, add III and check first/last direct entry. For unreviewed
content, URL restoration occurs only inside the explicitly labelled engineering
preview; a reviewed public direct entry is asserted before that recreation.

The browser `inspect` function is byte-identical to base, SHA-256
`870df6bc761f79baeae9cd8a4f406eb140f009fde4342214ad9d505f2ae3fc26`.
Its label, geometry, circle, stroke and viewport checks were not relaxed.

## Confirmed reachability gap and narrow correction

Two in-memory mutations of theory 30 passed the prior lesson/model validators:
renaming `case-1` to `perp-case-1`, and setting its unlock after the last step.
With the natural final step count, jsdom showed no corresponding case button.
The browser harness's per-view mount could nevertheless render both by calling
`setView` with an artificially supplied unlock level. Thus a rendered screenshot
alone did not prove ordinary UI reachability.

The new guard accepts only `neutral`, positive `step-N` identifiers and nonempty
`case-*` identifiers. Each natural step must select its corresponding `step-N`,
every such view must exist, and extra step views are rejected. Case unlocks must
be integers from zero through the lesson's actual step count; an omitted unlock
means zero. All 416 legacy occurrences of copied `availableFromStep` metadata
on neutral/step views remain permitted because the viewer ignores that metadata
there. Runtime, browser checks and model inputs were not modified by this fix.

## Executed verification

| Check | Result |
| --- | --- |
| `node tools/geometry-textbook/check_course.cjs` | PASS: 403 models, 227 numbered exercises, 309 exercise parts, 30 theory points, 64 review cards |
| `python3 tools/geometry-textbook/review_scope_test.py` | PASS: 7 tests |
| `runtime_check.cjs` with the existing jsdom dependency | PASS: 15 retained-work checks |
| Base Git blob versus published baseline | PASS for all combined and per-chapter hashes |
| Six negative reachability fixtures | All rejected by the intended assertions |
| Scoped `git diff --check` | PASS |

The six fixtures cover the wrong case prefix, unlock after the final step,
negative unlock, fractional unlock, an extra step view and an incorrectly named
natural step view. They execute the complete gate with only the bundle read
replaced by an in-memory fixture. The real course and manifests are untouched.
Scratch fixture evidence SHA-256:
`17a8997b673758410304037d866fa24478a3cb17250e3cce097117a572d2eabc`.

The tested v3 bundle SHA-256 is
`90927ba9e2ad64d9d3d86d3ad006c643556f411a83dcead6442ac6a9deeebd31`.
Its `publicationReviewMatches` is still false at this test stage, as expected;
this review does not claim that `--require-reviewed` or publication has passed.
