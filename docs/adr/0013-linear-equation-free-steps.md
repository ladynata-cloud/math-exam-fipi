# ADR 0013 — bounded free steps for linear equations

Status: Accepted for the scope explicitly approved by the owner on 9 November 2026 (Asia/Novosibirsk).

## Decision and authority

The current overnight implementation request explicitly accepts typed equivalent
mathematical transformations, a personal solution record, separately registered
help, and explanations awaiting teacher assessment. This ADR records that bounded
product decision; it is not an external-provider verdict. Publication still
requires independent technical review and passing applicable gates.

## Mathematical boundary

Use exact rational affine expressions in one variable. Compare the unique
solution sets of successive equations. Reject unsupported nonlinear operations,
nonconstant denominators, zero division and transitions to identities or
contradictions. This checks the written equality, not the unobserved mental
operation. Equivalent repetitions are allowed but do not earn mastery or XP.
A syntactically ambiguous number must not become a different number through
whitespace normalization. Explain unsupported input without claiming it is a
mathematical error.

## Learning and persistence

Keep the established operation-choice mode and all PR #484 assistance/statistics
protections intact. The new mode records the pupil's lines and corrections;
explanations are explicitly unassessed text. Help is registered and calls for a
new independent example. A locally stored attempt is not a server-synchronized
student result or evidence of durable mastery.

Preserve concurrent records and unfinished work, provide return to prior tasks,
and test stale tabs and reloads. Storage failure must be visible. The standalone
HTML and ZIP must carry the same implementation as the published page.

## Exclusions and consequences

No new shared-board protocol, account schema, assignments, automatic semantic
assessment, student efficacy claim or site-wide course replacement. The trainer
is not registered as a mirrored room trainer. A local iframe smoke check does
not establish two-user synchronization. Rollback restores the runtime and both
downloads together without deleting existing local records.

## Verification

Exact math tests, persistence regressions, Chromium mobile/desktop/keyboard and
offline checks; independent review of the finished source; navigator/entry
preservation bindings updated only to the reviewed exact committed source.
