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

Primary risks are incomplete subpart coverage, wrong square-root signs/domains, accepting an untransformed expression when a specific form is required, losing graph restrictions, and disturbing old task indices. Use independent fixtures, exact arithmetic, append-only build, immutable prior-task snapshot and saved-work regression. Rollback is an ordinary scoped revert with no learner-storage deletion.

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
