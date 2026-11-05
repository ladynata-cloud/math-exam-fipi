# Учёт самостоятельной работы ОГЭ №11, №15–19

- Date: 2026-11-06 (Asia/Novosibirsk)
- Base: main / a7078f136ec0a5725cabc872dcc03132f3df070d
- Branch: feat/oge-independent-homework-20261106
- Review: HIGH (persistence, authenticated result transfer)
- Owner: explicit current Action request; implementation and publication authorized.
- Release: ../OWNER_RELEASE_AUTHORIZATION.md; no new permission pending.
- Architecture: accepted ADR 0010. Reuse learning attempts, assignments, events, sessions, CSRF, frame protocol and family projections.

## Verified baseline
Public practice links and anonymous board snapshots do not create managed attempts.
Public trainers save browser-local aggregates; board mode intentionally excludes personal storage.
The cabinet already pins tasks and checks answers on the server, maintains idempotent versioned events, records assistance/actor roles and exposes a bounded parent projection.
PR456 is merged. PR458 owns public-practice return navigation and is not modified by this task.

## Scope and acceptance
Connect exactly six native public trainers to the existing managed protocol. Keep public standalone and anonymous board work separate and untracked. Preserve prior accounts/history; no destructive migration.
Teacher assigns online homework and sees checked answers/errors/help in the pupil report. Student resumes the same condition and work after reload/login. Parents see only the existing allowlisted progress projection.
Server validates pinned conditions and answers; no browser success claims. Public frames receive no account IDs, names, cookies or credentials. Source/origin/channel/instance and existing same-origin auth/CSRF fence result writes.

## Gates
Native mathematics, six-trainer integration and real browser with synthetic student/teacher/parent accounts; wrong/correct checks, help, joint-work distinction, reload/login, offline/retry, isolation and unchanged existing work. Existing learning and board regressions; required CI. Final marker OGE_INDEPENDENT_HOMEWORK_OK.
HIGH independent technical review required; external provider review not requested.

## Rollback
Scoped code revert through established release. Keep SQLite and all additive records; no restore over production data. Previous managed trainer IDs must remain readable or deployment held. Board server restart can invalidate anonymous in-memory rooms. Production pupil data is not used for tests.
