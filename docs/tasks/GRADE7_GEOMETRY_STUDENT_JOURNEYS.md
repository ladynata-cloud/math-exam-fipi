# Geometry: understandable student journeys

## Identity

- Date: 2026-10-16
- Owner: repository owner, current conversation
- Base: `main` at `bde7cd1279baf292a206e5ef70abfd98a3e2b825`
- Branch: `feat/grade7-geometry-student-journeys`
- Review level: `MEDIUM`

## Goal and evidence

The owner requested another student-perspective review of both published grade 7
geometry journeys, clearer guidance and playful practice, completed in the cloud.
The public workbook exposes 103 lessons at once; the cabinet's 17 section names
omit their topics. A fresh managed attempt starts at independent practice and
the interactive workshop is easy to miss. Viewing explanations and answering
workshop steps share the existing `revealed` counter, so neither can establish
independent mastery. Photo proofs 1/3 use SAS; photo proof 2 uses SSS.

## Scope

- Clear starts, meaningful section names, compact missions and continuation in
  the two existing journeys; preserve every lesson and the optional perimeter work.
- Derive cabinet progress from the existing full-history `/progress` response.
- Make the existing workshop easy to enter, reduce duplicate text, improve
  feedback and distinguish a completed explanation from independent work.
- Order public continuation by workbook sections; explicitly finish a route.
- Preserve all task IDs, generators, evaluation, persistence schemas and APIs.
- No pupil records, assignments, authentication, infrastructure or reward rules change.
- Reconcile project status with the already published PR 249 baseline.

## Acceptance and checks

- Both journeys have a clear first action and short, named milestones.
- All 103 workbook lessons and three source-photo proofs remain reachable.
- Photo 2 is explicitly separate from the first triangle congruence criterion.
- Help never earns independent-completion claims; fixed photo conditions are
  not described as new independent variants.
- Progress and navigation remain isolated by account, including async updates.
- Existing model state, read-only behaviour and mobile layouts remain valid.
- Run content/integration, active-practice and real-server geometry browser gates,
  focused route/history tests, syntax checks and `git diff --check`.

## Review and rollback

MEDIUM: bounded recoverable UI changes on existing contracts. Independent review
of the final diff and focused regression evidence is required. External review
is not required at this level. Review handoffs contain only repository-relative
paths, synthetic test identities and commit IDs. Revert this UI change to roll
back; retain all existing content loaders and IDs. Main risks are navigation
regressions, misleading progress and mobile overflow.

## Permissions

The current direct owner request authorizes implementation, testing, branch,
commit, push and a reviewable PR in the cloud. No force push or access changes.
The repository requires separate authorization of the reviewed PR before merge;
publication status must never be inferred merely from a pushed branch.

## Execution record

- Independent agent review found no blocking correctness, persistence or account
  isolation issues. Its copy/focus findings were corrected and rechecked.
- Passed: four rebuild content gates (7,632 variants), integration (106 families,
  676 unchanged legacy cases), geometry core/construction, route map, six new
  journey tests, grade7 history/state tests (20 combined tests).
- Passed Chromium 138 browser gates: active practice (7 families, 26 checked
  steps), journey navigation (full history, delayed responses/account isolation,
  retry and 320/390/1280px), real HTTP/SQLite rebuild flow (three assignments,
  teacher control, model reload, mobile diagrams, submission and durable reopen).
- Added meaningful journey gates to the existing CI; no gates removed or weakened.
- Syntax and diff whitespace checks passed. Full cloud CI remains pending PR.
- Local browser setup used a packaged Chromium because the default Playwright
  download was truncated; CI retains its pinned Playwright browser installation.
- Public assets deploy through GitHub Pages. Cabinet assets are copied into the
  Amvera container and require its deployment. Neither release is claimed yet.

## Review handoff

Task: two geometry student journeys (MEDIUM UI).
Base: `bde7cd1279baf292a206e5ef70abfd98a3e2b825`.
Gate: focused gates passed; full PR CI pending.
Failures: initial mobile overflow and stale browser selectors corrected; final
focused gates pass. Sparse-checkout missing targets were materialized and the
route-map gate then passed.
Not run: production deployment and pupil-account mutation.
Scope deviations: none; existing contracts and generated task content unchanged.
Recommendation: review the PR and authorize release after CI passes.
Next owner decision: merge reviewed PR and update Pages plus the Amvera cabinet.
