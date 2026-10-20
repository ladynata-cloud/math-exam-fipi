# Task 13: interactive laboratories for every existing prototype

## Identity and owner direction

- Base main: `39c63a63602cd7ae275e76ed647057c2793f576f` (published PR284).
- Branch: `feat/task13-interactive-help`.
- Review: MEDIUM, bounded frontend expansion of existing task-first optional
  help, SVG explorations and signed-term manipulation; no platform protocol.
- The owner asks to improve task13 inequalities, cover every prototype already
  there, add more laboratories/interactivity, and connect appropriate parabola
  graphs with the method of intervals.

## Current evidence

The public task13 entry redirects to `oge13-inequalities-series.html`. Its
minimal task-first wrapper and same-page help are already published. The bank
has 26 tasks: six linear, eight quadratic, four graph-reading, four no/any
solution, four systems. Most help drawings are static. The old fixed plot
extent makes the vertex of `49x² - 36` barely distinguishable from the axis;
the SVG minimum width also forces scrolling on narrow screens.

The older `OGE_COURSE_03E_TASK13.md` is an unexecuted broader generator/registry
plan. It is not this scope. This task covers the actual current 26 prototypes,
without claiming a complete FIPI corpus or adding absent equation families.

## Approved scope

- Keep the first view focused on the task and a help button. Every existing
  prototype receives a usable, task-specific laboratory inside requested help.
- Linear inequalities: move whole signed terms, distribute a bracket through
  its actual terms, inspect division by a negative number, and test the
  original inequality at a chosen x. Moving a term alone never reverses the
  comparison sign; dividing both sides by a negative number does.
- Quadratics and products: connect a movable x, the point on the parabola and
  positive/negative intervals. Check exact roots separately and explain
  strict/non-strict endpoints. Use an adaptive scale with a visible vertex,
  including the fractional roots `±6/7` and downward parabolas.
- Graph-reading: retain the supplied diagram as immutable task information.
  A separate model tests each chosen candidate against that diagram at a
  trial point, including the endpoints and candidates without real roots.
- No/any solution: compare candidates using x² and the expression value, with
  optional minimum reasoning. A finite set of trials is not presented as
  proof for every real number.
- Systems: one trial x on two number lines shows whether each condition and
  both together hold. Explore the common part without automatically choosing
  the final answer.
- Give one clear action at each level; reveal deeper explanations optionally
  on the same page. Preserve lab nodes, nested disclosures, trials and answer
  drafts through help return/reopening, task navigation and theme switching.
  An explicit new round resets attempts/labs while retaining accumulated stats.
- Preserve all DATA content, answer identity and order, grading, existing
  storage compatibility and explicit shown-answer no-credit behavior.
  Labs never fill, select, submit or award the final answer.
- Provide previous/next and access to every current task, a clear course return,
  legible responsive diagrams/controls, and horizontal fraction bars.

## Boundaries

Only the existing task13 series, scoped tests/workflow and task/status docs
change. Keep the public redirect/URLs, bank, registry, other trainers, board,
cabinets, authentication and server unchanged. Do not adopt the neighboring
legacy trainer's auto-answer or grading state. Claude API remains deferred by
the owner's current decision; no paid consultation or provider review claimed.

## Verification and review

- Independent arithmetic and endpoint checks for all 26 original tasks and
  their candidates; compare interactive observations with original predicates.
- Preserve the existing DATA hash and all old scoring/reveal/navigation gates.
  Update only old assertions that the static help board must be primary,
  replacing them with meaningful interactive-lab visibility/fraction checks.
- Node learner tests for every model, endpoint/sign edge cases, state retention,
  no auto-answer, no duplicated credit and no reveal-to-clean reset.
- GitHub browser CI with all prototypes, desktop and mobile, real controls and
  pointer/keyboard alternatives, same-page return, original graph preservation,
  no internal diagram clipping and readable fractional endpoints.
- Independent mathematics/pedagogy review and exact-head final review. Run the
  affected existing special-course gates; full course CI remains unchanged.
- Review relevant screenshots, exact base/head/tree, normal merge, Pages and
  the public asset/live interaction before reporting publication complete.

## Risk, permissions and rollback

Risks are comparison-sign reversal, numerical errors at exact endpoints,
confusing samples with universal proof, tiny diagrams, stale lab state and
accidental progress changes. Keep model state separate from final grading and
test the original inequalities independently. Rollback is a normal frontend
revert; no data migration.

The current owner request authorizes implementation, and standing explicit
cloud publication permission authorizes the normal reviewed merge/deployment.
No force, rebase, admin override, weakened gates or status-only follow-up PR.
Verify authoritative main before merging and record release evidence in the
PR; reconcile status at the next substantive task.
