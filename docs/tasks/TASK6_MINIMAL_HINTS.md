# Task 6: minimal screen and optional guided calculations

## Identity and authorization
- Owner: repository owner, current conversation, 2026-10-20.
- Base: main, `4b56350c35a67e41add8f2b25cf2bf7d73d1f71f`.
- Branch: `feat/task6-minimal-hints`.
- Review: MEDIUM, bounded existing static trainer behavior; no server or persistence change.
- Owner requests the established task11/task19 layout for task6 and authorizes cloud publication.

## Goal and scope
Start with the expression and answer, offer “Хочешь подсказку?” as optional
stepwise help, and move topics, source identifiers, session statistics and
extra practice into a closed disclosure. Keep numerator-only conditions visible.

Seven paths: canonical task6 HTML, this specification, PROJECT_STATUS,
existing focused gate, new minimal DOM/browser gates and their CI workflow.
The 174 TASKS bytes, category counts/order, exact BigInt parser, answer-history
state machine, offline single-file delivery and existing links remain intact.

The hint planner parses the displayed expression independently of stored
answers. Every intermediate expected value is exact rational arithmetic.
Accepted work remains visible. Help never writes to the main answer or scores
it; the explicit complete-answer disclosure preserves reveal provenance.

## Acceptance and checks
- One expression, optional help and answer controls on the first screen.
- All 174 plans agree with independently evaluated expressions; step audit is checked.
- Common denominators, mixed numbers, decimals, division and powers use specific steps.
- Fractions display with horizontal bars, including revealed and intermediate answers.
- Strict input grammar, retries, skip/reveal provenance and single-credit history remain.
- Node focused and DOM suites; Chromium320/360/1280, keyboard, iframe and offline HTML.
- Frozen bank regression, syntax, relative links, exact changed-path check, git diff --check.
- Independent focused review by the tests and hint-engine agents.
- Gate: TASK6_MINIMAL_HINTS_OK after exact-head cloud checks and production verification.

## Regression maintenance
The old offline gate rejected every absolute link, including the canonical SEO
metadata already present on the current base. It now rejects external resource
dependencies while allowing non-loading canonical metadata. The historical
six-file scope assertion is updated to this seven-file approved task scope on
the current base; bank/parser/history assertions remain enabled.

## Risk and rollback
Primary risks are incorrect intermediate arithmetic and narrow-screen rendering.
Independent exact evaluation covers every bank item and every audited hint step;
cloud browser tests cover layout and interactions. Rollback restores the seven
changed paths from the named base in a normal reviewed commit. Session-only
progress remains session-only and no pupil or cabinet storage is touched.

## Execution
Local and exact-head cloud evidence is recorded in the PR. Publication uses a
fresh remote-main guard, exact reviewed tree identity and post-deploy byte checks.
No unrelated files, authentication, deployment configuration or source bank changes.
