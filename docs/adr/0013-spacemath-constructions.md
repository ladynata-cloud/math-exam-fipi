# SpaceMath: declarative construction documents

Status: Proposed

Date: 2026-11-07 (Asia/Novosibirsk)

Task: [SPACEMATH_2D_V1_20261107](../tasks/SPACEMATH_2D_V1_20261107.md)

## Decision proposed for review

Use locally vendored JSXGraph for an integrated 2D editor. Store a bounded,
versioned JSON document containing its title, free points, dependent object
types, parent IDs and optional axes/grid. The document contains no JavaScript,
HTML, URLs or arbitrary mathematical expressions. Parent IDs reference earlier
objects; free-point coordinates are the only independent geometry inputs.

A shared pure model validates the document on both client and server and
evaluates finite geometry. Undefined intersections/zero-length inputs are
represented as undefined, not fabricated coordinates. Moving the original
points can make the same construction defined again. Deletion explicitly
removes dependent objects; undo can restore the complete previous document.

Use the accepted ADR 0010 account boundary: isolated public trainer iframe,
credential-free `MathExamLearning` bridge, authenticated SQLite attempts and
events, optimistic versions, explicit controller and account-bound ownership.
`spacemath:construction` is a document/tool, not a graded exercise. All saves
use existing state actions; checks cannot grant completion or rewards. Private
teacher models use the existing teacher-owned common-work identity. A scoped
model listing separates them from pupil models.

A SpaceMath source copied to a lesson uses its current validated construction.
Ordinary exercise sources retain their existing initial-condition behavior.
Once in a lesson the same attempt ID persists through material switches.

The anonymous mirror board reuses its existing bridge adapter. Its volatile
room state is not advertised as durable cabinet storage. A standalone browser
draft is also distinct from an account save. Resources required to construct
geometry are served locally and do not depend on GeoGebra or a CDN.

## Alternatives and consequences

- Self-hosted GeoGebra provides a mature full editor but requires a different
  state adapter and evaluation of complete-product licensing. It is outside
  this scoped JSXGraph implementation.
- A separate geometry account/token/storage stack would duplicate accepted
  identity and conflict semantics. Reusing the cabinet reduces that boundary.
- A drawing image cannot preserve geometric dependencies. Editable JSON and
  optional image export serve different purposes.
- Keeping models in the existing store requires explicitly excluding them from
  academic progress/reward aggregation. They retain versioned work history.
- Simultaneous writes to one object are not introduced. Existing explicit
  teacher/pupil control resolves the first-version conflict model.

## Acceptance

The owner's START authorizes this scoped implementation and Draft PR. This ADR
remains Proposed until the owner accepts the new archetype before rollout.
Prototype, independent review and exact validation evidence belong to the task
report; they are not substitutes for an owner rollout decision.
