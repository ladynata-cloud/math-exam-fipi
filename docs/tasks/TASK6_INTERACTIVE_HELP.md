# Task 6: help inside each arithmetic step

## Identity and approved scope

- Owner: repository owner, current course-adaptation conversation.
- Date: 2026-10-21 (Asia/Novosibirsk).
- Release base: `df63bacb2f82acf5f8543297c372b414925d6113`.
- Original implementation base: `43dc06bfa7bf503e3e9d455ced3ec05202b9e68e`.
- Release branch: `feat/task6-interactive-release`.
- Preserved implementation branch: `feat/task6-interactive-help`, reviewed head
  `83e614726695d5f2b86beb2b16e299c0b5240d12`.
- Review: **MEDIUM**. Bounded interaction inside the existing offline trainer.
- Accepted architecture: ADR 0003; one self-contained trainer HTML.

The owner asks whether task 6 meets the new task-first teaching method and has
authorized rebuilding the whole existing course and publishing it in the cloud.
The current release has 174 exact arithmetic plans, but no help inside a step,
no interactive models, and loses an unfinished hint answer when help reopens.

## Outcome

Keep the expression and answer first. Each optional arithmetic step can open a
relevant experiment, then a simpler explanation and a small prerequisite
question on the same page. Every action states what to do and what to observe.
Keep main answers, intermediate drafts, accepted work and model settings when
help closes or the learner visits another task. Add visible previous-task and
course navigation.

## Scope and family inventory

- Preserve all 174 TASKS bytes, categories, order, exact input parser and grading
  provenance. Preserve session-only progress and self-contained offline delivery.
- Cover all eight actual plan kinds: lcm, gcd, add, sub, mul, div, pow, numerator.
- Give decimal shifts, mixed-number conversion and reciprocal steps their own
  contextual models instead of presenting a generic arithmetic model.
- Common multiples/divisors: try a candidate and compare exact divisibility.
- Addition/subtraction: move along a number line, including negative operands.
- Multiplication: vary the second factor and observe the scaled area and sign.
- Division: test a quotient by multiplication and compare lengths/remainder.
- Powers: vary the number of equal factors; explain the empty product for zero.
- Decimal shifts: move digits relative to the comma by powers of ten.
- Mixed numbers: regroup whole units into equal fractional parts.
- Reciprocal/numerator: manipulate or select the actual parts of the fraction.
- Help never fills or grades the main answer; the explicit ready-answer route
  retains its existing provenance.
- No task-bank additions, persistence migration, server/cabinet or deployment
  configuration changes; no other trainers changed by this branch.

## Files and checks

Canonical HTML; this task document; focused frozen-bank gate (scope baseline
only); new interactive DOM/math gate; existing cloud browser gate and workflow;
PROJECT_STATUS reconciliation for the now-merged task19 release and this task.
The status file was already in the scoped-path allowlist; no new runtime path
is permitted by this reconciliation.

Required: all existing arithmetic/history/minimal-hint tests; independent
family arithmetic checks; every plan has usable help; draft/model-state
roundtrips; invalid inputs; no automatic score; 320/360/1280 cloud browser,
keyboard, iframe and offline checks; diff/link/syntax checks.

Gate: `TASK6_INTERACTIVE_HELP_OK`, only after exact-head cloud checks.
Local shell browser execution is not used. Root coordinates release separately.

## Review, risk and rollback

The owner explicitly deferred Claude API use. No paid consultation or external
approval is claimed. Focused independent review is requested after implementation.
Main risks: wrong visual arithmetic, excessive help density, state loss and
incorrect score attribution. Exact rational model output, real control actions
and existing provenance tests cover these risks. Rollback restores only this
task's paths in a normal reviewed commit; no stored pupil data changes.

## Execution

Implemented all 11 contextual help families for all 1,054 steps in the existing
174-task bank. Local gates: 39 tests pass (17 frozen-bank/arithmetic/history,
11 existing minimal-help DOM, 11 interactive math/state tests). The original
TASKS declaration remains byte-for-byte identical. Inline-script syntax,
browser-test syntax and `git diff --check` pass.

Independent focused review found keyboard focus lost after selecting a fraction
part; fixed by restoring focus to the selected part after the model redraw and
added a regression test. Review also corrected the direction wording for a
negative multiplier. SVG labels use larger type and short labels; the cloud
gate checks their rendered size (at least 16px) and viewport bounds.
Self-review fixed partial remainder widths, marked
clipped division bars, and made the zero-power experiment adjustable.

Cloud browser coverage is prepared for all 11 families at 320, 360 and 1280px,
plus iframe and offline HTML. It has not yet run; no browser or publication pass
is claimed. Root coordinates exact-head CI, final review and publication.

The scoped-path gate now compares against this task's actual base. The older
bank baseline stays unchanged. This separates historical unrelated releases
from the current scoped diff without weakening bank or grading assertions.


## Release integration after task19

The only concurrent main commit is the authorized task19 PR286 release
`df63bacb2f82acf5f8543297c372b414925d6113`, whose sole parent is the original
implementation base. A read-only virtual merge with reviewed head `83e6147`
is clean: tree `8342555c30bb85a83cfbbedd5a5c59766c1086d1`. Its six-path delta
has the same stable patch ID `ffcd1c881a8c95f7c96790765141fab45bdfc21e` as the
reviewed implementation.

A new release worktree/branch was created from that composed tree with the new
main as parent. The original reviewed branch was preserved. Integration changes
only scope-base metadata, the corresponding CI fetch, this document and project
status. Runtime HTML blob remains `16e4db46041507a09ab85ab32e13595d7e8e50ad`.
No reset, rebase, force operation or unrelated change is used.
