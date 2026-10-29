# Independent chapter VI release-transition technical review

Date: 2026-10-29. Reviewer: independent non-author OpenAI agent `vi_runtime_final`. PR: ladynata-cloud/math-exam-fipi#373. Original reviewed base: `d3122b9f3905cd8f7715cee6a873d031cdb43de4`. Last committed candidate head: `b36a7d8b239516076a367ec9f71957c83d07dccd`. This review covers the subsequent uncommitted implementation snapshot bound by the exact file hashes below; it does not falsely attribute those changes to the earlier commit. No repository files, commits, branch state, publication or real learner data were modified by this reviewer.

**Verdict: PASS for the release-transition implementation, preservation chain and technical runtime behavior at the recorded hashes. No unresolved technical findings remain in this reviewed scope.** Independent content/source/model/image review, the VI content manifest, final exact-head CI, full-course893 browser verification and merge authorization remain separate requirements.

## Reviewed behavior and preservation

The release scope integrates exactly893 cards (755 previous plus138 VI); chapter VI is removed from the candidate registry. The promoted snapshot builder copies the current course and recomposes it without manufacturing approval. A missing, stale-content, stale-runtime or wrong-chapter VI review leaves exactly755 previously published cards reviewed and all138 VI cards in-review.

The seven-input runtime changes from `f358f65b5955ad8ae2443bc8916aadda8f502a07e6274e90b9b21d727979813c` to `04e5a58da99bf68421e8f7aa9baccd8c3b2054766dab4141f912a46eba7690ec`. Only source-inventory.json changes, to `96ab32a3b61bbac81432e6dc6c003cdbcf998e39b8ea3000254689f73ab88cf3`. The validator requires the exact three reviewed VI rows as a suffix and reconstructs the exact old source-index bytes/hash. It also restricts the full runtime filename map and verifies unchanged historical LABELS evidence.

All six historical release manifests carry the new runtime receipt binding. Independent direct comparison against actual Git objects at the old base confirms that removing only runtimeExtensionReview and restoring the previous implementationSha256 reconstructs every old manifest byte-for-byte. The existing reviewer, timestamp, verdicts, content hash, evidence, prior runtimeLabelReview and other metadata cannot change under this amendment.

The builder checks the actual course directory supplied to compose(), including temporary copies. Invalid amendment bindings do not grant reviewed status. Historical gates project only the explicit VI chapter away, and the mandatory new union gate plus existing check_course source/model gate reject missing/extra/duplicate identities and inconsistent source, revision, catalog, scope and complete-book claims. The old755 full lesson/catalog arrays, including status/review and ordering, were independently compared to the actual published Git bundle, not merely to author-generated expected output; they match exactly.

Historical fixtures and the previous LABELS receipt remain unchanged. Ordinary runtime and learner-storage code are unchanged. The workflow now exercises the release union, public full-course browser run, isolated reproduced release and caption checks; VI review-file changes also trigger it.

## Independent probes

The reviewer wrote and executed a separate 91-check Python probe. Its semantic corruption tests deliberately recompute the claimed runtime hashes in the new receipt, so they test actual preservation rules rather than stopping at a trivial stale hash:

- Prior paragraph title/order/other metadata changes; wrong/reordered/missing/extra VI rows; and modifications to all seven runtime inputs were rejected even with coherently updated receipt hashes.
- All six old manifests reconstructed to the exact base Git bytes. Eleven independent provenance/verdict/binding mutations per manifest (66 total) were rejected.
- Isolated synthetic VI approval fixtures tested missing approval, stale authored content, stale runtime and wrong chapter; every case preserved exactly755 reviewed cards. The fixtures existed only in temporary copies and were never publication approvals.
- Full old755 lesson/catalog records and order matched actual base Git objects.

Probe script SHA256: `b1e99b5e9028d0efd2957feacdf80fa017f6bd9b53b6f810e660e4c8d64617bc`.

Probe evidence SHA256: `b9894ff546f50d874b19f9d44a56bbb81b107d47f0aa00e0d097a2643bbf4443`.

The independent real Chromium153 script was rerun against the promoted-but-pending snapshot. All138 VI cold links, titles/source labels, visible source disclosures and public access barriers passed; four catalog journeys, the exact30-card §3 search, six chapter-qualified persistent question-1 drafts and native cross-tab conflict/recovery passed, with no page errors. It used the real entry files and a fresh browser profile; it did not modify the application's data or statuses.

Promoted pending browser bundle SHA256: `8b673ae2326dd2cbd2ef4367c32422c78a255cb0f2609e8705372843b3aef1fd`.

Authored-content SHA256 at that run: `eac1eb2b73cf13a6bd31c4524d4327be75d044f4a174bb7b7d9ff910d5c744e1`.

Browser evidence SHA256: `95e2d06e4c9be48d953e136ac6b84c7bda037c990923ac66609ee65e8aa77a07`.

## Repeated repository checks and resolved findings

The existing review-scope13 and chapter-V preservation9 tests passed. The course checker passed893 cards (540 numbered exercises,701 main parts,53 theory,139 selfchecks) with publicationReviewMatches=false as expected before VI content approval. The VI caption check passed138 DOM journeys; the complete caption check passed893 titles and20 DOM journeys.

The release and candidate suites each had exactly one expected failure at this intermediate stage: the release requires VI approval, and the promoted candidate fixture expects its release manifest to exist. Neither failure is represented as a pass. Their remaining tests passed. Both suites must pass after the independently approved VI manifest is added.

Review found that the original promoted captions test still required in-review status and public exclusion. That was corrected to test the actual release/candidate boundary. A follow-up review caught an always-enabled allowInReview fixture conflicting with the no-preview-notice assertion; the fixture now derives allowInReview from actual publication status. The corrected code passed both caption checks. The full-course captions also correctly distinguish advancedGrade7 tasks from VI numbered tasks and extend the independent19-row paragraph oracle with the independently reviewed VI rows.

## Exact implementation snapshot

| File | SHA256 |
| --- | --- |
| `tools/geometry-textbook/chapter06_extension.py` | `298a4f244b063348b96002d4573c984dcd8da35d7dc08960dbf7301d06fc90b7` |
| `tools/geometry-textbook/chapter06-release.test.py` | `bef7a26e9531ddbf33563a638595d848d3eecb938260284a23dce2d4ed902994` |
| `tools/geometry-textbook/build_course.py` | `82ba1a257828880fff25d88604a63ce1df5e9d3dcf59a0f6e101072c2daf1fba` |
| `tools/geometry-textbook/build_candidate.py` | `9f5ecf36e6c05c4bfcc442c536f61a132e5ef20aed85f75b8571b69039e5c7ab` |
| `tools/geometry-textbook/published_preservation.py` | `a511509001bf30dd326bef401541af3bc10c449262a313c7ae23d13ef31d8ac4` |
| `tools/geometry-textbook/chapter05-preservation.test.py` | `93f18f6283ae3b65775f85a9b53f1907904f5811ecae8991df3ba8b084143b8e` |
| `tools/geometry-textbook/review_scope_test.py` | `ec4e3d61f1aef5ebd7d7fdfbd39acb19ea830d95f1907198b7817ba3f364a87e` |
| `tools/geometry-textbook/chapter06-candidate.test.py` | `a2f2be3af53ebb1723d2470a49c35326f6eebaad7331c153088ba591a49a462b` |
| `tools/geometry-textbook/chapter06-captions.test.cjs` | `f854dd51722170bcf6cc9660756d4164c1499d100280c4b4092bc292a869a20b` |
| `tools/geometry-textbook/captions.test.cjs` | `1967e9585c73c7015ff3290bbeb72fe773b597f17ce1e10cf46dff8a272505c9` |
| `tools/geometry-textbook/release-scope.json` | `5a7f7b2f42817e8bbc43b91306eef400a4ee3ef3fa308b7b230872a7f9171a5f` |
| `geometry-course/textbook/candidate-chapters.json` | `57f8a7b2bad2955fc876a4f60bc42d8a80b577c13f02ff254441b378f1ccf1eb` |
| `.github/workflows/atanasyan-planimetry.yml` | `b911c693728d4f5c12db2518eb919d5cfb7032b05b74dd64fc832dd2c30cd730` |
| `docs/reviews/ATANASYAN_7_9_CHAPTER_VI_RUNTIME_EXTENSION_REVIEW.json` | `76c2cb88441a834286dcf8fe6bb7ce0048a50542ec9d2bac315e8a263889487e` |

## Limits and remaining release checks

This is technical implementation review, not independent approval of138 geometric solutions or manual inspection of every drawing. The new VI content approval was intentionally absent during these probes; the final public893-card entry must be rerun after its real manifest is added. The complete CI browser gate and exact final Git head are not claimed here. Subsequent changes to any listed implementation file require review of that delta.

The coordinator reported remote main advanced to `6b25302788f36d92723e487e92afa7044ced3ad3`. This review does not verify the new base composition or authorize branch repair. The read-only virtual merge, authoritative current-main comparison and any later owner merge decision remain separate gates under AGENTS.md and REVIEW_POLICY.md. No merge or deployment permission is granted by this report.
