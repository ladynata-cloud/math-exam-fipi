# Existing OGE course: task-first interface

## Identity and authorization
- Owner: repository owner, explicit current conversation request to rebuild the
  whole OGE course in the accepted task11/task19 style, cloud work and publication.
- Base: `1bee66162fe76c5cd11b2860cd73c7a9706fb889` on main, after the independent task6 release.
- Branch: `feat/oge-course-minimal`.
- Review: HIGH. Although banks and most mathematical engines remain unchanged,
  the combined course rollout changes broad learner-facing runtime behavior.
- Existing task11/task19 presentation is the accepted reference; no new platform,
  authentication protocol, storage schema or trainer bridge architecture.

## Outcome and coverage
One problem is visible immediately. Optional «Хочешь подсказку?» reveals a
relevant drawing, model or checked steps. Topic selection, statistics, modes and
extra explanations are accessible in disclosures. Essential problem diagrams,
tables, units and required answer conditions remain in the task. Part2 still
requires written reasoning; a numerical checker is not presented as proof grading.

The scope is the existing main OGE route: lines1–25, the practical1–5 family,
the existing full author variant, both course hubs, and four directly linked
foundation trainers. Task6/11/19 were already released in this style and retain
their public URLs. Task13's redirect and the practical index redirect remain.
Task15 is honestly labelled as one existing external-angle lesson, not a complete
triangle bank. The separate70-page PredOGE course remains accessible and is not
claimed to have been rebuilt by this release.

Exact file scope: `OGE_COURSE_MINIMAL_FILES.json`; route coverage:
`OGE_COURSE_MINIMAL_ROUTES.json`. Staging dependencies and scratch scripts are
excluded. The rounding downloadable HTML/archive are rebuilt from the canonical
source without rewriting other downloaded trainers.

## Preservation and defect fixes
- Keep banks, generators, rational answers, diagrams, existing URL/deep-link
  entry, stored progress keys, retake/exam modes and historical attempt semantics.
- Original progress engines are retained. UI fixes prevent duplicate credit in
  tasks13/22, reveal-to-independent bypass in20/22/23 and tab-roundtrip reset in13.
- A deliberate new-round control in13 permits further practice after the frozen
  bank is completed, preserving accumulated session results.
- Task23 keeps entered final answers and shown/missed provenance when entering
  its existing guided steps. Task24 keeps opened help and the repeat-errors queue.
- Task12 guided errors go through its existing error journal. Task22's embedded
  new-example button changes the main problem together with the help.
- Practical help uses the actual question type; required paper-format facts stay
  in the condition. Stoves clear help/reveal on a new task.
- Negative-number hub now opens its existing number-line trainer directly; the
  original line and game URLs remain available. Rounding's algorithm stays exact.

## Acceptance and validation
- Existing algebra668-check and geometry1873-check gates.
- Per-family meaningful DOM tests for immediate problem, optional help, retained
  input, mathematical bank identity, provenance, new-task cleanup, exam isolation
  and old progress/deep-link behavior.
- Chromium320/360/1280 per family: essential content, no page overflow, keyboard,
  input/help transitions, real control state, offline files and screenshots.
- Navigation preserves every original destination; hash links open disclosures.
- Reconcile two stale navigation assertions with routes already present at the
  named base: canonical /foundations/ home CTA and arithmetic-route skill entry.
  Direct division and the older quick-skill map remain explicitly checked.
- Existing broad learning/server/cabinet and public SEO workflows remain enabled.
- Exact changed-path manifest, no secrets/machine paths, syntax and diff checks.
- Independent cross-review between family implementers; concrete findings fixed
  and regression tested. This is internal review, not external-provider approval.

## External review and publication gate
The repository already configures Anthropic and `claude-opus-4-7` in its draft
workflow. This release adds a separate read-only review job using that configured
service. It sends only the scoped public diff, never credentials or pupil data.
Permissions are contents:read; no output code is executed and no commit is written.
Provider response ID, actual model, exact base/head, PR and timestamp are recorded.
Malformed, incomplete, unavailable or change-requested reviews fail closed.
Mocked offline tests exercise those boundaries without a key or network.

Publication requires an actual external APPROVE for the exact reviewed head,
all applicable checks, fresh authoritative-main equality, and reviewed tree/parent
identity. A model marker copied into source or a PR body is not review evidence.

## Risks and rollback
Primary risks are cross-mode provenance, input loss, inaccessible problem data and
small-screen geometry. Per-family and independent checks target these risks.
Rollback restores the exact changed paths from the named base through a normal
reviewed commit; no storage migration or destructive rollback is required.

## Execution record
Exact local, cloud, external-review and production evidence is recorded in the PR.
Final gate: OGE_COURSE_MINIMAL_OK only after successful production verification.
