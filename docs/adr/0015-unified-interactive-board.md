# Independent materials in the MathExam group board

Status: Accepted (integrated board scope; release remains gated by acceptance)
Date: 2026-11-09
Task: [UNIFIED_INTERACTIVE_BOARD_20261109](../tasks/UNIFIED_INTERACTIVE_BOARD_20261109.md)

## Decision

The owner explicitly requested the combined board, SpaceMath and trainer,
then reaffirmed implementation and required teacher/pupil synchronization,
including a wider school geometry and graphing toolset. This accepts the
integrated use below. It does not accept or merge the separate cabinet/library
product in PR #481. Standing publication authorization applies after the
technical acceptance of this integrated candidate, subject to the owner's
latest explicit pause: review with different models before any merge/deployment.

Reuse the accepted ADR 0009 group seats, bearer access, fsynced journal,
idempotency, presentation projection and explicit control. Add SpaceMath from
PR #481 as an independent material, using its existing same-origin bridge and
canonical declarative model (160 objects / 64 KiB). Do not implement another
geometry engine or treat arbitrary embedded pages as synchronized trainers.

Each workspace has handwriting, a geometry model and one active trainer.
Geometry has separate control/version/identity; handwriting has its own identity.
Trainer insertion rotates only the trainer generation while preserving both
other identities and contents. Legacy `assign` still resets the complete
workspace and all three identities; historical logs retain their meaning.

`geometry`, `geometry-control` and `insert` are additive journal records.
`present` may select board, geometry, trainer or split. A readonly projection
contains only the chosen workspace, and its consumers cannot write or read peer
history. Switching a local view does not mutate another learner's view; explicit
teacher presentation chooses the shared surface. Before navigation/handoff,
client snapshots flush debounced edits; delayed and conflicting operations remain
version-fenced. Canonical models contain no executable JavaScript or HTML.
Function formulas are bounded mathematical strings parsed by a local allowlist
parser; parameters, dependencies and the logical viewport belong to the same
validated model. Only the controller publishes viewport and parameter changes.

## Compatibility and operational constraints

Server capabilities gate the new UI, including restored links. Roll out server
before UI. Old journals reconstruct with empty geometry; no account/schema
migration or new transport is introduced. New events cannot be read by older
backend versions, so a rollback must keep the upgraded event reader and original
journals. Group storage remains single process and bounded; no distributed
persistence or simultaneous geometry writers are promised.

## Evidence and remaining acceptance

The accompanying task and PR record actual tests and independent review.
This decision does not claim owner acceptance of the complete SpaceMath product
or revoke the separate PR #481 release hold. Broader trainer coverage, richer
ordinary-board tools and real-learner acceptance are later stages.
