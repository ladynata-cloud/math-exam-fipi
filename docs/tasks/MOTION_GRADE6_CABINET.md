# Grade 6 movement course in the learning cabinet

## Identity

- Task: integrate the previously authored 12-lesson movement course.
- Owner: repository owner; explicit implementation request in the current conversation.
- Date: 2026-10-14 (owner local date).
- Base: `main`, `6d3eb6391ece697d5b5217817dbdbc2653090da4`.
- Branch: `feat/motion-grade6-cabinet`.
- Review level: **HIGH** because saved-state contracts and server progress change.
- Architecture: existing `mathexam-learning` v1 bridge and attempt storage. No new protocol, database schema, or authentication model. Proposed ADR 0001 is advisory.

## Goal and evidence

Make all 12 original lessons and 144 exercises assignable in a student's cabinet, with animations, worked explanations, guided practice, independent answers, and continuation of saved work. The current request explicitly selects the previously created course, rather than the older movement practice families.

Code establishes the existing catalog, server-pinned tasks, iframe hydration, ownership checks, and durable attempt events. Live hosting is being restored independently; successful local checks do not establish production readiness.

## Scope

Included: reusable original course content, one saved attempt per 12-task lesson, 12 catalog entries, existing bridge adapter, exact current cabinet origin support, progress/reward recognition, course filters, deployment packaging and regression checks.

Excluded: account/password changes, restoration work, database migrations, changes to other task generators, automatic assignment to real students during development, merge, and deployment. No student identifiers or credentials belong in this change.

## Acceptance criteria

- Preserve the original 144 mathematical conditions, answers, steps and models.
- Check independent and guided answers against server-pinned content.
- Restore current task, draft, correct prefixes, final answers and model position.
- Complete a lesson only after all 12 tasks have valid answers.
- Treat explanation/model/guided use as assistance; label repeats as familiar.
- Preserve ownership, read-only history, and existing trainer compatibility.
- Offer all lessons in the school catalog and teacher plan selector.

## Checks and review

Required local: full backend suite, motion UI adapter coverage of all 144 answers in both modes, existing mathematical/curriculum checks, syntax checks and `git diff --check`. Existing CI retains browser and production container gates and now includes the motion adapter tests and paths.

Independent code review is required. External review remains pending and may only be waived by an explicit owner decision with rationale. A valid external record must identify provider, PR, base, head, verdict and verifiable source/time. No external approval is claimed in this document.

Browser and container checks not executed locally must be reported as not run, not passed. Verify the new lesson in the real cabinet after authorized deployment before changing the pupil's plan.

## Risks and rollback

- The frontend and backend must both include the new family before assignment. A frontend-only release cannot save its attempts.
- The finite authored bank repeats the same 12 tasks; seed changes never constitute a new independent variant or duplicate points.
- No migration runs. Rollback is the previous application version plus removal of the newly assigned plan entries; retain the existing database. New-family attempts stay stored but need this version to reopen. Never delete them to roll back.
- Existing accounts, other attempts, access controls and API schemas remain in place.

## Permissions and handoff

The owner's direct request authorizes scoped implementation, a branch, checks, commits, push and a Draft PR. Merge, auto-merge and deployment require a separate explicit decision for the current base/head under `AGENTS.md`. This specification is a record, not an authorization token.

The PR body records actual head, review findings, test counts, missing gates and the next owner decision. Do not merge while HIGH review or required release gates are incomplete.

## Local review record

Independent internal UI/integration review found two issues (school-course filtering and reopening the final unfinished task after its summary); both were fixed and rechecked. Independent contract/storage review found no actionable defects. These reviews are not external-provider approval.

The reviewer compared all 12 lesson descriptions, all 144 complete task objects, and 720 geometry samples with the original standalone course. They match. Canonical lesson/task JSON SHA256: `ec54619e44349011e4a4c4656991849fa90296e7a70bda6e12c4713f3d3b83a9`.

The production-layout regression fixture now copies the new runtime dependency and checks 217 catalog items, including the 12 grade6 lessons. Initial failures from the old fixture were fixed, not skipped.

Final local gates: full backend 288/288; managed UI adapter 6/6; all curriculum commands in learning-quality passed; syntax and whitespace clean. Browser and Docker execution is delegated to CI and is not recorded as passed locally.
