# Correct misleading private rehearsal feedback

## Scope

When a teacher rehearses a managed EGE-path exercise, the trainer must not promise that the private work is saved to a durable history. Use truthful neutral feedback in both rehearsal and ordinary managed work; the outer cabinet continues to report actual save status. No changes to storage, task mathematics, authorization, lesson state or scoring.

Base: d435af8a6be1823210901d4e4dc13a44f65591a0. Review: SMALL. Owner requested fixing issues discovered after release of PR #478. Standing release authorization applies after applicable checks and production verification. Current Amvera transport failures block safe release confirmation.

## Checks

Run JavaScript syntax, existing managed-trainer and rehearsal browser gates on the exact candidate. Confirm private rehearsal and pupil managed work remain usable and that the UI does not claim durable history for a private copy. Account and pupil data must not be changed. Check browser caching and published resources before release.

## Rollback

Revert the scoped wording change; no data migration is involved.
