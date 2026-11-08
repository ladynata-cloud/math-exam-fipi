# College logarithms in pupil programs

## Identity and goal

- Date: 2026-11-06
- Base: main, `6c64ac63e6bad70993ec50995d3a39976b1b0a36`
- Branch: `feat/college-logarithms-program`
- Review level: MEDIUM — existing catalog configuration and navigation; no new architecture.
- Goal: assign the published college logarithms course through the normal pupil setup wizard, with individual practice and shared-board entry from the program card.

## Context and approved scope

The published trainer has 60 tasks and an introductory lesson. Its existing board adapter and registry entry already support the tasks. The shared client/server course catalog omitted the course, preventing the wizard from assigning it.

Add one catalog entry and a cache version. Exercise a no-school-grade account, persistent assignment, pupil course link, teacher/pupil board links and mobile layouts. Keep existing accounts, work, credentials, authentication, storage schema, board protocol and mathematical content unchanged. No private pupil information belongs in the repository.

## Acceptance and gates

- Course selectable for a pupil outside school; server accepts the same course ID.
- Independent practice opens the existing course; board opens its first meaning task.
- A fresh pupil login/reload restores the assigned course.
- Teacher preview and pupil cards fit 320, 390 and 1280 px.
- Run the focused onboarding API suite, syntax/diff checks and native onboarding browser CI. Existing college trainer and registry tests verify referenced destinations.
- After merge, verify both public and cabinet assets, then create the requested real pupil through the existing UI and inspect the course/board destinations. Record private access details only in the owner's session.

## Review, risk and permissions

No new learning sequence is introduced; mathematical content remains the verified published course. Design consultation and external review are not performed or required under the standing owner policy. Remaining real-learner usability is not represented as a completed pilot.

Risk: public site and cabinet runtime may deploy at different times. Do not create the real account until the cabinet offers the course. Browser-local course progress is still described as browser-local. Rollback: revert the catalog addition/cache change while preserving all pupil records and existing course routes.

The owner's direct request authorizes implementation, branch/commits, PR, merge and deployment after applicable checks under `docs/OWNER_RELEASE_AUTHORIZATION.md`. A literal START is superseded by this explicit action request. No force operations or weakened gates.

## Execution record

Local and CI evidence, exact head/base and release verification are recorded in the PR. Native browser execution is unavailable in the local sandbox; use the existing GitHub Actions onboarding gate. Final marker: `COLLEGE_LOGARITHMS_PROGRAM_OK`, only after the applicable checks and production verification succeed.
