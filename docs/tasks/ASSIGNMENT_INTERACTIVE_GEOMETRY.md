# Large interactive geometry on the assignment page

## Identity and scope
- Owner: repository owner; request to enlarge and interact with the drawing directly in the assignment.
- Date: 2026-10-16 UTC.
- Base: `main` at `f123b4cb60894ba2efaed396b61e38b30a0e1f73`.
- Branch: `feat/assignment-interactive-geometry`.
- Review: **MEDIUM**, bounded UI reuse of the existing `grade7-construction` renderer. No new trainer archetype or persistence contract.
- Current request authorizes implementation, tests, commit, push and Draft PR. Merge/deployment require a separate current reviewed authorization.

## Goal and acceptance
Show the saved assignment's geometric drawing immediately at full content width,
with zoom, selection, existing auxiliary constructions, and constrained movement
for photo proofs 1–3. Enlarge attached written conditions in analogous assignments.
Keep task IDs, saved variant, answers, progress, authentication, API and deployment
configuration unchanged. Do not infer an interactive diagram from arbitrary photos.

- Use `attempt.taskSpec.task`, never generate another variant.
- Explore a clone: no mutations or save events for the stored attempt.
- Reflect B across AC in photos 1/2; reflect D/E through F in photo 3.
- Reject degeneracy, preserve the givens, and provide touch and button controls.
- Keep unsupported models and missing renderer compatible with existing trainer/photo access.
- Use full-width natural-aspect-ratio task photos; solution galleries retain existing layout.

## Evidence and reconciliation
PR 250 is merged at the base above. The previous recovery verified the deployed
Amvera learning assets against that release; the previous PROJECT_STATUS entry
describing the student journeys as pending is stale. GitHub publication alone
does not update the Amvera cabinet. The custom Amvera Dockerfile is out of scope.

## Checks and review
Required: invariant tests for all three photo diagrams, saved-task isolation,
renderer coverage and loader ordering, existing geometry and teaching regressions,
JavaScript syntax and `git diff --check`; inspect pointer lifecycle, safe text,
fallbacks and mobile layout. Gate: `ASSIGNMENT_GEOMETRY_READY` only after passing.
Focused self-review; external review is not required by MEDIUM policy.
No private pupil/account data in commits or review handoffs.

## Risk and rollback
Risk: drawing interaction or loader failure. The original trainer link and photo
remain available; component errors must not interrupt assignment submission.
Rollback: revert this PR's UI files; no database migration or progress repair.
Exploration resets on reopening and does not count as a completed lesson.

## Execution
Passed: 378 saved-model variants; 1305 independent equality checks; DOM integration
for zoom, selection, construction toggles, button/pointer movement, cancellation,
unmount, immutable saved attempts, and missing/broken-renderer fallbacks; 2376
workbook variants and 5256 unchanged tasks; 11952 construction diagrams; six
journey tests; ten existing teaching/security regressions; syntax and diff checks.
Focused review covered safe text interpolation, saved-task identity, transient
state, pointer capture lifecycle, photo scope and responsive CSS.

Not run: real-browser layout, physical touch and live deployment verification.
The cloud browser could not reach the local preview server, and local-file access
was blocked by browser URL policy. DOM tests do not establish pixel/layout proof.
No learner data or production state was used in validation. No known test failures
remain. Gate: `ASSIGNMENT_GEOMETRY_READY` for code/DOM; visual acceptance pending.
