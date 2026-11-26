# Виленкин 5: полный годовой курс, наглядное обучение и совместная работа

## Identity

- Task: `VILENKIN5_COURSE_QUALITY_20261120`
- Owner: MathExam owner, current conversation
- Date: 2026-11-20
- Base branch: `main`
- Base SHA: `0c360a287f9b16c96d9ac67cba025425f57f0198`
- Initial source base: `d24e07fcff59af5c79f5f8ef8c19f3ae609d3833`; reviewed V5 source checkpoint: `5f8ceecea2bf1915d4518167272f24cc3ee159f6`. The release composition includes the separately approved and merged Peterson 5 PR #689.
- Planned branch: `feat/vilenkin5-course-quality-20261120`
- Review level: `HIGH`
- Related issue or ADR: existing Vilenkin full course and existing trainer bridge; ADR 0001 is advisory.
- ADR status: `Proposed`; implemented code and applicable tests establish existing bridge behavior.

## Goal

Make the complete Vilenkin grade 5 course understandable through actions and accurate visual models, clear worked steps, fresh practice and honest independent checks. Cover both textbook parts, retain existing work, add controllable authored animations and genuine shared board state, and publish only after the applicable mathematical, persistence, browser and board checks.

## Context and evidence

- `school/vilenkin5-lessons.js` contains 134 lessons across all 51 textbook points, plus two supplementary units: 59 lessons in part 1, 69 in part 2, six in the final/transition units.
- The canonical entrance is `/courses/vilenkin-5/` → `/school/index.html?course=vilenkin5#course/vilenkin5`.
- `/courses/vilenkin-5-part-1/` is a supplementary first-part course: 29 units, 522 tasks, 87 examples and 236 worked steps. It does not cover part 2.
- The full course has mathematical generators and resume support. Some model families fall back to an unrelated number line; model parameters currently do not survive remounting.
- Its 135 board-picker links open an iframe, but no V5 board-mirror adapter is registered at the base SHA.
- Reusable source components: first-part `labs.js`, pure arithmetic generation/rendering in `practice.js`, authored course-example media and the existing board bridge.
- Read-only baseline passed: 16,080 independent generated-task checks, 1,088 model boundaries and the first-part content gate.

## Approved scope

### In scope

- Preserve every `v5f-*` lesson ID, the 51-point coverage and both textbook parts.
- V5-specific learning sequence, accessible typography, explicit input questions, contextual help, persistent investigations and first-attempt evidence.
- Reuse existing content and arithmetic components without copying a second canonical task bank.
- Correct topic/model mappings; actual long-division layout; relevant visual support for part 2.
- Explicit get/apply/subscribe scene API for joint work, without personal progress in its transport snapshot.
- Authored GIF/frame integration and board entry/adapter/registry work by the coordinating agent in this same task.
- Compatibility, mathematical, state, DOM and real-browser checks, including screenshots and two participant board journeys.
- Public V5 landing and narrowly gated hooks in the common school runtime.

### Out of scope

- Replacing the textbook, claiming solutions to every printed exercise, or treating the first part as a complete year.
- Rewriting other courses or changing their content, scoring or identifiers.
- Changing authentication, the underlying board protocol, or awarding personal credit from shared work.

### Files or areas that must not change during the assigned UI implementation

- `courses/index.html`, `docs/PROJECT_STATUS.md`, board registry and release configuration are coordinated separately by the parent agent.
- `school/vilenkin5-lessons.js` and `school/vilenkin5-math.js` remain the canonical bank; existing IDs and generator results remain stable.

## Acceptance criteria

- [ ] All 134 lessons and both parts remain reachable; every textbook point has a relevant visual investigation.
- [ ] The learning sequence makes the current action and the expected input explicit; ordinary fractions have horizontal bars.
- [ ] First attempts, mistakes, drafts, completed steps, help, model state and media context survive navigation/reload.
- [ ] Viewing help cannot manufacture independence; checks use fresh tasks and preserve their evidence.
- [ ] Old progress is preserved; corrupt JSON is not overwritten; import and cross-tab behavior protect existing work.
- [ ] The scene API validates unknown IDs, incompatible tasks, illegal model parameters and impossible completion claims.
- [ ] Board snapshots contain current common work only and can be applied without personal-storage writes.
- [ ] GIFs start and stop on request, have a static final frame and equivalent text; media work does not erase the current task.
- [ ] Real board tests prove synchronization of route, answer, step and model in two contexts.
- [ ] Phone, keyboard, 200% zoom and reduced-motion paths remain usable.
- [ ] Common-runtime regressions pass for Vilenkin 6 and affected other courses.

## Checks and gates

- Required tests: full V5 independent math; V5/V6 resume; scoped quality-state/model/DOM tests; Chromium lesson and screenshot journeys; board protocol/registry and two-context tests.
- Required static checks: JS syntax, unchanged canonical ID/generator signatures, `git diff --check`.
- Manual checks: representative graphics from both parts, long division with a zero in the quotient, decimals, fractions and protractor; complete first/helped/independent journeys.
- Final gate marker: `VILENKIN5_QUALITY_PASS` plus independently reported board/media gates.
- Checks intentionally not run: external provider review unless separately requested; real pupil pilot is not simulated by automated tests.

## Review plan

- Rationale: shared runtime hooks, persistence and board state are HIGH risk and require independent technical review.
- Trainer design consultation applicable: yes. Internal read-only design review completed before implementation; external review is not requested and is not represented as performed.
- Learning question: can a pupil predict a result using an appropriate model, explain the transformation, and then solve a fresh analogous task without help?
- Supplied material: existing public course code, mathematical gates, first-part labs/arithmetic and existing board adapter. No private pupil data.
- Decisions: preserve the complete bank; reuse proven first-part tools; remove unrelated model fallbacks; keep personal and shared state separate; keep help visible and honestly recorded.
- Ready-result review: independent mathematical/technical review, representative screenshots, browser evidence, plus explicit remaining questions about real learner comprehension.
- External review required: no under the standing owner policy; no provider verdict has been obtained.
- Sanitized handoff: scoped code and synthetic test work only; no credentials, personal data or private documents.
- External provenance if later used: provider, PR, base SHA, head SHA, verdict and verifiable source/timestamp.

## Risk and rollback

- Risks: regressions in shared school code, stale drafts, misleading generic models, excessive transport snapshots, help being counted as independent work.
- Rollback: revert the task commit(s), remove V5-specific includes/adapter registration and leave both existing personal keys intact. Old canonical routes and content remain available.
- Compatibility: retain `mathexam.workshop.v1` and `v5f-*`; new V5 detail state uses a separate versioned key. Shared iframe work never reads/writes personal records.

## Permissions

- `START`: yes, current owner instruction confirmed by coordinating agent.
- Branch creation: yes; isolated worktree already created.
- UI agent local commits/push: no; hand off uncommitted work to root.
- Draft PR, controlled merge and publication: root coordinates under current explicit owner instruction and applicable release policy, after checks.
- No force, reset, rebase, protection changes or TLS bypass.

## Execution record

- Actual branch: `feat/vilenkin5-course-quality-20261120`
- Actual base SHA: `d24e07fcff59af5c79f5f8ef8c19f3ae609d3833`
- Actual head SHA: pending coordinated release
- PR / commits: none by UI agent
- UI implementation: all 134 canonical lessons and both parts are retained; eight relevant model families, per-mode draft/first-attempt/help evidence, current-scene API, compatible backup/import and V5-only presentation hooks are implemented. Canonical lesson IDs and generators are unchanged.
- Tests passed: `VILENKIN5_QUALITY_PASS` (1,008 scoped model/state/DOM checks); an additional actual-app JSDOM run completed all 134 guided flows and 431 accepted steps; independent V5 math (16,080 generated tasks, 1,088 model boundaries); V6 math (23,280 generated tasks, 2,976 model frames); Makarychev 9 (13,020 answers, 357 model frames); workshop state (7,400 generated tasks/steps); V5/V6 resume (8/8); foundations models (3,960 mathematical experiments). The board suite passes 11/11, including 1,072 semantic scene round trips and actual app/adapter restoration without personal-storage access. JS syntax and `git diff --check` pass.
- Review corrections verified: fraction operands/result keep one unit scale before and after reveal; points 45/46 use natural multipliers/divisors, with 10/100/1000 selectors for the corresponding lessons, while 47/48 retain decimal operands; the perimeter formula lesson starts with the rectangle boundary model. The zero-in-quotient model starts with 4.08 ÷ 4 = 1.02.
- Tests failed: no remaining failures in completed local gates. A test fixture initially selected a V6 course link while retaining a V5 query; it now opens the V6 course explicitly and verifies its unit navigation in an iframe.
- Tests not run locally: Chromium journeys, screenshots and the real two-context board server gate. Chromium startup is blocked by the environment (`socket(): Operation not permitted`) before a page is created; no bypass was attempted. The CI browser script retains all 134 guided flows, actual GIF load/play/stop checks, 320px screenshots, keyboard and 200% zoom checks. Production checks and release remain coordinated by the parent agent.
- Compatibility decision: historical drafts with an already advanced step and no recorded prior answers stay in the original runtime. Opening them preserves their original raw data; they can finish the old step without inventing missing answers. A new mode/condition enters the new scene format, and historical personal raw is never transported to the board.
- Scope deviations: none. No commits or pushes were made by the UI agent. The older `textbook-vilenkin5.browser.cjs` is not invoked by current workflows; the active quality browser script carries its full guided-flow coverage.

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
