# MathExam task: clear arithmetic entry and division

## Identity

- Owner: MathExam owner; date: 2026-10-30 (Asia/Novosibirsk).
- Base: `main`, `6fb959fc0130a0bb8842601d19297e305ac91ac0`.
- Branch: `fix/division-single-confirmation-large-digits-20261030`.
- Review level: `MEDIUM` (bounded navigation and corrective behavior across existing pages).
- Approved scope: owner requested redesign following the staged arithmetic strategy and specifically identified repeated confirmations and tiny initial dividend digits. This is the first reviewable release, not the full shared-engine rollout.
- ADR: no new architecture; Proposed ADRs are not treated as accepted.

## Goal and verified evidence

Make a direct visitor able to choose an arithmetic operation and work through division without redundant continuation clicks, misleading decimal operands, or undersized digit buttons. Preserve existing addresses and unfinished work.

The current guided `48 : 2` has 14 mathematical actions and 13 extra continuation submits. Later navigation CSS changes prefix buttons to 16px while notebook spans remain 24–30px. The standalone decimal-divisor page needs original/normalized operand separation. The arithmetic entry calls a four-operation course a division course.

## Scope

In scope: existing guided division auto-continuation and digit typography; old accepted-session compatibility; decimal-divisor rendering/hints/metadata corrections; existing arithmetic entry navigation and wording; protected URL registry and relevant regression gates; rebuilding the matching standalone division download.

Out of scope: changing mathematical action plans, deleting matching numerical answers from different operations, a new diagnostic or training engine, migrating storage schemas, board/server/cabinet protocols, mass canonical changes, publishing or requesting recrawl. Later stages of the approved strategy remain ordered after verification of this release.

## Acceptance criteria

- [ ] A correct nonterminal answer advances to the next actual question in one submission; wrong/empty answers do not advance.
- [ ] Completed work remains visible, next answer input is empty and focused, and help does not leak between steps.
- [ ] Old v1 pending and accepted attempts remain readable without duplicating completion or changing assistance counts.
- [ ] Initial dividend buttons match notebook digits at desktop and 320/390px.
- [ ] Decimal preparation never displays normalized dividend with original divisor as the working expression; help describes both operands.
- [ ] Four clear arithmetic entries, optional diagnosis and existing resume behavior are available without registration.
- [ ] Protected paths and canonical roles remain; relevant parameter/hash and classroom contracts stay intact.

## Checks and review

Required: guided core, remediation bank check, both guided and notebook browser suites on both public routes, search-entry/standalone browser suite, targeted decimal and route gates, URL contract gate, SEO/sitemap checks and `git diff --check`.

Focused independent code review and browser screenshots at desktop/mobile are required. Review shall distinguish corrected behavior from evidence of actual learning gains. Real pupil usability validation remains a post-release activity.

Claude design consultation: not applicable to the bounded corrective implementation, which preserves the mathematical action sequence and existing interaction primitives. A substantial common-engine/learning redesign in the later stage will require the repository's consultation workflow. No Claude response or release approval is claimed.

## Risk and rollback

Main risks: skipping an action on rapid submission, old accepted-state resume, losing decimal transformation context, changing entry links or standalone packaging. Targeted regression tests protect these boundaries. Roll back this patch by a normal revert; keep all storage keys/schema v1, previous operands and records. The previous implementation reads the advanced pending states without migration.

## Permissions

Owner authorized implementation in the current conversation ("хорошо, давай переделаем"). Branch, local commits, push and Draft PR are included. Merge, auto-merge and deployment are not authorized; AGENTS requires a separate explicit decision.

## Execution record

- Base and branch verified; initially clean worktree.
- Focused independent code review completed; the raised font-selector specificity initially suppressed selection colors and was corrected to target only `font`.
- Local passing checks: guided core (2700 plans), decimal shift (2800 exact properties), protected URL contract, route DOM, decimal entry DOM, contextual help/standalone/managed suites (33), remediation-bank check, SEO sitemap (12 tests), sitemap generation and SEO entrance/canonical checks.
- First remote browser runs passed all learner scenarios, but an intermittent later geometry failure and its screenshot exposed viewport-origin drift in notebook marks. Drawing now uses notebook-local layout coordinates, with scroll and resize regression coverage. Final exact-head CI is recorded in the PR.
- Initial local browser attempts did not execute learner scenarios: pinned Chromium was missing; download was invalid, and an available Chromium launch was blocked by OS socket permissions. Browser gates remain pending GitHub CI, not recorded as passed. No security settings or gates were weakened.
- PR/head: recorded in the final PR handoff; this document does not claim publication.
- Remote handoffs contain only relevant public repository material; no credentials, private learner records or machine paths.

## Required handoff

Report task, PR, base, head, gate, passed/failed/not-run tests, scope deviations, recommendation and next owner decision.
