# ОГЭ №18: ответ, чертёж и понятный разбор

## Identity

- Task: `OGE18_ANSWER_MODEL_CLARITY_20261116`.
- Owner: MathExam owner.
- Date: 2026-11-16, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `35e718ca74852857a86dfe9dcc68d091ce165308`, obtained from the GitHub branch API immediately before work.
- Branch: `fix/oge18-answer-model-clarity-20261116`.
- Review level: **HIGH**, including independent mathematical/technical review of help, response state and board compatibility.
- Architecture: existing native OGE task/step and SVG mechanisms; ADR 0003 is Accepted, ADR 0012 protects fixed book editions. ADR 0001 remains Proposed and supplies no new authority.

## Goal

Make the three reported task families understandable on the actual task drawing:
segment ratios (`segCmp`), parallelogram area (`areaPar`) and circle-area ratios
(`circRatio`). Make the answer field and its completed state clear, enlarge
explanations, and prevent unrelated model values or another task's draft from
being mistaken for the current answer.

## Context and evidence

- The owner reported an apparently inactive answer field, an oversimplified
  collection analogue, rejection of 35 and unreadable circle explanations.
- In the live page, explanation text measured 14.5 CSS px and radius labels
  15 CSS px. The main drawing had no controls for counting its radii.
- Archive record 76 has `[7,3,4]`, area 21 and oblique side 5. The separate
  optional model showed base 7 and height 5, producing 35. Its parameters
  were not taken from the current task.
- Archive record 91 has AM=1 and MC=3. Its source index is internal, with no
  edition/page/task-source binding. It must not claim exact collection provenance.
- The first screenshot's complete click history was unavailable. The current
  input was enabled; native code disables it after correct submission or full
  solution. Both states need visible explanations.
- START was explicitly given by the owner in this conversation for this exact
  task. Earlier H17 route work does not include this implementation.

## Approved scope

### In scope

- Same-condition visual steps for the three families, including generated
  instances and diagonal circle radii. Keep native 2/2/3 step counts so existing
  board actions replay without a protocol or persistence-schema change.
- Large type, short task-specific instructions, visible counts, matching
  condition/drawing/help/checker values, and truthful analogue labels.
- Remove the unrelated model from the visible help for these families. Retain
  only the hidden legacy model state needed to round-trip existing board packets;
  it is not presented or counted as learner interactivity.
- State why the answer/check controls are closed. Keep assistance sticky and
  preserve the answer through help. Bind draft recovery to the actual №18
  parameters, not only a repeated family statement.
- Preserve all 123 archive records, 15 subtype generators, numerical answers,
  progress IDs, native checker/exam contract, navigation and board protocol.
- Rebuild only the existing №18 standalone HTML/ZIP; update precise source
  receipts through the existing supported mechanisms, without weakening gates.

### Allowed paths

- `trainers/oge-task18-grid.html`
- `trainers/oge-course-geometry.js`
- `tools/oge18-answer-model-clarity.test.cjs`
- `tools/oge18-answer-model-clarity.browser.cjs`
- `.github/workflows/oge18-answer-model-clarity.yml`
- `tools/oge-course-geometry.test.cjs`
- `tools/oge18-clarity-preservation.cjs`
- `tools/oge18_clarity_preservation.py`
- `tools/fixtures/oge18-answer-model-clarity.json`
- `tools/oge18-clarity-preservation.test.cjs`
- `tools/oge18-clarity-preservation.test.py`
- `tools/oge-learner-entry.test.cjs`
- `tools/oge_worked_steps_book_context.py`
- `tools/oge-worked-steps-book-context.test.py`
- `assets/assistant/page-rollout.json`
- `downloads/trainers-manifest.json`
- `downloads/trainers/oge-task18-grid/oge-task18-grid.html`
- `downloads/trainers/oge-task18-grid/oge-task18-grid-deepseek-prompt.md`
- `downloads/trainers/oge-task18-grid/oge-task18-grid-package.zip`
- `docs/PROJECT_STATUS.md`
- `docs/tasks/OGE18_ANSWER_MODEL_CLARITY_20261116.md`
- `docs/reviews/OGE18_ANSWER_MODEL_CLARITY_20261116.md`

The provenance helpers above are implementation support for these exact source
changes. They must match the complete reviewed source revision and reject
partial, unexpected mathematical, unrelated or old-receipt edits.

### Out of scope / protected areas

- Full harmonization of №15–19, new exercise banks, claiming exact collection
  sources, or changes to mathematical conditions/calculators/generators.
- Other trainers, other download packages, server/cabinet/bridge protocols,
  deployment configuration and unrelated roadmap work.
- Published `book/` editions, `b/` aliases and their immutable receipts.
- Merge, auto-merge, deployment, force/reset/rebase and non-fast-forward branch
  maintenance: no separate owner authorization for these actions was given.

## Acceptance criteria

- [ ] On record76, the visible supported drawing uses a=7,h=3; 21 succeeds,
  35 fails against those same data, with no visible model showing h=5.
- [ ] Segment and circle counts come from actual coordinates, including unequal
  axis lengths and diagonal radii; no squared radius is labelled as a length.
- [ ] All targeted archive/generator cases preserve their exact answers;
  unrelated records, generators and source statements are unchanged.
- [ ] Supported main drawings change with the existing step control; large
  labels remain readable at320/390/1280px without page overflow or clipping.
- [ ] Empty/invalid/comma/fraction answers behave correctly; help and resizing
  retain input; another parameter set does not inherit that input.
- [ ] Closed controls have an explicit nearby status; a duplicate check or a
  disclosed answer cannot create independent success.
- [ ] Old progress and board packets remain valid; no private/independent credit
  is written by shared practice.
- [ ] Rebuilt HTML and ZIP work offline and contain the same reviewed source.
- [ ] Full relevant existing gates and the new CI pass on the handed-off head.

## Checks and gates

- New independent numerical/DOM/state tests and browser scenarios with visual
  evidence at320/390/1280, keyboard and file:// standalone use.
- Existing OGE mathematical, text, learner, minimal-interface, geometry/board,
  model-state and transport gates applicable to the changed sources.
- Exact source/asset receipt negatives, navigator preservation, fixed-book
  integrity, single-kit rebuild/preservation, syntax and `git diff --check`.
- Final marker: `OGE18_ANSWER_MODEL_CLARITY_OK`, only after actual completion of
  all applicable required checks. Unavailable checks are not a pass.

## Review plan

- Internal design review: use the actual diagram and short steps; distinguish
  radius from squared radius and height from oblique side; retain2/2/3 semantic
  steps, native assistance accounting and a tap/keyboard action.
- An independent delegated mathematical/geometry review and separate test work
  are used. Final review records source commit, findings and remaining risks.
- External provider consultation was not requested and is not performed; no
  external approval is claimed. The repository's current review policy retains
  technical review while making provider consultation optional.
- Real-pupil validation is not claimed from automated or internal review.
- All committed evidence is repository-relative, contains only relevant public
  source/synthetic cases, and excludes secrets and personal learner records.

## Risk and rollback

- Risks: wrong scaling/counts for diagonal radii; misleading cut-and-move
  construction; response/help state drift; source/offline mismatch.
- Mitigation: coordinate-based checks, extreme parameter cases, real browser
  screenshots, existing packet/progress gates and precise source bindings.
- Rollback: separately authorized revert of this task's complete source,
  receipt and standalone delta. No storage-key migration or deletion is needed.

## Permissions

- Explicit START, branch, local commits, push and Draft PR: **yes**.
- Result: **verified Draft PR**, under the user's task-specific AGENTS.md.
- The broader committed standing release policy does not override this later
  explicit task restriction. Merge/auto-merge/deployment: **no**.

## Execution record

- Clean isolated checkout and base verified before implementation.
- Actual branch: `fix/oge18-answer-model-clarity-20261116`.
- Actual base: `35e718ca74852857a86dfe9dcc68d091ce165308`.
- Implementation head, PR, completed checks and limitations: recorded in the
  review report and PR before handoff.

## Required handoff

```text
EXECUTIVE STATUS
Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
