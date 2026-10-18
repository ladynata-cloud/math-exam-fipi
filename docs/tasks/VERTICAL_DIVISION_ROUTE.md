# Full-page vertical personal route

## Identity and goal

- Date: 2026-10-18
- Base: `main`, `617caf4f93312447d6ec140ccedeceb39d2d20a6`
- Branch: `feat/vertical-division-route`
- Review level: `MEDIUM`

The owner requested a clear, full-page vertical path, followed from top to
bottom, beginning with the complete existing long-division sequence and then
decimal and ordinary fractions. The student home currently shows one large
next-step card. Personal recommendations are limited to three cards on the
route page. Both views need the complete ordered plan.

## Approved scope

- Render every saved teacher-plan step in server order on the home and route
  pages for OGE/foundation pupils. Use a continuous vertical rail and numbered
  steps on desktop and phones. Preserve default courses without a personal plan.
- Show the first unfinished step, saved outcomes, repeat/resume controls and
  an honest completion count. Opening a trainer is not completion; solving one
  example is not mastery. Do not infer full history from the recent 200 attempts.
- Keep published homework priority and all existing attempt identities.
- Use the existing managed trainers. The companion plan JSON contains 26
  assignments: 12 division, 3 decimal, 9 ordinary fractions, 2 expressions.
  It contains no pupil-specific information. Applying it is a teacher UI action.
- Keep multiplication-table practice as optional support beside the route.
- Cache-bust the changed presentation assets.

Out of scope: auth, persistence, server contracts, score policy, hard locks,
new trainer banks, mirror-board adaptation, hosting changes and deployment.
No accepted ADR is changed. This is presentation within the existing course API.

## Acceptance and checks

- All 26 steps remain visible, ordered and individually openable.
- Both home and route use the same personal route. Homework still takes priority.
- Saved progress, reload, incomplete history, new examples and unsupported IDs
  do not invent completion or replace an explicit plan with a generic route.
- Managed plan IDs create valid server tasks and normalize successfully.
- Syntax, `learning-preparation.test.cjs`, focused vertical-route DOM regression,
  relevant catalog gate and `git diff --check`.
- Inspect desktop and narrow layout where an approved browser is available.
- Gate marker: `LEARNING_VERTICAL_ROUTE_DOM_OK`.
- Existing full browser/server/container CI is reported separately; no gate is
  disabled or weakened to obtain a pass.

## Risk, review and rollback

MEDIUM: bounded presentation behavior across three runtime files. Focused
self-review and state regression are required; external review is optional.
Risk: wrong next-step emphasis or long lists on a small screen. The route uses
the authoritative `/progress` summary and a responsive one-column layout.
Rollback: revert the presentation commit and restore the previous teacher plan
through the normal UI if desired. No data migration or attempt deletion occurs.

## Permissions and handoff

The user's current implementation request authorizes local work, checks, branch
publication and a Draft PR under the session instructions. Merge, auto-merge and
deployment are not performed without the separate release authorization required
by AGENTS.md and the MathExam PR skill. Public handoffs contain no pupil names,
account identifiers, credentials or machine-specific paths.

Execution results and exact head/PR are recorded in the Draft PR handoff.
