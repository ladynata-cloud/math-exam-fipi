# Long division: small actions to independent work

## Identity and authorization

- Owner first requested rounding/estimation for selecting one digit, then expanded
  the same task to rebuild the entire long-division sequence for a learner who
  needs smaller steps and simpler wording (2026-10-19, Asia/Novosibirsk).
- Base: main at `7b80a1be82888fe46ebd6f3ded78453bb52a44cb` (released PR 257).
- Branch: `feat/quotient-digit-estimation`; one expanded task and one PR.
- MEDIUM: bounded curriculum/navigation/presentation, reusing existing numeric
  steps, DivisionLab arithmetic, canonical envelopes, hint and observer protocol.
  No server schema, authorization, persistence format or deployment change.
- Direct implementation request authorizes work, tests, commits, push and Draft
  PR. Merge/deployment needs a separate owner decision for the reviewed head.

## Scope

Build an ordered 17-stage course, visible as a full-width vertical route inside
cabinets and publicly. Cover multiplication needed for division, one-digit
selection, multiplying by a two-digit number, subtraction, the first left-hand
number, bringing one digit down, full simple division, a three-example check,
estimation, full two-digit division, internal zeros, remainder, decimal numbers,
appending zeros, removing the second number's comma, guided mixed practice and
a three-example independent check.

Each stage has a short worked example on request, a single current action and
retained calculations. Early work provides concrete prompts; later guided work
shortens the instruction. Checks require whole answers on three distinct tasks;
the learner does the corner on the existing mirror board or paper. Checking an
answer alone is not evidence that every written line was correct. A completed
check is not labelled mastery; repeat with new numbers on another lesson.

New content IDs preserve every pre-existing canonical task and saved attempt.
Course steps can be assigned/opened through the existing cabinet and teacher
board. Existing personal plans, accounts and credentials are not rewritten.
Guided course checks return the already-supported assisted flag. Independent
checks retain optional help, recorded by the existing hint mechanism.

Keep the separate estimation trainer: round, estimate, multiply the original
number, adjust one digit, check the next-digit boundary. Approximate 9 for 266:33
is accepted as intermediate; final answer must be the digit 8. Include multiple
corrections, a rounded estimate of 10, exact matches and internal zero.

## Acceptance and gates

- Clear ordered course with resume/next links; one current action; visible
  current number/row; large readable controls; no timers or forced progression.
- Plain wording without prerequisite technical vocabulary; one digit means one
  digit; exact equality accepted; zeros and both decimal shifts correct.
- Arithmetic oracle across seeds, distinct checkpoint tasks, no initial answer
  leaks, single-digit grammar and no premature completion.
- Every saved prefix/draft resumes, hints do not advance, observers cannot edit.
- All old canonical specifications identical to base across representative seeds.
- Public fallback uses the same contracts and renderer; local-save failures are
  visible and malformed old storage is preserved.
- Focused core, DOM, catalog, preparation, old scaffold, envelope and server gates;
  relevant existing cloud browser/container workflow before release.
- Independent focused code/pedagogical review; report checks not run honestly.
  A pupil trial is not replaced by automated tests.

## Risk and rollback

Risks are curriculum overload, answer leakage, confusing guided success with
independent work, stale assets, or navigation hiding prior work. Test these
explicitly. No data migration. Before release, rollback is closing the draft.
After release, remove the new route entry and catalog exposure while retaining
new task implementations for already-saved attempts; restore prior presentation
where appropriate. Do not delete accounts, attempts or stored work.

## Execution

Implementation complete; not deployed.

Focused checks passed: 12 arithmetic/curriculum tests (1,428 course variants and
13,040 estimation plans), course DOM (17 stages, 227 actions, 51 draft restores),
three public-page journeys, two real HTML/bridge hydrations, seven route tests,
54-topic catalog, preparation, old plain-division DOM and 15 scaffold tests.
Disposable SQLite verifies independent → fresh repeated checks, repeated identical
conditions as practiced, and helped/guided work as hinted. A fingerprint snapshot
preserves 180 old tasks; independent review compared another 216 old envelopes.

Internal independent code/pedagogical review found no remaining blocker after
closing question-identity, loader, source-digit highlighting, difficulty-order
and static-metadata hosting issues. Its separate BigInt oracle checked 17,000
full division cases. This is internal review, not external review provenance.
A metadata-only cabinet map is parity-tested against course metadata; the server
continues to expose only its existing static routes.

Full server regression passed: 288/288, including actual runtime asset delivery.
The old non-geometry catalog count was updated by the 18 intentionally added
trainers. Browser/container CI and any
pupil trial are separate checks; no live pupil work was changed.
