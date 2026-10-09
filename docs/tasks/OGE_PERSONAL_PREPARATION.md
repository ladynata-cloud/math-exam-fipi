# Personal OGE preparation and a separate foundations course

## Scope and authorization

Owner requests on 2026-10-09: teacher/student cabinets, four individual OGE
learners with pass/grade-5 goals, homework links and progress; a coherent separate
foundations course assembled from existing trainers; laboratory and task modes
with earned points. Real learner identities and credentials are private and are
never committed in source, tests or handoffs.

Base main: `b5d26ce9695deab2eea5f7eac2e13277da092450`.
Branch: `learning/oge-personal-homework`. Review level: **HIGH**.
Standing publication authorization and external-review waiver apply.
Independent internal review and full relevant gates required. This task does
not authorize resetting existing accounts or weakening access checks.

## Product behavior

- Reuse the existing account, assignment, attempts, history and paper workflow.
- Teacher chooses each pupil's course, neutral goal and personal focus. Existing
  accounts without a profile retain their current school course.
- Authenticated homework links return to the exact assignment after login;
  links do not confer access to another pupil's work.
- Preserve the owner's two-format homework: online work plus paper conditions,
  solution photo and teacher review. Do not silently remove publication checks.
- Foundations is an independent, ordered course with primary practice and a
  laboratory of related existing trainers. Audit gaps and duplicates from code.
- In cabinets, task mode prioritizes assigned work and recommendations;
  laboratory mode allows free exploration without blocking earlier/later topics.
- Points and achievements derive only from trusted completed server attempts;
  clicks, video views and public links cannot mint results. Repeat/seen-task
  handling prevents duplicate credit. No public comparison or negative points.
- Clearly distinguish automatically recorded work from public practice whose
  progress remains outside the account. Do not rename EGE positions as OGE or
  show a 21-question EGE practice exam as an OGE exam.

## Data and integration

Add an optional learner profile via the existing teacher ownership and session
middleware, with idempotency/version conflict protection. Additive schema only;
no credential-policy changes, learner-data migration or destruction. The Amvera
cabinet must actually be rebuilt for server/frontend cabinet changes; Pages
publication alone is insufficient. Production pupil setup uses the signed-in
teacher interface and existing access issuance, subject to browser handoff rules.

## Verification

Synthetic learners only in automated checks: different goals, personal homework,
login deep links, cross-device state, no cross-pupil disclosure, unchanged school
course, old two-format/photo/review workflow, exact-once earned rewards, archive
and repeat handling, desktop/mobile UI. Existing relevant security/cabinet/course
gates remain. Review the new catalog against actual files, not aspirational docs.

## Rollback and release

Rollback this bounded PR without deleting the new optional profile data or old
attempt history. Recheck authoritative main immediately before merge. Verify
reviewed tree, exact-head CI, Pages files and Amvera release independently. If
authentication blocks real-pupil setup, finish publishable work first, then ask
for the minimum required handoff. Never claim new accounts or server deployment
without evidence.

## Execution

Implemented with additive profile storage, per-content progress over the full
current history, private homework links, 12 foundations groups, task/laboratory
modes and server-derived experience. Public cabinet links use the actual Amvera
origin. Managed reused exercises have neutral practice headings; original exam
identities remain unchanged.

Local validation includes the full backend suite, original auth/course/teaching/
free-route browser gates, new isolated-pupil real-server scenarios, 95 managed
creation/normalization contracts, school deep-link validation and public layout
at 320/390/1280px. Independent HIGH review identified and resolved public-origin,
full-checkpoint reward identity, out-of-map teacher recommendations, and bounded
history issues. Exact-head CI and live deployments remain release gates.

The requested borderless decimal-comma styling is a separate small follow-up
release so this cabinet task remains reviewable.
