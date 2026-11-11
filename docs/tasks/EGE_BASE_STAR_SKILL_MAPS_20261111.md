# ЕГЭ база: карты навыков и звёздная карта курса

## Identity
- Task: EGE_BASE_STAR_SKILL_MAPS_20261111
- Date: 2026-11-11, Asia/Novosibirsk
- Base branch: main
- Base SHA: 80be25bd5f9e2d254532e8385d89baa394b6c49b
- Planned branch: codex/ege-base-star-skill-maps-20261111
- Review level: HIGH (shared learning UI across the existing course; independent technical review).
- START: direct owner request in this conversation to improve the base EGE course, add skill maps to every trainer, and create an interactive star-sky landing with meteors and comets.
- Release authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). No task-specific hold.

## Goal
Make the existing base EGE course understandable as a sequence of mathematical skills. Keep all 21 numbered exam positions visible, connect each trainer to concrete prerequisite and practice routes, and provide a navigable star atlas with optional motion.

## Context and evidence
The recorded base has 111 main lesson families: 28 in path/data.js, 79 in path/practice.js and four equation families. exam-map.js defines the 21 positions; course-journey.js reads existing progress without rewriting it. Earlier standalone modules and trainers remain linked from the course. There is only the root AGENTS.md in this revision. Existing code and checks are authoritative; no new platform archetype or server contract is introduced.

At start, the public course exposes 21 positions and the corresponding lesson catalogue. PROJECT_STATUS records the previous map and concrete-hints work; it does not establish delivery of this task. Publication and exact candidate verification are recorded in the PR.

## Approved scope
- Self-contained mathematical skill-map data for all 111 main families and focused links to existing practice/prerequisites.
- Shared accessible map renderer on the landing, in main trainers and appropriate earlier learning modules.
- Star-sky navigation with 21 numbered nodes, topic selection, skills link and true existing progress; pause/reduced-motion/visibility cleanup.
- Explicit learning-only hooks; maps revealing algorithms count as help within an active exercise.
- Targeted regression and browser coverage, task documentation and release evidence.

## Boundaries
Do not change mathematical answer banks, stored progress schema, assessment rules, authentication, board/server APIs, unrelated courses or deployment configuration. Do not expose learning maps inside exam/checkpoint/managed assessment modes. Do not turn one correct answer into mastery of every micro-skill. Existing status projections remain source of truth.

## Acceptance criteria
- Every main family has a specific map with concrete mathematical skills, working prerequisite/practice links and its correct exam position.
- All 21 positions are keyboard/touch accessible on the star map and remain available as ordinary cards.
- Maps do not reveal current-task answers or overwrite drafts; any in-task method help goes through the existing help marker.
- Actual independent practice evidence is labelled as evidence from the named trainer, never as exam readiness or blanket skill mastery.
- Unknown/blocked/corrupt progress is not treated as zero.
- Mobile 320/390 and desktop layouts remain usable without horizontal page overflow.
- Animation can be paused, follows reduced motion by default, suspends when hidden/offscreen, and cleans up on navigation.
- Existing applicable course tests and new regression/browser gates pass on the final candidate.

## Checks and gates
- New data/DOM and browser tests for coverage, links, read-only progress, assistance semantics, keyboard/mobile, animation lifecycle and legacy exclusions.
- Existing ege-task-first workflow and EGE base virtual classroom, SEO/catalogue and other applicable CI.
- Syntax and diff whitespace checks on cloud checkout.
- Independent internal review of math mapping, changed code and actual browser outcomes.
- Local shell checks unavailable at start (no execution environment); GitHub Actions supplies the real checkout/browser gate. Report missing checks honestly.
- Final gate: EGE_BASE_STAR_SKILL_MAPS_PASS only after passing applicable checks.

## Review
No external provider review requested or performed under the standing owner policy. Internal agents review separate implementation areas; they are not an external provider approval. Handoffs contain only public project source and scoped task context. No secrets, private documents, learner data or authentication material.

## Risk and rollback
Navigation and disclosure regressions, false progress labels, motion/accessibility, and accidental help in checks are the main risks. The implementation introduces no new learner storage or migrations. A normal corrective commit can remove the new script/style loads and optional hooks while retaining all existing data; no reset/force/rebase or learner-data deletion.

## Permissions
Task branch, scoped commits, push and Draft PR are authorized by the direct request and project workflow. Mark ready, squash-merge, established Pages publication and live verification are authorized after checks. Requery authoritative main/head immediately before merge. If base changes, inspect the composition, classify concurrent commits and rerun applicable gates; preserve concurrent work.

## Execution record
Cloud implementation; exact head, tests, final review and deployment evidence are recorded in the PR. Preparation is not publication.
