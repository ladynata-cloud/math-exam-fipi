# Курс Атанасяна 7–9: полный учебный маршрут

## Identity
- Owner: project owner, current chat request on 2026-10-02.
- Base: main / 010e89c75c0fe110b57c983c728b8216fb38cd9d.
- Branch: course/atanasyan-7-9.
- Issue: #157.
- Review: NEW_ARCHETYPE for extended course orchestration; existing trainer mechanics reused where possible.

## Goal
Expand the existing grade-7 geometry course into a source-mapped grades 7–9 learning course, with interactive reasoning, principal problem types, guided proofs and learner-created auxiliary constructions. Coverage is evaluated against the available textbook, not a headline count.

## Evidence and method
The existing geometry-course contains 70 single-file trainers for chapters I–IV. The owner's course constitution and previous audits require an experiment followed by reasoning, phased proofs, mistake-specific feedback, correspondence vocabulary, input alternatives, a final law screen, and preserved progress. The current textbook is a supplied scan; titles and exercise references must be visually checked before claims of exact alignment.

## Scope
- Complete textbook topic map and clear topic/problem coverage status.
- Preserve and connect existing trainers, improve navigation and mobile access.
- Add missing grade-7 foundations and grades 8–9 learning units, principal solved problems, independent variants, delayed review and teacher reporting.
- Reusable exact geometry computations, interactive constructions, semantic validation, undo/reset and keyboard alternatives.
- Distinguish experiment from proof, guided completion from independent success, and formal source statements from supplementary bridges.
- Save runnable checkpoints, then a single Draft PR and offline archive.

## Boundaries
No EGE branch, homepage priority, host/domain, production deployment, textbook scans or wholesale exercise copying. No claim that all textbook exercises have solutions when only principal types are covered. No public learner data. The separate EGE release authorization does not apply.

## Gates
Textbook mapping and local-link audit; independent math assertions over generated parameters; proof dependencies and degeneracy guards; browser flow for all new units and legacy launches; construction pointer/keyboard paths; progress/import isolation; 360/768/1280 widths; offline archive and visual inspection. External review and a real-pupil pilot are not claimed unless actually performed.

## Permission and rollback
Current request authorizes implementation, commits, push and Draft PR. No merge/deployment in this task. Existing learner keys and legacy identifiers are preserved. Rollback only the scoped course patch; export progress before any future migration.
