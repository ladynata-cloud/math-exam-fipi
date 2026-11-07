# Макарычев 8: весь раздел «Квадратные корни»

## Identity

- Task: MAKARYCHEV8_SQUARE_ROOTS_COMPLETE.
- Owner: MathExam project owner.
- Date: 2026-11-06 (Asia/Novosibirsk).
- Base branch: main.
- Verified starting base: `6c64ac63e6bad70993ec50995d3a39976b1b0a36`.
- Branch: `feat/makarychev8-square-roots-complete-20261106`.
- Review level: HIGH: a complete mathematical chapter, including graph interpretation, domain restrictions, exact radicals, proofs and preserved work.
- Approved task instruction: «обеспечь готовность всей темы по квадратным корням к учебнику Макарычева».
- This directly requested continuation starts the scoped work. No new architecture or accepted ADR change is proposed.

## Goal

Make the existing Makarychev grade-eight chapter II ready for study from real numbers and the definition of an arithmetic square root through operations, graphs and double radicals. Complete every numbered exercise and subpart in the chapter, including its additional exercises, with optional retained steps and mathematically justified feedback.

## Verified context and source

The previous release PR463 is merged and live: 51 topics, 722 task cards and 1955 worked steps. Live data.js matches starting main, SHA256 `b5ba5311d281f9508e7884aa8a4614f2bc47f3d3da0cb0cb98344ee27559af40`. Complete sequential source coverage elsewhere remains 1–109. This task intentionally prioritizes roots at the owner's request; it does not claim the intervening fractions are newly completed.

The owner's uploaded Makarychev/Mindyuk/Neshkov/Suvorova textbook, edited by Telyakovsky, 17th stereotyped edition, 2024, has 321 PDF pages and SHA256 `356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`, identical to the existing course source. Chapter II occupies printed pp64–114 (chapter III starts on p115) (PDF offset +1). The source map establishes p10–p19, exercises 268–446, plus all additional exercises 447–509. Source pages and answer pages are rendered and reviewed outside git. Text extraction is a navigation aid, not mathematical evidence for signs or fractions.

## Approved scope

### In scope

- All 242 numbered exercises 268–509, including every subpart, repeated calculation/substitution, proof, construction and explicit secondary question.
- Existing ten topics p10–p19, original theory, worked examples and the chapter review questions where the textbook supplies them.
- Append missing cards only. Additional exercises are assigned to the relevant existing topic and explicitly retain the original exercise/page provenance.
- Focused corrections or extensions to this course's checker, mathematical display and existing interactive graph family only when necessary for these source tasks.
- An accessible chapter entry and truthful coverage indication, source/math/interaction tests, deterministic build and release evidence.

### Out of scope and protected areas

- Other textbook chapters, the global difficult-problem bank, unrelated courses, paid providers, backend/authentication and production learner records.
- Shared-board/cabinet integration is a separate course-wide task; this change does not claim that it adds synchronization.
- Preserve all 722 existing task objects, IDs, positions, deep links and storage keys; do not overwrite previous learner notes or answers.
- No source PDF, raw OCR, page images, personal information, credentials or machine-specific paths in git.

## Acceptance criteria

- [x] Every number 268–509 and its actual source subparts have an explicit coverage record and a complete route in the existing course.
- [x] Source formulas, decimal signs, radicand bounds, domains, absolute values, all root branches and restrictions are checked independently.
- [x] Every added task and retained step accepts its verified answer and rejects meaningful wrong answers.
- [x] Graph tasks require the learner's action; no final graph/answer is filled in as their completed work.
- [x] All prior task payloads and indices are identical to the baseline.
- [ ] New prompts and necessary figures work at 320/390/768/1280 widths; saved notes/steps survive reload/import.
- [ ] All applicable course, source, state, DOM and browser gates pass on the candidate, with independent review and honest limitations.

## Checks and review plan

- Preserve the four prior independent source-math suites and existing schema/model/state/import/graph/DOM/browser gates.
- Add source-bound chapter coverage and exact mathematical checks, negative-answer/domain regressions, and full new-card responsive browser journeys.
- Review authoring in three disjoint ranges (268–344, 345–436, 437–509), then cross-review against the actual source with root integration review.
- Final marker: `MAKARYCHEV8_SQUARE_ROOTS_COMPLETE_OK`.
- External provider consultation/audit not performed under the owner's standing waiver. Agent mathematical/code review is not represented as an external-provider verdict.
- Physical devices, real-pupil trials and shared-board synchronization are not claimed by automated or synthetic checks.

## Risk and rollback

Primary risks are incomplete subpart coverage, wrong square-root signs/domains, accepting an untransformed expression when a specific form is required, losing graph restrictions, and disturbing old task indices. Use independent fixtures, exact arithmetic, append-only build, immutable prior-task snapshot and saved-work regression.

Forward compatibility with the original 722 cards is verified; reverting the whole task to that older course is not a safe recovery plan after learners create results for the new cards. The old `app.js` omits unknown task IDs in `sanitizeState`, then `lessonView` calls `save` and overwrites the same storage key. An independent in-memory reproduction against the original base retained the old `p17-t01` record but removed a new `roots-268-a` answer and notebook on the first saved lesson opening. The expanded course retained both records. Keeping the key name unchanged does not prevent that loss; no automatic downgrade backup is provided.

The recovery plan is a scoped corrective release preserving the expanded `data.js`, task IDs, indexed routes, compatible checker and storage schema. If the course must be paused before a correction is ready, serve a temporary static maintenance page at its entry that does not load the course runtime or read/write learner storage; retain the expanded assets for restoration. Verify that the maintenance response cannot start the course application before publishing it. A limited CSS/UI rollback is permissible only after compatibility with the current data and saved work is checked. Do not deploy the old data/checker or use a blanket task revert after new results may exist. Any actual recovery publication remains subject to the task's owner authorization and release checks; this plan does not claim that maintenance or recovery has been deployed.

## Permissions and execution boundary

The current direct task authorizes implementation and verification of this existing course continuation. Local branch/commits, push and a Draft PR are in scope. The repository standing publication policy is recorded in `docs/OWNER_RELEASE_AUTHORIZATION.md`; final release must also respect the stricter conversation-level merge boundary and applicable base/head guard. No force, reset, rebase, admin override, disabled TLS or weakened tests.

## Execution record

- Initial repository identity and clean main verified; exactly one task branch created.
- Previous PR463 publication independently reconciled from live data and GitHub metadata.
- Completed source authoring: 338 +439 +269 new source cards, plus21 review cards; generated course1789 cards/4116 steps and174 theory blocks. Source coverage includes all242 numbers and1066 textbook cards in the chapter.
- Independent range reviews cover346/449/271 source cards. A further21 review expectations and8 alternative examples bring the checked expectations to1095. The integrating reviewer independently verified the five review cards revised by their reviewer; their provenance is explicit in the oracle.
- Source gate9627 assertions PASS; root engine732 checks PASS; legacy four source/math suites, schema, model, state, import and graph contracts PASS. All original722 task objects and addresses are unchanged. Full local DOM passed all1789 cards and4116 steps. Real-browser evidence is reported for the exact candidate in the PR.
- The local Chromium launch fails under the system socket policy. No bypass was attempted; the required exact-head GitHub Actions browser runs and artifact screenshots remain the release gate.
- Independent runtime findings fixed: source-ordered home/results/search, original deep links, unit source grid and exact free examples. Independent gate findings fixed: complete oracle ID sets, full baseline membership, source/coverage identity, study order, mandatory review-card coverage and alternate-answer browser reload journeys.
- Sanitized review evidence: [source/runtime review](../reviews/MAKARYCHEV8_ROOTS_345_436_AND_RUNTIME_REVIEW.md), oracle fixtures and the consolidated [integration review](../reviews/MAKARYCHEV8_ROOTS_INTEGRATION_REVIEW.md).
- No merge or deployment has been performed. The Draft PR, when opened, must record the actual head, CI run links and final gate; this document does not turn pending browser checks into a pass.

### Resumed verification, 2026-11-07 (Asia/Novosibirsk)

- Recovered the complete existing task branch and committed the 25-file implementation locally as `cc9dad296b9c52532469b6c08e2a237e96565909`.
- An independent continuation review found and corrected mixed-fraction graph input, clipped labels in exercise 468, misleading zero axes in cropped views, and coordinated runtime-cache versions. Source equations, answers, IDs, coverage and existing learner records remain unchanged. The source display adjustments for 508в/г include the actual zero axes; their independent reviewed hash was renewed.
- Final source gate remains 9627 assertions /1095 expectations PASS. The strengthened root-engine gate passes 769 checks. Full course schema remains 1789 cards /4116 steps; the full DOM journey and all four import tests passed. Focused DOM journeys additionally cover all 16 learner constructions, nine alternative-answer cases and import precedence.
- All 85 isolated SVG states were rendered without a browser process for diagram review. Final visual review confirms the corrected labels and shifted graph axes. This is diagram evidence only, not responsive HTML or native-browser acceptance.
- Authoritative main advanced from the starting base to `66172e7398d63c1f809cb3befbd29dbb92651109` via PR476, an unrelated college-course catalog change. A read-only virtual merge was clean; no branch synchronization or merge was performed. Recheck the composed candidate after the final local correction commit.
- The attempted task-branch push was rejected by automatic approval review: it requires explicit START/push authorization. No alternate publication path was used. The repository was subsequently verified as the owner's public repository with push/admin permission, but this does not substitute for the missing action authorization. Draft PR, exact-head GitHub Chromium gates and publication remain pending.
- Local Chromium still fails at the environment socket policy; no security-policy bypass was attempted. Final gate `MAKARYCHEV8_SQUARE_ROOTS_COMPLETE_OK` is withheld until the required native-browser checks and visual review pass.

### PR #482 browser and source-binding follow-up, 2026-11-07

- The owner's later explicit START was used to create Draft PR #482. Remote head `73119f0233e9902cbdbed7a78f60b9d475d3033e` has exactly the prepared source tree; the historical pre-START rejection above no longer blocks scoped submission or fixes. Merge and publication remain separately restricted.
- All six initial workflows completed: four passed, while the course workflow's `square-roots` job and the public navigator workflow failed. The ordinary `course` job passed, including native browser coverage of the earlier exercise blocks. The roots source and engine gates passed; the first roots layout failure is not a mathematical error.
- In CI run `42311019122`, the necessary figure for `roots-353-a` ended at y=903.55 on the 320x900 viewport. The artifact was visually inspected. A bounded mobile source/prompt spacing adjustment retains the full condition, font size, graph and all browser assertions. Native-browser confirmation of the correction remains required; isolated local Chromium still fails at the environment socket policy, with no bypass attempted.
- The navigator failure is the expected exact-payload mismatch after the seven coupled course-cache URLs changed. The exact navigator include pair remains untouched. The canonical source-binding refresh function verified the committed layout checkpoint `b0a7aee4f31b626d844ac3d833e5a1963208a771`, changes only the Makarychev index binding, and preserves the other 609 bindings plus all provenance history. No assertion or gate was weakened.
- Current main advanced to `ac0fdfa68f3e6a79f5b08ae2ef43c16dc138c1f8` through the independent VPR release. Its additional navigator entries and source bindings must be preserved during any later composition; the global source checkpoint cannot be selected by blindly preferring either manifest. No branch synchronization, merge or deployment is performed by these fixes.
- The final marker remains withheld pending the corrected exact-head and composed-candidate browser gates. The later request for the whole textbook is a separate proposed task, not content silently added to this roots PR.

### PR #482 full release-candidate verification, 2026-11-07

- The owner requested completion of this existing PR, safe current-main composition, full mathematics/native-browser checks, preservation of earlier work, and a read-only census of the remaining textbook. The separate conversation-level authorization boundary for branch synchronization, merge and deployment still applies.
- Native run `42322793838` confirmed that the earlier spacing correction fixed the first observed case, but found `roots-353-e` ending at 940.75 px on 320 x 900. Run `42323467801` inspected every one of the 1127 chapter cards at that width and found three remaining overflows, `roots-353-e/f/g`, at 913.15625 px. These failures are recorded, not waived. The following correction compacts only mobile headings, logo and surrounding spacing; the full prompt, prompt typography and graph dimensions remain unchanged.
- Layout acceptance now covers all 1127 chapter cards at 320/390/768/1280 widths and height 900: 4508 views and 264 figure placements. It additionally rejects navigator overlap and records the lowest prompt/figure with viewport screenshots. The existing 2161 new-step native journeys,242 searches, all 16 constructions, alternate answers and import/notes checks remain required.
- Run `42325247843` (workflow run 47, head `fd486fbba9595ccb493709fc7f582972d8a5ffab`) passed the complete 320 x 900 and 390 x 900 chapter layouts, all 242 source-number searches and all 2161 added-step journeys. It then failed the 768 x 900 layout sweep on six figures: `roots-314-build` and `roots-353-a` ended at 938.421875 px; `roots-353-e/f/g` and `roots-468-a2` ended at 908.375 px. The 1280-width and later construction/alternative-answer stages were not reached in that roots run. The ordinary course job and all four composed-navigator shards passed; these do not waive the roots failure. The prepared correction changes only heading/spacing/padding at widths 601–900, preserving condition typography and diagram dimensions; its seven coupled course asset URLs use `20261107-roots5`. The browser suite now checks widths in order 768/1280/390/320 so every layout is checked before the long solution/import journeys. No successful new-candidate native result is claimed here.
- Independent comparison with original base `6c64ac63e6bad70993ec50995d3a39976b1b0a36` preserves all 722 task objects,1955 prior steps and indexed URLs. A real regression in whitespace-tolerant `sqrt` aliases was reproduced and corrected before publication; state and native reload cases protect the old accepted answers, independent results, assisted steps, unfinished drafts and notebooks. A synthetic differential sweep preserves all 25234 responses accepted by the former checker across 25594 candidates and 724 saved records. No pupil account or actual saved pupil data was accessed.
- The complete mathematical rerun passes 34017 source assertions, including 9627 roots assertions/1095 expectations. The roots engine now passes 778 checks. Existing schema/model/state/import/graph checks pass. Full DOM verification walks 1789 cards/4116 steps; a bounded 512 MiB V 8 heap completes it without changing assertions after an unbounded process was killed by the local environment.
- The existing quality workflow now also runs on this exact task branch, so an unresolved PR/main conflict does not suppress native verification. Its original two jobs remain enabled. Task-scoped virtual-course and four navigator shards exercise the composed candidate before actual branch synchronization; they use read-only repository permissions and do not update refs.
- `tools/makarychev8-roots-composition.py` requires explicit base/head, preserves all current-main source bindings and VPR routes, rejects unreviewed concurrent commits/paths/conflicts, and checks canonical source identity. Its synthetic checkpoint is temporary test evidence only; its manifest must never be published as actual merge history. After an authorized normal synchronization, bind the real source checkpoint and validate the resulting head again.
- All five concurrent main commits at `ac0fdfa68f3e6a79f5b08ae2ef43c16dc138c1f8` were matched to merged PRs 476,475,478,480 and 477. There are 631 public navigator pages:612 source-bound pages and 19 earlier pages. Preserve 611 current-main bindings unchanged, the reviewed Makarychev binding, all source/discovery history and all 105 non-overlapping concurrent file blobs.
- This checkpoint does not grant merge/publication permission or assert successful future CI. Exact native run links, screenshot review and the final gate are maintained in PR 482 for the actual candidate. Physical-device, real-pupil, external-provider and production checks are not implied.

### Read-only census for the next approved course task

The 2024 edition contains 1340 numbered exercises. Complete ranges are 1–109 and 268–509, totaling 351 numbers. 411 numbers have at least one textbook card. 929 have none; another 60 have selected cards whose complete subpart coverage must be checked. Existing chapters III–VI already have theory and examples. The census compares actual `source.type === 'textbook'` cards in `data.js` with the complete number lists in `source-map.json`; it was independently rechecked at `fd486fbba9595ccb493709fc7f582972d8a5ffab`.

| Block to complete | Exercise numbers | Numbers without any textbook card | Numbers already partly represented |
| --- | --- | ---: | ---: |
| Remaining rational fractions | 110–267 | 148 | 10 |
| Equations and systems | 510–837 | 305 | 23 |
| Inequalities | 838–1062 | 212 | 13 |
| Functions | 1063–1171 | 101 | 8 |
| Integer powers | 1172–1270 | 93 | 6 |
| Advanced problem bank | 1271–1340 | 70 | 0 |
| Total requiring completion review | 989 numbers | 929 | 60 |

#### Exact numbers without any textbook card

| Chapter/block | Absent exercise numbers |
| --- | --- |
| I — Rational fractions | 111–116, 118–133, 135–138, 140–149, 151–154, 156–180, 182–184, 186–200, 202–203, 205–267 |
| III — Equations and systems | 510–512, 514, 516–531, 534–556, 559–580, 583–601, 604–616, 619–630, 632–648, 651–670, 672–686, 688–695, 697–701, 703–718, 720, 722–737, 739–741, 743–837 |
| IV — Inequalities | 838–841, 843–863, 865–880, 883–897, 900–913, 916–934, 937–974, 977–1003, 1005–1062 |
| V — Functions | 1064, 1066–1105, 1107–1117, 1119–1129, 1131–1132, 1134–1136, 1139–1171 |
| VI — Integer powers | 1172–1175, 1177–1192, 1194–1221, 1223–1228, 1231–1240, 1242–1270 |
| Advanced problem bank | 1271–1340 |

All additional-exercise ranges outside chapter II are wholly absent: 212–267, 743–837, 1014–1062, 1144–1171 and 1251–1270. Chapter II's additional exercises 447–509 are included in this PR.

#### Existing selected numbers requiring subpart-completeness review

These 60 numbers are represented by at least one card but are outside the verified complete ranges. Some individual exercises may already be complete; the current evidence does not establish full coverage of these ranges. Preserve their existing cards and add only missing subparts, repeated substitutions, secondary questions or constructions.

| Chapter | Existing selected exercise numbers |
| --- | --- |
| I | 110, 117, 134, 139, 150, 155, 181, 185, 201, 204 |
| III | 513, 515, 532, 533, 557, 558, 581, 582, 602, 603, 617, 618, 631, 649, 650, 671, 687, 696, 702, 719, 721, 738, 742 |
| IV | 842, 864, 881, 882, 898, 899, 914, 915, 935, 936, 975, 976, 1004 |
| V | 1063, 1065, 1106, 1118, 1130, 1133, 1137, 1138 |
| VI | 1176, 1193, 1222, 1229, 1230, 1241 |

This is a census of committed cards and source-map ranges, not a fresh PDF-page audit or authorization to add the remaining 989 exercises inside this PR. Completing 110–267 next would establish continuous full coverage 1–509.

## Required handoff

```text
EXECUTIVE STATUS
Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
