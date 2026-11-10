# Complete profile course: all 20 exam positions

## Identity and authorization
- Task: PROFILE_COMPLETE_COURSE_20261110; owner: MathExam site owner.
- Date: 10 November 2026 (Asia/Novosibirsk).
- Base: main `f4616a5df8d5b2af825dc902a7a3b8139842e482`.
- Branch: `feat/profile-complete-course-20261110`; review level: HIGH.
- START: the owner explicitly requested completing the profile course using prior courses, trainers, audits and recommendations. This is approval to implement this scope.
- Branch, commits, push and PR authorized; checked release under [standing policy](../OWNER_RELEASE_AUTHORIZATION.md). No additional publication confirmation required.

## Evidence and goal
The public entrance names only first-part positions and inequalities, shows only three visible numbered cards and hides other links. The current source contains 81 lessons/486 tasks, covering all first-part positions, four trigonometric foundations and six prerequisite bridges. The second-part map is complete numerically but its destinations are partial collections; position17 explicitly lacks a teaching route. Published #498/#511/#515 are prior navigation and teaching improvements, not completion of the missing curriculum.

Official FIPI archive: https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip . Specification pages16–19 and demonstration pages14–16 retain PROJECT status:20 tasks; first part1–13; second part14 equations,15 stereometry,16 inequalities,17 modeling,18 planimetry,19 parameters,20 number properties. Do not confuse historic2026 names or silently rename their saved keys.

## Scope
- Open numbered entrance for all20 positions; old2026 materials retained separately.
- Add a cohesive second-part extension in `ege-profil/part-two/`:42 method lessons, six authored conditions per method (learning and independent pools), task-specific steps, full explanations, appropriate exact diagrams, links to existing foundations/trainers/textbooks.
- Reuse the established try/hint/step/independent pattern, arithmetic parser and browser-local progress conventions. Separate numerical success, assistance, repeated conditions and written proof requiring review. Preserve first attempts and drafts; explicit next actions.
- Optional seven investigations use prediction, one controlled change, explanation and a transfer question. They give no exam credit.
- Link the existing map to the new course and preserve original resources. Keep existing first-part IDs, bank, saved keys and board contracts.
- Relevant mathematical, storage, interaction, link, accessibility and navigation tests; CI browser scenarios and review evidence.

No backend, classroom synchronization protocol, existing bank migration, unrelated textbook changes, external course content copying or claim of exhausting every possible exam problem. No claim that self-assessed proof is automatically validated. No claim all external videos were inspected or learning effects measured on pupils.

## Design and source use
[Prior source comparison](../reports/PROFILE_MODEL_AUDIT_20261109.md) and the existing calm/readiness/course implementations guide this work. Brilliant: first attempt and fresh independent follow-up. Образавр: local feedback and retained work. Методайзер: short personal attempt, targeted support, new personal check. GeoGebra/VK: precise linked geometric/graphical quantities, predict/change/explain, domain exclusions and exact boundaries. These are recorded audit principles, not a fresh comprehensive audit of those providers.

## Acceptance
- Every position1–20 has a direct visible entrance and real content destination.
- Every new method has six valid conditions, nonempty theory, steps, final fields, solution and appropriate prerequisites; all proof-heavy tasks include criteria.
- Independent attempts use different conditions from examples, preserve first answers and never earn independent credit after help.
- Empty/invalid answers and repeated submits do not create credit. Proof remains pending review.
- Drafts, help and evidence survive reload and separate task tabs; malformed storage is preserved with warning.
- All diagrams match task quantities, geometry and required constructions; mobile condition is readable.
- New code remains public-only and old board mirrors remain unchanged.
- Technical/mathematical independent review, relevant local and CI checks; binding provenance maintained.

## Validation and rollback
New math family checks, new engine and model tests, real browser journeys320/390/1280, existing profile journey/map/first-attempt/help regressions, navigator negative/preservation tests and `git diff --check`. Browser execution through supported preview or CI; unavailable attempts reported separately. External-provider audit is not required/not performed. Rollback by scoped revert; new progress keys remain untouched and old learner data needs no migration.

## Execution
Implementation and validation in progress. Exact final counts, head, checks, review and delivery evidence will be recorded in the PR and course report. This task document does not assert tests, deployment or learning effectiveness passed.
