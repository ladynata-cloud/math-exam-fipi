# Атанасян 7–9 и 10–11: применение учебных аудитов

## Identity and authorization

- Owner request, 9 November 2026: apply the valuable results of Methodyzer, GeoGebra video and Brilliant audits to both Atanasyan courses.
- Owner clarification: «к курсу и самим тренажерам». This includes substantive, mathematically checked practice in the trainers themselves, beyond course navigation or a personal notebook.
- Review: HIGH (learner state, broad generated lesson content and interaction).
- Working base: PR #497, `6f92a799f70d1b362db706d60cdb7678d97117de`; published main at task start: `89ee66bfe5068f16364d61d091fcbf1a1cbd6287`.
- Branch: `improve/atanasyan-audit-application-20261109`.
- Dependency: preserve PR #497's existing textbook work; do not independently reimplement or discard it. Release after its verified integration.
- START, implementation, branch, commits, push and PR are authorized by the current request. Controlled release follows [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md), applicable checks and the exact-base/head drift guard.
- ADR 0006 is Proposed. This task extends implemented lesson and model contracts; it does not declare the ADR accepted.

## Evidence and learning design

The current saved 2D GeoGebra standard v0.2, stereometry report, 9 November audit closeout, Brilliant audit v12 and requirements register v13 were read. Video observations are selective visual observations, not a complete transcription of all courses. Independent mathematical adaptations must be described as adaptations, not copied video demonstrations.

The substantive Methodyzer source is the owner's saved ReRep mini-group notes and the 55-minute pilot. The file called `MathExam_Methodyzer_Audit.html` is an unfilled template and is not evidence of a completed audit.

Applied principles:

- A short personal attempt before discussion; a small learning cycle with a concrete next action.
- Predict before revealing the result; change one parameter, compare, explain, then use a different independent condition.
- Keep investigation, supported work, independent answers and written justification distinct. A moving diagram or matching measurements is not a proof.
- True geometric dependencies, visible mathematical boundaries, readable labels and non-color cues. Exterior altitude feet are not clamped to a segment. Coincident section vertices are deduplicated.
- Restore drafts, parameters and attempts without reclassifying historical results. Offer help separately from recording help use.
- Preserve offline standalone lessons, old progress keys and the established shared-board contract.

## Scope

Extend existing 7–9 atlas lesson families with investigations and independently checked tasks in congruence, similarity, inscribed angles, tangency and altitude/area. Extend 10–11 investigations with exact cube sections, line-plane projections and sphere sections. Apply a compact personal-work/discussion/next-step cycle to retained 7–9 trainers and add topic-specific fresh-condition practice in each of them. Add task-specific feedback, first-answer history and preserved condition drafts to the actual stereometry task interface. Document exact coverage and avoid claiming a new independent result from historical counters.

Do not alter textbook source scans, reviewed textbook problem banks, authentication, the shared-board protocol, unrelated courses or existing private audit dashboards. This is not a claim that every textbook exercise now has every audited model or that a real-pupil trial has been conducted.

## Acceptance and checks

1. Correct geometric invariants and boundary cases; answer checks agree with independently derived formulas.
2. An opened explanation never becomes a new independent success for the same condition.
3. New and historical drafts survive reload; no silent storage reset or replacement of unknown historical results with mastery.
4. Keyboard-operable controls, compact task/model/action and no horizontal overflow at narrow and desktop widths.
5. Generated pages match source; existing course, model, state and relevant browser gates pass. Navigator source bindings retain their complete provenance history.
6. Independent technical/mathematical review of the final candidate. External provider review is not required under standing policy and is not claimed.

Required checks: existing geometry and stereometry suites, focused new model/state/DOM/browser regressions, legacy trainer compatibility checks, generation reproducibility, navigator preservation and bindings, `git diff --check`, required CI on the actual head. Public release requires current refs, merge identity, deployment evidence and live checks.

## Risk and rollback

Risks are changed condition identity, stale browser state, incorrect help attribution and mobile crowding. Preserve existing serializers, task identities and recovery paths. Use a corrective release or presentation-only rollback that retains any newly written fields and compatible readers. Do not clear localStorage, rewrite shared history or revert serializers in a way that drops new learner work.

## Execution record

Implementation and exact coverage are recorded in the resulting PR and review. Until checks and deployment are verified, this document does not declare the changes published.

### Reload-gate correction, 10 November 2026

The failed `task-feedback.browser.cjs` assertion was reproduced on head
`551e3439665a65029b3e8376a7393a4f5a2c7b2b`. In a diagnostic installed before
application scripts, Chromium returned an empty `localStorage` area after a
`file://` reload: the course key was `null` and there were no storage keys.
Before the reload, the synthetic learner's unfinished `1/` and earlier topics
were present. The application therefore started with no saved input; this is
not evidence of a runtime serializer deleting a learner answer on the website.
The unchanged generated lesson completed all 78 journeys at 320/1280 widths
when served on a stable web origin.

The browser gate now serves the exact generated files from a loopback HTTP
origin, matching the site's storage-origin contract. All existing assertions
remain, with additional checks for the stored draft before and after reload
and unchanged work in every earlier topic. No runtime code, saved-work schema,
storage key, expected answer, retry or timeout is changed. The single-file
lesson and the existing file-based offline checks remain available; the gate
does not promise browser-independent persistence for `file://` URLs.
