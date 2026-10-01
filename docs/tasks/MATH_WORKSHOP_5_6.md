# MathExam workshop and grades 5–6

- Owner scope: implement the proposed shared learning routes and interactive grades 5–6 courses; prepare for inspection. EGE remains the homepage priority and its separately scheduled release stays untouched.
- Date: 2026-10-02
- Base: main / 010e89c75c0fe110b57c983c728b8216fb38cd9d
- Branch: course/math-workshop-5-6
- Review: NEW_ARCHETYPE (isolated prototype; no deployment in this task).
- Proposed ADR: docs/adr/0005-math-workshop.md

## Scope
Shared skill catalogue, grade routes, source-labelled textbook mapping, guided lessons, models, practice, independent checks, delayed review, prerequisite return, local progress and backups, local teacher assignment/report workspace. Reuse existing course links without modifying those runtimes or storage.

## Boundaries
No homepage, EGE branch, server, authentication, domain or live deployment changes. No wholesale textbook copying. No claim of complete alignment where editions are unavailable. Teacher reports are learner-provided files; no authenticated gradebook or automatic collection is claimed.

## Gates
Independent arithmetic/reference assertions, all exercise generators, prerequisite graph, input validation, exposure/assistance/delayed-state invariants, import validation; real browser flows at 360/768/1280 px, keyboard, exact prerequisite return, assignment and report round-trip, reload, corrupted storage, offline archive.

## Permission
The owner explicitly requested implementation in the current chat. Commit/push/Draft PR permitted by repository workflow. Publication of this extension is not authorized; the earlier EGE-only waiver is not applied to this extension.
