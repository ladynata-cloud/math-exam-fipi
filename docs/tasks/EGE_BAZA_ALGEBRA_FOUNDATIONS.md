# EGE_BAZA_ALGEBRA_FOUNDATIONS

## Identity and authorization

- Owner: MathExam course owner.
- Date: 2026-10-02 (owner timezone).
- Base: `course/ege-baza-interactive-labs`, Draft #152.
- Base SHA: `ee4af5359dfc72d995d99e595ab98f0857606ad6`.
- Branch: `course/ege-baza-algebra-foundations`.
- Review level: **NEW_ARCHETYPE**; isolated preview, not rollout.
- Related ADR: [0004](../adr/0004-ege-baza-construction-labs.md), **Proposed**.
- Current conversation authorization: implement graphical exponential/logarithmic
  learning, remediate basic operations, improve stepwise geometry, separately
  develop percentages/proportions/parts and whole, assemble and exercise virtual
  learner scenarios; the owner subsequently included thorough interactive work
  on tasks 19–21. These direct requests authorize this work and draft handoff.

## Goal and scope

Make missing prerequisites actionable: see the meaning, try a guided problem,
repeat a basic operation, return to the same step, then attempt a separate check.

Included: isolated algebra/foundation and percentage pages; 12 task-19–21 reasoning scenarios; choice of geometric
construction and perpendicular tool; links from the existing navigator; combined
portable preview; mathematical and browser gates; documented scripted learner
scenarios. Reuse the existing styles and Three.js renderer.

Unchanged boundaries: existing registry lesson status, old module grading and
storage formats, generated banks, authentication, backend, group journal and
homepage. The separately scheduled derivative work is outside this branch.
No complete syllabus, Methodizer equivalence or real learning-effect claim.

## Acceptance criteria

- [x] Eight guided function problems, original-function graphs and prerequisite return.
- [x] Fourteen foundational skills with interactive representations, 84 practice
  items and 28 check items; exact equivalent rational answers accepted.
- [x] Six percentage laboratories; 17 scenarios / 61 guided steps, six error
  clinics and 24 check items (17 also available as transfer practice).
- [x] Choice before geometric construction; midpoint, segment and perpendicular.
- [x] Assistance/repeat exposure cannot earn a first independent-check label.
- [x] Existing course state remains separate; reports make temporary state explicit.
- [x] Three viewport widths, keyboard/touch alternatives and combined ZIP links.
- [x] Twelve task-19–21 scenarios, 12 distinct check items, variable-answer
  validators, movement timelines and constructive integer reasoning.
- [x] Five explicitly scripted virtual-learner scenarios, with limits recorded.

## Checks, review and risk

Commands and evidence: [coverage report](../EGE_BAZA_ALGEBRA_FOUNDATIONS.md).
Final author gate: `AUTHOR_MATH_BROWSER_PREVIEW_PASS; INDEPENDENT_REVIEW_PENDING`.

Independent archetype review and explicit owner acceptance remain required before
rollout. Scripted virtual learners are not independent reviewers or human pilots.
No external review verdict is claimed.

Risks: limited fixed assessment bank, temporary state, browser-specific behavior,
mathematical misconceptions caused by a visual. Rollback removes the two isolated
sections and their navigation links and restores prior geometry/preview files;
there is no learner-data migration.

## Permissions and execution record

Branch, local implementation, tests, commit, publication of branch and Draft PR:
authorized by the current scoped requests. Merge, auto-merge and deployment: no.
Actual base/branch match Identity. Exact final head is recorded in the Draft PR.
No force, reset, rebase or security-setting changes are part of this task.

The handoff identifies base/head, pass/failure/not-run checks, remaining readiness
limits and the review recommendation. No release decision is requested merely to
inspect this prototype.
