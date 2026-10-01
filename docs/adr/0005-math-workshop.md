# ADR 0005: shared mathematics skills and learning routes

Status: Proposed

## Design
One versioned skill definition contains prerequisites, an author-written explanation, parameterized guided tasks and an interactive model. Grade and textbook routes refer to the same skill IDs. A textbook route records its exact source edition and known coverage gaps. Geometry theorem prerequisites remain explicit rather than being inferred from grade.

Lesson completion, unaided check success and later retrieval are distinct evidence. Practice and opened hints cannot silently raise independent achievement. New local keys do not write to legacy course storage. JSON backups and learner reports validate schema, identifiers, bounds and event fields before atomic replacement/import. This is an offline prototype, not an authenticated assessment system.

The teacher workspace stores only local group aliases, assignments and imported reports. Assignment codes contain lesson IDs and an assignment token, never learner names. Existing EGE/OGE/geometry tools remain separate links; their progress is not merged without a future adapter decision.

## Before production
Owner inspection, review under repository policy, accessible-device pilot, complete coverage audit and a separate release decision. Cloud group journal and textbook editions not available in this task remain explicit future work.
