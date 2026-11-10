# MathExam task specification

## Identity

- Task: `OGE_CONCEPT_SKILL_MAPS_20261111`.
- Owner: MathExam project owner.
- Date: 2026-11-11 (Asia/Novosibirsk).
- Base branch: `feat/foundations-complete-routes-20261111` (Draft PR #552).
- Base SHA: `74e5d9ef921919c6bfb24712bc5284f9ffd5c5db`.
- Main at task start: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`.
- Planned branch: `feat/oge-concept-skill-maps-20261111`.
- Review level: **HIGH**: broad curriculum coverage and local learner records.
- Architecture: bounded public companion maps, existing native trainers and the finite foundations check engine. Accepted ADR 0014 establishes the linear pilot only; this task does not declare it a platform-wide architecture. Proposed ADR 0001 remains advisory.

## Goal

Give every existing OGE trainer a visible, finite conceptual route: prerequisite, model, deliberate practice, explanation, short independent check and transfer. A learner should know what they are trying to understand, when to stop a practice portion and where to return after difficulty.

## Context and evidence

- The owner requested autonomous implementation and prioritised OGE, while retaining the shared foundation course for basic EGE.
- The existing OGE course has eight practical stories for tasks 1–5 and twenty task trainers for 6–25. Existing models, task variants, managed adapters and old progress remain the source of native behavior.
- The foundation dependency has 135 routes and 2,430 authored questions. It is a reviewed Draft PR, not production. This separate task is stacked on its exact head to keep the two approved scopes reviewable.
- Retained audits and the companion report in Draft PR #550 identify transferable findings: specific feedback, fresh conditions after help, predict/change/compare/explain, equivalent mathematics and separate written reasoning. That PR's native runtime edits are not assumed merged or copied here.
- The six-station negative-number route was reconstructed from retained trainers. The original Claude map file was not recovered.
- The latest user-supplied AGENTS instructions require a separate explicit merge/deployment authorization, overriding the earlier standing permission for this session.
- Git push credentials are unavailable locally; authenticated GitHub connector writes the reviewed immutable blobs/trees and updates only the task ref. Local and remote candidate tree identities are compared. No force, reset, rebase or non-fast-forward merge is used.

## Approved scope

### In scope

- 28 topic maps: eight practical stories; algebra 6–14 and 20–22; geometry 15–19 and 23–25.
- Six concrete nodes per map, dependency arrows and all-open navigation, exact native-type coverage and useful links to the 135 foundation routes.
- Several bounded resource activities across each route, including all ten existing video/model investigations with validated exact selection.
- 18 new questions per map: six practice and two six-question checks, with independent mathematical witnesses, explicit help/error/familiar-condition accounting and a finite result.
- Saved learner explanations, concrete self-review criteria, retained versions, course notebook export and honest distinction between self-review and an objective answer check.
- An additive companion entrance on every native trainer; preserve the existing two-link return bar, all inline engines, controls, banks, managed contexts and old localStorage keys.
- Shared renderer extraction and namespaced store reuse, preserving all foundation behavior and exact OGE/EGE returns.
- OGE hub/course entrances, crawlable metadata/sitemap and explicit source receipts for approved navigation-only changes.
- Independent content and technical review, Node/DOM/Chromium and existing relevant compatibility gates.

### Out of scope

- Rewriting native generators, the FIPI bank, managed/shared adapters, old counters or task semantics.
- Changing Draft PR #550, merging unrelated work, accepting a Proposed ADR, creating a general trainer factory.
- Automatic grading of free-text explanations or proofs, full-topic/exam mastery claims, psychological diagnosis or effectiveness claims.
- Server synchronisation, learner accounts, classroom events, frozen book editions, personal data collection.
- Per-trainer maps for native EGE courses in this OGE-first task.
- Merge, auto-merge or deployment without separate owner permission.

### Files or areas that must not change

Native inline scripts, question banks, exam/managed adapters, historical progress keys, frozen editions, authentication/server code and unrelated PRs.

## Acceptance criteria

- [ ] All 28 maps have exactly six goals, prerequisites, explicit resource actions and stopping rules, explanation criteria and misconception feedback.
- [ ] All declared existing native type/card IDs are covered; all resource/selection/foundation links are real.
- [ ] All 504 new questions pass independent exact mathematics; all conditions, diagrams and explanations receive separate semantic review.
- [ ] Two check pools are distinct. Practice, help, correction, familiar repetition, self-review and an unaided fresh check cannot be confused.
- [ ] No sixth-answer shortcut: explicit completion and all six first unaided answers are required; written work is not machine-certified.
- [ ] Storage corruption, denied writes, unsaved draft, reload, cross-tab edits and deletion preserve honest state without rewriting old learner records.
- [ ] The 28 native companion entrances and source-return paths work at 320, 390 and 1280px; all ten investigations select the requested model.
- [ ] Shared foundations retain all 135 successful route journeys and existing EGE return behavior.
- [ ] Relevant prior gates remain enabled; source preservation is checked independently of the new UI.
- [ ] Draft PR body contains exact base/head and test/review evidence. Publication is not claimed.

## Checks and gates

- Required tests: 504 independent oracles, 28-map/168-node and native inventory contracts, DAG, all source/foundation paths, numeric representation, namespace isolation, notes history/corruption/failure/concurrency, real-DOM races, native source byte preservation.
- Required browser checks: all 28 finite checks; all ten models; mobile/desktop map and notebook; typed text/reload/cross-tab; assisted and familiar repeats; return to the exact node; native embedded isolation; keyboard and zero overflow.
- Prior checks: foundation routes and retained preparation paths, OGE entrance/source contracts, video-model, learning-map, shared/managed and frozen-book compatibility where triggered, SEO and navigator provenance.
- Manual checks: actual screenshots of index, map, explanation, check/result, mobile long labels, and exact coordinate models.
- Final gate marker: `OGE_CONCEPT_SKILL_MAPS_OK`.
- Not run: real-pupil effectiveness/retention study, external provider review and production verification before release permission.

## Review plan

- HIGH because of broad coverage and new independent local learner records.
- Three contributors author disjoint content banks and cross-review another bank. The primary implementer supplies integration and independent exact oracles; a separate contributor reviews notes/check persistence and learner flow.
- Learning design adopts the bounded patterns above; no new external consultation was performed. The owner asked to apply retained audits, not to repeat a provider audit.
- Ready-result review checks conditions, answers, diagrams, instructions, actual models and claims in the UI. Synthetic learner checks cannot establish real-pupil effectiveness.
- External review is optional under the retained review policy; no external provider approval is claimed.
- Handoffs include only repository source and test fixtures, never private pupils' work, credentials or machine-specific paths.

## Risk and rollback

- Risks: incorrect native coverage, misleading mastery badges, notes lost on interruption, help hidden by another tab, map links leaking into managed lessons, visual overload at 320px.
- Controls: exact inventory/coverage, cautious evidence labels, append-only notes and attempt events, byte-preservation contracts, hidden companion entrances in embedded/managed contexts and rendered mobile tests.
- Rollback: ordinary scoped revert after an authorized release. Old source trainers and old storage keys require no migration; new keys can be ignored without deleting notes.
- The two independent tasks must be released in dependency order. A changed main/base requires the owner's exact-base release procedure; no automatic branch repair is authorized by this task.

## Permissions

- START: yes, the owner's direct request to do this large task autonomously.
- Branch, implementation, local verification, logical commits, push via connector and Draft PR: allowed.
- Merge/auto-merge/deployment: **not authorized under the latest session AGENTS**.
- Stop point: complete, reviewed Draft PR and exact-head handoff.

## Execution record

- Actual branch: `feat/oge-concept-skill-maps-20261111`.
- Actual base: `74e5d9ef921919c6bfb24712bc5284f9ffd5c5db`.
- PR/head/checks/reviews: recorded when the integration candidate is complete.
- Source checkpoint and source-binding update are separate ordinary commits within this one task.
- Scope deviation: none; dependency is explicitly an unpublished Draft PR.

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
