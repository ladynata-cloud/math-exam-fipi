# SpaceMath: корни функций и пересечения графиков

## Identity and authorization

- Owner: MathExam. Date: 2026-11-10 (Asia/Novosibirsk).
- Base: `feat/spacemath-dynamic-tools`, PR #527, `754e5cb60fed4af7535b0baa6e9a0c602af68fea`, tree `e7170f1c83e0431340f8598b949c6b3ee44ecbb6`.
- Branch: `feat/spacemath-graph-solutions`. Review level: `HIGH` (persisted shared geometry types).
- Architecture: [accepted ADR 0015](../adr/0015-unified-interactive-board.md). Uses the existing parser, semantic model, JSXGraph renderer, bridge, control/version fences and journal.
- START, local commits, branch, push and Draft PR: explicitly authorized by the owner's current request.
- **Merge, auto-merge and deployment: NOT authorized for this task.** The owner's later task-specific instruction overrides standing publication permission. Complete #526 → #519 → #527, validate the composed candidate, present the actual diff/checks, ask the owner and wait for explicit confirmation before final release. Do not roll this extension into another authorized release.

## Goal and scope

Add interactive roots of one function and intersections of two function graphs, initially linear and quadratic polynomials. Select graphs on the canvas or from the object list. A construction creates two permanent branch definitions, even when a branch currently has no solution. They use the same point interface as other dependent points and can be parents of distances, midpoints, segments and other existing constructions.

Scope includes formulas, validation, UI, numerical and domain handling, shared state, journal replay and browser acceptance. Existing geometric line/circle intersections are unchanged. Vertical geometric lines, general rational/trigonometric/piecewise root finding, CAS, new transports, new geometry engines, deployment and changes to other PRs are excluded.

## Mathematical contract

- Supported expressions: polynomial ASTs of degree at most 2 assembled from numbers, x, a/b/c, unary signs, +, −, multiplication, division by a nonzero constant and powers 1/2. A power 0 is accepted only for a provably nonzero constant; x^0 remains unsupported because the drawing evaluator excludes 0^0.
- Decimal literals retain their source digits; slider values use their displayed decimal representation. Bounded exact rational coefficient arithmetic determines zero coefficients and the discriminant sign. `pi`/`e` use the existing parser's numeric values. This is bounded polynomial analysis inside `expression.js`, not a separate parser or CAS.
- Compute intersections by subtracting coefficients. Distinguish none, one crossing, tangency, two roots and infinitely many solutions. A zero quadratic coefficient falls back to a linear equation without an arbitrary epsilon.
- Normalize coefficients and use the stable quadratic q formula. Convert only after exact sign decisions. Check candidate residuals/estimated coordinate errors and the actual existing evaluator; reject overflow, underflow, nearly inseparable roots and excessive arithmetic budgets rather than inventing points. This is not a general interval-arithmetic certificate.
- Reject variable denominators, piecewise expressions and unsupported functions. No sample-based detection or cancellation across holes in the domain is attempted. Undefined constants and intermediate evaluator overflow remain explicit.
- Coordinates outside ±1,000,000 are not rendered as construction points; the branch reports out-of-range separately from no solution. Tiny valid coordinates use scientific notation, never a rounded zero.
- Branch 0 is the smaller x; branch 1 is the larger x. At a single solution/tangency only branch 0 is defined. Branch IDs remain after no-solution and unsupported states, so dependencies recover. Quadratic-to-linear degeneration may change which analytic trajectory occupies branch 0; spatial ordering, not trajectory continuity, is the contract.

## Acceptance

- [x] Numerical suite: linear/quadratic and graph-pair cases, 441 independent factor-pair expectations, decimal tangencies, coefficient scale extremes, small roots, domain holes, uncertainty and out-of-range cases.
- [x] Model schema: exact fields, valid graph parents, order, branch, no injected coordinates; descendant deletion and derived recomputation.
- [x] DOM editor: tool selection, two branches, undo/redo, formula/status messages, local-storage startup restore, live observer updates and readonly controls. JSXGraph is stubbed in this suite; this is not visual browser acceptance.
- [x] Server: actual GroupLessonStore journal and restart; controller handoff, peer/observer rejection, version conflicts and rejection of forged coordinate fields.
- [ ] Full scripted browser: three actual contexts, visible controls and SVG labels, no/one/two roots, parameter/formula edits, midpoint, presentation, readonly history, page/server restart, 320/1280 layouts.
- [ ] Independent technical review of the final candidate.
- [ ] Dependency release, exact composed-candidate CI and explicit owner release confirmation.

## Checks and evidence

[Local validation and release hold](../reports/spacemath-graph-solutions-20261110.md). Run:

```sh
npm --prefix board-server test
node --test trainers/spacemath/expression.test.cjs trainers/spacemath/model.test.cjs trainers/spacemath/graph-solutions.test.cjs tools/spacemath/assets.test.cjs tools/unified-spacemath.test.cjs tools/unified-frame.test.cjs
node tools/group-board.browser.cjs
node tools/unified-board.browser.cjs
git diff --check
```

Use the pinned dependencies in the existing Unified interactive board workflow. Its browser runner now imports `tools/spacemath/graph-solutions.browser.cjs`; there is no separate mock transport for browser acceptance. Production has not been modified or claimed to pass this extension.

## Review, risk and rollback

Focused self-review covered mathematical branching, decimal semantics, numeric limits, strict schema and authority boundaries. Independent/provider review has not been performed in this task. It remains a pre-release acceptance item; the owner's permission to create a draft does not imply acceptance.

Additive model types require a compatible server/journal reader before enabling the new editor. Version-1 models remain readable by this runtime, but older readers do not accept the new types. Keep original journals and the upgraded reader available during rollback; disable the new UI first, without stripping saved objects or reverting the reader beneath existing records. Verify this order in the final composed release; no new migration, network service or account field is introduced.
