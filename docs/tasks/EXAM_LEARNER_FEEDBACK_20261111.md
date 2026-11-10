# Exam courses: concrete learner feedback — 2026-11-11

## Identity

- Task: EXAM_LEARNER_FEEDBACK_20261111
- Owner request: continue the Brilliant and VK GeoGebra audit and improve OGE, EGE profile and EGE basic courses.
- Date: 2026-11-11, Asia/Novosibirsk.
- Base branch: main.
- Validated starting base: 71e94b46305300c4e959df1c7fe38228551b853e.
- Planned branch: fix/exam-feedback-audit-20261111.
- Review level: MEDIUM.
- Existing architecture only; no new archetype or ADR adoption.

## Goal

Make the next learner action correspond to the actual problem. Missing input must receive interface guidance before mathematical grading, and algebra steps must show the numbers and expressions the learner can see in the condition.

## Context and evidence

The current owner request authorizes this bounded continuation. Root AGENTS.md, PROJECT_STATUS.md, ROADMAP.md, REVIEW_POLICY.md and both MathExam PR/release skills were read. Existing course maps and pending PRs were inspected. This task does not claim to complete the external audits, all exam subtypes or the pending combined release.

At the starting base:
- practical-variant.js marks every form submission checked before invoking its provider, including empty forms. The tariffs provider returns ok:false for missing input.
- ege-baza/path/data.js expressions/equations steps refer to undeclared k, b and c although the problem shows actual numbers. The same two target blobs are present in the inspected PR #530 candidate.
- ege-profil/part-two/content-algebra.js has analogous placeholders, an inaccurate fixed-log monotonicity hint and a Vieta sum-sign explanation. PR #537 is merged; #530 does not change this file.
- The saved audits distinguish interface assistance from mathematical help and require the condition, action and feedback to agree. They are design evidence, not proof of this candidate passing CI.

Source state was reconciled with the repository status: the complete profile and basic EGE map are already in main. Production availability, delivery and browser behavior remain separate release checks.

## Approved scope

- Prevent empty or whitespace-only required OGE practical answers from reaching the grader; preserve drafts, attempt/progress state and mathematical-help state; focus the first missing field.
- Apply that common renderer to its seven existing storylines. Keep zero valid and explicit optional fields optional.
- Keep the downloadable OGE package synchronized; preserve all other ZIP entries.
- Replace undeclared generator parameters with actual expressions in the basic EGE expressions/equations scaffolds.
- Correct contextual profile algebra hints, fixed-log monotonicity and the Vieta sum sign.
- Preserve current task IDs, conditions, answers, model data, generation order and progress schema.
- Add targeted regressions and one OGE browser step to the existing workflow.
- Stabilize the existing OGE 16/17 browser fixture with explicit archive cards; preserve multi-step requirements and separately cover a legitimate single-step solution.

Out of scope: new course generators, new geometric models, global progress redesign, private audit exports, AI chat, authentication, backend contracts, broad publication of unrelated PRs, external messaging.

## Acceptance criteria

- Missing OGE input shows a neutral instruction, keeps other fields and storage, does not call the native checker or mark mathematical help, and focuses the first missing required field.
- Filling the field clears its input-invalid state. A numeric zero is not missing.
- All seven shared-renderer storylines work in personal/shared DOM scenarios and 320/1280 browser views; downloaded copies contain the same renderer.
- Basic EGE steps use current numbers with correct signs and domain restrictions; generated non-text contracts remain identical.
- Profile hints match each actual expression and logarithm base; Vieta sums have the correct sign.
- A rational-expression hint with zero shift does not enumerate the final root candidates.
- Existing mathematical, saved-state, board and browser gates continue to pass.
- OGE 16/17 retained-step checks use known multi-step cards; a legitimate one-step card ends after exactly one step without changing the learner draft.

## Checks and gates

Required existing workflows: OGE 1–5 interactive discoveries; EGE task-first courses; EGE basic quality; Profile learning start and other applicable triggered gates.

Targeted additions:
- tools/oge-practical-empty-input.test.cjs: real provider pages, complete/partial input, storage and zero/optional input.
- tools/oge-practical-empty-input.browser.cjs: actual focus and feedback at 320/1280, plus the downloadable package.
- tools/ege-baza-concrete-hints.test.cjs: actual expressions and retained generated contracts.
- tools/profile-part2-context-hints.test.cjs: mathematical semantics and no answer disclosure.
- tools/oge-course-native-events.browser.cjs: fully populate multi-field practical answers before requiring publication; separately assert that incomplete input preserves state, publications and focus.
- tools/oge18-steps-pan.browser.cjs: deterministic OGE 16/17 archive fixtures and explicit single-step coverage, retaining the previous multi-step, draft and overflow assertions.

The local execution environment was unavailable during implementation. Pure JavaScript calculations and syntax checks were executed in V8; these are not reported as Node, DOM or browser runs. After the later context switch, local execution became available for report rendering. Full project tests run in GitHub Actions on the assembled candidate. CI must include a real git diff --check. No failing or unrun check is relabeled as passing.

## Review

MEDIUM: bounded instructional text and one shared form guard; persistence formats and server boundaries are unchanged.
Focused review was performed on the basic and practical changes. A second agent independently reviewed the profile patch, verified logarithm domains/signs and found a rational-hint answer disclosure. The disclosure was corrected before assembly and a regression added.
External provider audit was not performed and is not required under the standing owner policy. No private audit files or browser screenshots are included.

## Risk and rollback

Risks: a provider with intentionally optional input, text-sensitive tests, sign formatting, and source/ZIP divergence.
Mitigations: explicit required:false support; all seven actual providers covered; exact mathematical regressions; byte comparison of downloadable and source JS.
Rollback: revert the eventual task merge through a normal reviewed commit, restoring the renderer and ZIP together. No saved progress migration or deletion is required.

## Permissions and release

The current owner's continuation request started and authorized this bounded task. Branch, scoped commits, push and Draft PR remain authorized.
The owner subsequently supplied stricter AGENTS.md instructions during this task: stop at a reviewed Draft PR; merge, auto-merge and deployment require separate explicit owner authorization. Those current task instructions supersede the earlier standing publication policy. No merge or deployment is authorized by this task.
Immediately before any separately authorized merge, query authoritative remote main and PR head. A changed authorized base invalidates that authorization: inspect a read-only virtual merge, classify concurrent commits and rerun affected gates; request new explicit authorization for the newly reviewed pair. Do not automatically repair or synchronize the branch after such drift.
No force, rebase, reset, access-control override or weakened gate is permitted.

## Execution record

The final composition exposed a pre-existing nondeterministic OGE browser test: it selected a random 16/17 card but required at least two steps. The native 17 rhombus-diagonals and trapezoid-area builders legitimately produce one step. This package stabilizes that fixture without changing the generators or weakening the multi-step requirement. Independent code review confirmed archive cards 311956 (three steps), 356728 (two steps), and П-Рм10 (one step).

The PR carries exact candidate SHAs, CI results, source-audit continuation notes, release evidence and the standard EXECUTIVE STATUS. Preparation is not publication.
