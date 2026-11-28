# MathExam task specification

## Identity

- Task: `PROFILE_DIAGRAM_VISIBILITY_20261116`.
- Owner: MathExam repository owner, current task conversation.
- Date: 2026-11-16 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`.
- Planned branch: `fix/profile-diagram-visibility-20261116`.
- Review level: `SMALL`.
- Related issue or ADR: owner's screenshot of `/ege-profil/azbuka-metodov/#/space-drawing/find-face`; no architectural change.
- ADR status: not applicable.

## Goal

Restore readable edges and vertex labels, including B₁ and D, in the reported
self-check and every exercise using the same six static diagram templates.
Deliver the matching corrected standalone HTML and ZIP.

## Context and evidence

- At the base SHA, `diagrams.js` emits `alphabet-diagram`, while `styles.css`
  applies its drawing, label and responsive rules to `az-diagram`.
- SVG's default black path fill obscures the existing B₁ and D text; the labels
  are present in the source. The unmatched stylesheet also loses hidden-edge
  dashes, circle strokes and bounded responsive sizing.
- The six templates are `box`, `coordinate-box`, `triangle`, `parallel`,
  `tangent` and `diameter`. They are used by 23 exercise conditions in eight
  skills, as counted from `data.js` and `routes.js`.
- At the base SHA, both the methods-atlas standalone HTML and its ZIP contain
  the same mismatch. Production reconciliation and observed checks belong in
  `docs/reports/PROFILE_DIAGRAM_VISIBILITY_20261116.md`.

## Approved scope

### In scope

- Connect the shared renderer to the existing `az-diagram` styles, retaining
  `alphabet-diagram` for compatibility.
- Move the coordinate-box P label clear of its adjoining edge, without changing
  any vertex or edge coordinates, as part of the analogous label-visibility fix.
- Version the online diagram script URL so a cached old script is not reused.
- Rebuild only `ege-profil-methods-atlas` with the existing download builder;
  include the corresponding HTML, ZIP and generated manifest metadata.
- Record the specification, bounded production reconciliation and validation.

### Out of scope

- New exercises, instructional redesign, a site-wide restyle or architecture.
- Merge, auto-merge and deployment; current conversation instructions require
  a separate owner authorization and override broader repository policy.

### Files or areas that must not change

- Exercise text, answers, route IDs, saved-work keys and progress behavior.
- Other download packages, cabinet/board services and unrelated active tasks.

## Acceptance criteria

- [x] All six templates receive transparent fills, visible strokes and labels.
- [x] The box shows all eight labels, including B₁ and D; hidden edges are dashed.
- [x] The reported self-check and analogous diagrams fit narrow and desktop views.
- [x] The corrected drawing is present in standalone HTML and the actual ZIP.
- [x] Existing answer, hint, progression and restoration checks pass.
- [x] The final diff contains only this task and preserves original conditions.

## Checks and gates

- Required tests: `node --test tools/profile-alphabets.test.cjs`;
  the existing methods-atlas scenario in `tools/trainer-download-stage2.browser.cjs`.
- Required static checks: `git diff --check`; bundle/source identity and unchanged
  exercise/engine files; no unrelated generated changes.
- Manual checks: inspect all six rendered diagrams, their computed fill/stroke,
  visible label bounds and page overflow at 320/390/768/1280 px; inspect the
  reported check and matching offline copies; verify reload preserves a draft.
- Final gate marker: `PROFILE_DIAGRAM_VISIBILITY_PASS` only after actual checks.
- Checks intentionally not run: full unrelated course/server suites; external
  provider review is not required for this isolated `SMALL` presentation fix.

## Review plan

- Review-level rationale: one shared display-class correction and mechanical
  propagation to one existing offline package, without state or mathematics changes.
- Trainer design consultation applicable: no; learning sequence is unchanged.
- Before implementation: screenshot and exact-base source diagnosis completed.
- Ready-result review: source diff, geometry/label inspection, existing functional
  checks and independent bounded technical review; no real-pupil pilot claimed.
- External review required: no for `SMALL`; no external provider review performed.
- Sanitized handoff constraints: repository-relative paths and task evidence only;
  no secrets, personal data or machine-specific paths.
- If external review is later requested, record provider, PR, base/head, verdict
  and a verifiable source/time. This specification is not an external verdict.

## Risk and rollback

- Main risk: a stale script or offline package could retain the broken display;
  URL versioning and verification of both distribution forms address this.
- Rollback: revert this task's display and generated-package changes as one unit
  in a separately authorized PR. No data migration or deletion is involved.
- Compatibility: retain the old SVG class, all condition/answer content, route
  IDs, data structures and storage keys.

## Permissions

- `START` granted in the current task conversation: yes, exact task ID above.
- Branch creation, local commits, push and Draft PR: allowed.
- Release authorization: not granted in this conversation. The owner's supplied
  `AGENTS.md` explicitly limits this task to a Draft PR; separate permission is
  required for merge/auto-merge/deployment despite the broader standing policy.
- Force operations, reset, rebase and non-fast-forward merges: not authorized.

## Execution record

- Actual branch: `fix/profile-diagram-visibility-20261116`.
- Actual base SHA: `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`.
- Head SHA, PR and exact CI: to be recorded in the Draft PR handoff.
- Local outcomes and limitations: see the validation report.
- Scope deviations: none.

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
