# ADR 0015: constrained source-based experiments for OGE task 19

Status: Proposed. The owner separately approved the bounded 135-card implementation
with START on 16 November 2026. Acceptance of the ready archetype and production
rollout remain separate decisions; no accepted-provider verdict is implied.

## Context

The reviewed 244-card bank does not directly present 135 propositions found in the
finite audited source set. Several require constructions not supported by current
models: symmetry, independent line incidence, circle power and tangential/cyclic
quadrilaterals. Fixed numeric premises must survive every learner interaction.

## Proposed decision within the approved implementation scope

1. Retain the existing pure geometry model contract: defaults, normalize,
   controls, sample, render and optional update/restore. The host continues to own
   controls, measurement visibility and state. No new platform API or storage is
   introduced.
2. Add bounded modes/models in existing modules. Preserve old modes and their
   exact outputs; every new mode has explicit independent parameters and derives
   dependent geometry before rendering. A diagram must not assume a conclusion
   that the assertion asks the learner to establish.
3. Draw complete reflected/rotated figures for symmetry and compare corresponding
   points. Explain why a single failed arbitrary transformation cannot disprove
   all possible centers. Finite presets alone do not prove a universal theorem.
4. Numeric source premises are immutable card configuration. Learner controls may
   change only quantities consistent with those premises (including orientation
   where the geometry is otherwise rigid). Restored data cannot change mode flags.
5. Preserve source locations without importing scans or a commercial question bank.
   Keep direct equivalence separate from derived properties and exclude the two
   unresolved source-key conflicts. Do not claim full live-FIPI coverage.
6. Keep all 244 previous cards and existing progress semantics. Append exactly the
   approved 135 new canonical IDs and the corresponding learning-map entries.

## Evidence required before rollout

- Independent mathematical and technical review of the exact resulting diff.
- Coordinate-derived invariant/counterexample checks, old-model preservation,
  boundary/restore checks and complete targeted browser journeys.
- Readable mobile/desktop examples, requested-only measurements, and offline
  parity. Record actual prototype results, not planned evidence, in the task/PR.
- Owner acceptance of the resulting archetype and separate release permission
  under the narrower conversation AGENTS.md. A ready Draft is not publication.

## Alternatives and consequences

Text-only additions would omit the requested meaningful exploration. Relaxing
numeric premises or reusing a model that assumes the conclusion gives misleading
evidence. A new global engine or separate trainer would expand the task and risk
existing progress, so the prototype stays within the current model interfaces.

Rollback is limited to this task's additive data and model delta; no persistence
migration or external service change is required.

## Prototype evidence

The implementation appends the approved 135 cards, giving 379 total. It adds 23
pure geometry models to the existing 42 and preserves the original 244 card
objects, aliases and order. The independent baseline gate fixes 2,151 original
sample/render/control results to their previously captured SHA256.

The finite provenance file records 681 observations: 679 direct mappings and two
excluded source-key conflicts. Source statistics retain their original 244-card
audit baseline. No live-FIPI completeness claim is introduced. Textbook coverage
now has 379 mappings and 58 topics, retaining all 244 previous mappings and all
54 previous topics; eight new passages were checked in the same pinned editions.

Independent internal reviews are divided by author: the circle author reviewed
38 triangle cards; the triangle author reviewed 39 line/symmetry cards; the
line/symmetry author reviewed 28 quadrilateral cards. The primary implementer
independently checked the 30 circle statements, conditions and proofs. These are
internal technical reviews, not external provider approval or a learner study.

The review closed concrete defects before handoff: unreachable angle-control
bounds, insufficient search range for a circle center, a new card's unnecessary
derived scale parameter, and ambiguous equality markings on quadrilaterals.
Fixed source numbers, full symmetry transforms, true initial counterexamples,
restoration and coupled control boundaries have explicit regression checks.

Static SVG inspection covers representative new circle and triangle scenes and
all 28 initial quadrilateral scenes, including nearly collinear point cases.
The final GitHub Actions browser evidence and source-binding/offline results are
recorded in the task specification and PR. Static rendering does not substitute
for browser execution, owner acceptance or release authorization.
