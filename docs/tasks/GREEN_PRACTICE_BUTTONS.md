# Green cabinet practice buttons

## Identity

- Task: Green styling for the two public practice links in cabinet focus notes.
- Owner: Project owner.
- Date: 2026-10-20.
- Base branch: `main`.
- Base SHA: `5c34db8566f3a48ce47dcb721761b6a38a067934`.
- Planned branch: `fix/green-practice-buttons`.
- Review level: `SMALL`.
- Related issue or ADR: none; no architectural change.

## Goal and evidence

The owner marked the rounding and OGE19 practice buttons in a cabinet screenshot
and requested green buttons. Both links are already rendered by the shared
focus-note helper. The current theme provides green and dark-green variables.

## Approved scope

- Apply the existing green theme, white labels, and darker hover styling only
  to `.prep-focus [data-focus-practice]`.
- Bump the preparation stylesheet cache version and reconcile project status.
- Preserve URLs, focus outlines, layout, learner data, and trainer behavior.
- No server, authentication, assignment, or progress changes.

## Acceptance criteria

- Both practice buttons have green backgrounds and readable white labels.
- Hover retains white labels with the existing darker green background.
- Existing focus indication and unrelated button styles are preserved.
- Published styles load in the live cabinet.

## Checks and gates

- Required static checks: inspect scoped diff; `git diff --check`.
- Manual checks: theme contrast, selector scope, live cabinet visual check.
- Final gate marker: `GREEN_PRACTICE_BUTTONS_OK`.
- No new automated tests or broad arithmetic regression run: the change only
  affects CSS and its cache key. Existing required CI gates remain in force.

## Review plan

- SMALL: isolated, reversible styling change; self-review plus focused peer
  inspection. External review is not required.
- Handoff contains only the minimum public repository diff, without user data
  or authentication material. Any review must identify the reviewed revision.

## Risk and rollback

- Risk: stale cached styles or unintended selector scope.
- Mitigation: versioned stylesheet and narrowly scoped selectors.
- Rollback: revert the CSS rules and stylesheet version in a normal follow-up.
- No persisted data or compatibility contracts change.

## Permissions

- The current user request authorizes implementation, branch, commit, and PR.
- The owner's explicit publication authorization persists in this conversation
  and covers merge and deployment of this requested change.
- No force operations, admin override, or auto-merge are authorized or needed.

## Execution record and handoff

Record reviewed head, PR, local checks, exact-head CI, authoritative base guard,
merge identity, and production verification in the PR release record. Report
failures and not-run checks explicitly; no copied marker constitutes review.
