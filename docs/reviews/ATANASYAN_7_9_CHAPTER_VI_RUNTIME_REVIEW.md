# Independent VI runtime-extension review

Reviewer: independent non-author OpenAI agent `/root/vi_runtime_final`. Review completed 2026-10-29. PR: ladynata-cloud/math-exam-fipi#373. Base: `d3122b9f3905cd8f7715cee6a873d031cdb43de4`. Reviewed candidate head: `b36a7d8b239516076a367ec9f71957c83d07dccd`. No repository edits, commits, push, publication or learner-data actions were performed by this reviewer. AGENTS.md, docs/REVIEW_POLICY.md and docs/tasks/ATANASYAN_7_9_CHAPTER_VI.md were read.

**Verdict: PASS for the exact runtime extension and the technical candidate boundary described below.** This is not approval of unreviewed mathematics, pedagogy, every drawing, future release-builder changes, a later head, merge or deployment.

The old implementation is `f358f65b5955ad8ae2443bc8916aadda8f502a07e6274e90b9b21d727979813c`. The reviewed extension is `04e5a58da99bf68421e8f7aa9baccd8c3b2054766dab4141f912a46eba7690ec`. The seven-input filename boundary is unchanged. Six runtime inputs are byte-identical; only source-inventory.json changes from `e01036d2efaea5591e874b0669f8cbfba0ab8c9a67170042f78bb73efc9c10b6` to `96ab32a3b61bbac81432e6dc6c003cdbcf998e39b8ea3000254689f73ab88cf3`.

The reviewer independently reconstructed the previous source-inventory bytes by removing exactly the final three VI paragraph rows and serializing with the original two-space indentation plus newline. The reconstructed SHA equals the old hash above. Thus every prior inventory field, all previous paragraph rows and their order remain identical. The appended rows are exactly:

| Chapter | Paragraph | Title | Points | Exercises | Printed pages |
| --- | --- | --- | --- | --- | --- |
| 6 | 1 | Многоугольники | 46–47 | 462–470 | 121–123 |
| 6 | 2 | Параллелограмм и трапеция | 48–50 | 471–501 | 124–131 |
| 6 | 3 | Прямоугольник, ромб, квадрат | 51–53 | 502–519 | 131–135 |

This review checks technical application of those rows. Independent source/PDF verification is a separate review, not claimed here.

## Independent real-browser probes

A separately authored Playwright script ran Chromium 153.0.8010.0 against the exact isolated CI candidate. No course data, status flags or production storage were altered. Only a fresh temporary browser context's localStorage was used. The test loads the actual review.html or index.html entry; it does not replace the running application with a hand-crafted DOM fixture.

- 138 cold VI deep links opened exactly the requested IDs; all had the correct permalink and rendered SVG.
- 138 exact source labels and titles preserved the distinction between «К пункту», «К параграфу» and «К главе». Additional tasks 520–540 and selfchecks received no invented paragraph.
- 138 source disclosures visibly displayed the chapter/paragraph labels and the lesson's printed/PDF page metadata.
- 138 public index.html cold links correctly withheld these in-review cards and never enabled preview.
- Four actual catalog→card journeys covered main462, theory46, selfcheck VI1 and additional task520. The VI §3 query returned exactly 30 cards (27 task parts plus three theory points).
- Six independently named question-1 drafts, one in each chapter I–VI, persisted after the writing page was closed and a fresh page loaded. There were exactly six distinct book/lesson/revision localStorage keys.
- Native same-origin cross-tab storage conflict handling retained the old VI draft in the recovery textarea, froze the old editor, and restored the newer draft upon the user's recovery action.
- No browser page errors were observed. Cold navigations alternated 320px and 1280px viewports; this is not a claim of exhaustive visual inspection.

Script SHA256: `e037a9663707e9acf8a61af604713cb39503b64b929b319d0ce6c99383840485`.

Browser evidence SHA256: `25897311ee48c734a13755334df4865c3f727f50da62b3f2bae98f8124b25eec`.

Candidate bundle SHA256: `688d6ed94e00c1a52ea7dfb48de069002a4b8392dfaa9ac8f627273ab1cfcc1d`.

Candidate authored-content SHA256: `6fb96430059d3256887035dbac6fffd3220178272f575932eb51521f215fa9c6`.

## Independent historical preservation and repeated regressions

Direct git-object comparison of base→reviewed head confirmed all 67 pre-existing geometry-course/textbook files are byte-identical. The published 755 full lesson records, catalog records, status/review fields, ordering and all storage-key components remain identical. The published bundle SHA remains `10d86375b924f2914d93ab82efb91ed01a85c0d4657fd7d66414d42edcee7466`.

Existing repository regressions were also repeated: chapter06-candidate.test.py 6/6, review_scope_test.py 13/13 and chapter05-preservation.test.py 9/9 passed. These repetitions are distinguished from the independent browser script and git-object comparison above.

## Release implementation requirements

A separate exact-head review remains necessary after promotion. Keep the old LABELS runtime receipt and historical fixtures unchanged. Bind the extension to a new receipt, with the exact old/new runtime hashes, exact unchanged six-file map, exact three appended rows and this evidence. Permit only implementationSha256 plus the new receipt binding in each of the six historical manifests; reversing that amendment must reconstruct the exact old manifest hashes. Preserve all prior reviewer, at, status, evidence and runtimeLabelReview fields.

Validate against the actual course directory being built, including isolated test copies. Strict full-record/order preservation of the old755 must accompany an exact VI union gate, so projection cannot hide unrelated additions. Missing or stale VI approval must leave the old755 reviewed. Old paragraph changes/order changes, extra/missing VI rows, other runtime-file changes, stale or missing receipt bindings, altered historical review metadata, old payload/key/order changes and out-of-scope IDs must fail.

The future release gate, final head CI, full-course893 browser run and independent content/source/model/image reviews are not replaced by this runtime-extension verdict. The technical runtime approval remains reusable only while all seven runtime hashes and the source inventory match exactly; changed content requires its own review.
