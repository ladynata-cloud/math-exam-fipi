# Atanasyan: complete sphere paragraph, exercises 372–395

## Release continuation — 2026-11-02

The owner now explicitly requests resuming PR #386, resolving current-main
incompatibilities, repeating the necessary checks and then merging and publishing
the Sphere section. This current instruction supersedes the preparation-only
permission boundaries in the historical execution record below. Preserve the
existing 46 cards, all prior material and learner work. The only integration
conflict is in the project journal; product files are unchanged. See the
[continuation record](../reviews/ATANASYAN_SPHERE_RELEASE_20261102.md).

## Identity

- Task: ATANASYAN_SPHERE_372_395.
- Owner: MathExam project owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: main.
- Base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da` (published cone PR374).
- Planned and actual branch: `content/atanasyan-sphere-372-395-20261031`.
- Review level: HIGH.
- Parent approved scope: [complete Atanasyan textbook](TEXTBOOK_ATANASYAN.md).
- ADR 0001 remains Proposed and advisory; no new trainer archetype is introduced.

## Goal

Continue the existing 2024 twelfth-edition visual course with all of chapter IV
§3 «Сфера»: theory 43–51 and exercises 372–395, including all 37 printed
exercise parts. Preserve the published course and its learner work. The expected
addition is 46 cards, bringing the complete available course to 640 cards.

## Context and evidence

The owner said «продолжай» immediately after the verified cone release and the
identified next sphere paragraph. This is the explicit instruction to start
the bounded continuation, not another merge authorization. The parent task
authorizes continuing cloud implementation and records the paid-Claude deferral.

PR374 was squashed as the base above, parent
`c9bf66e2d95f48db0134d43cc590da89f8bc3053`. Pages run 41143302786 and post-merge
run 41143303245 succeeded. All 48 checked public files matched the release;
the published bundle has 594 cards and SHA256
`2f129a9bab292fae765c674268448895d0419e70e0fd4fd30120fcae53569bc1`.

Source PDF SHA256:
`bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`.
Theory occupies printed pages 100–109 (PDF 102–111), exercises printed pages
110–111 (PDF 112–113). Conditions and figures require actual page inspection.
The source index must include both 382а and 382б; the latter gives 12 cm²,
not 12π cm². Point 46 states the sphere-area formula and defers its proof to
point 62; the lesson must acknowledge that boundary. Starred points 47–51
require complete reasoning, including converse inclusions and degenerate cases.

## Approved scope

### In scope

- Author the 46 source-bound cards with exact original models, optional help,
  progressive justified explanations and existing textbook/paragraph captions.
- Add exact source-part contracts and independent review bindings.
- Reuse the existing scene renderer, including its already implemented analytic
  sphere visibility primitive. If needed, admit that existing optional primitive
  in the lesson schema, with an exact additive schema migration and negative
  controls; do not alter the renderer or existing lesson/storage contracts.
- Add independent source, numerical, actual-coordinate, pedagogy and image review.
- Preserve historical gates through exact append-only projections, frozen
  baseline hashes and explicit negative controls. Add sphere gates and captures.
- Reconcile the completed cone publication in PROJECT_STATUS within this task.

### Out of scope

- Chapter self-checks, exercises 396–439, chapter V and later textbook content.
- Other courses, student accounts, assistant configuration or board protocols.
- Source scans, PDF pages, full-book extracted text or private source identifiers
  in the repository or a remote review handoff.
- Merge, deployment, history repair or changes to repository protection.

### Files or areas that must not change

- All 594 published lesson JSON files, IDs, revisions and review records.
- Existing renderer, runtime engine, styles, builder and storage implementation.
- Unrelated project files and source-index metadata outside this paragraph.

## Acceptance criteria

- [ ] All 24 exercise numbers / 37 parts and nine theory points are complete.
- [ ] All prior 594 lessons and saved-work identities are exactly preserved.
- [ ] Every new condition, solution and model has independent exact-content review.
- [ ] Sphere/ball, circle/disk, plane/line tangency and angle definitions are precise.
- [ ] Model domains, auxiliary constructions, hidden lines and initial-answer
      privacy are verified; no tessellated area is used as an analytic formula.
- [ ] All prior tests and applicable shared regressions pass without weakening.
- [ ] Every available card completes mobile/desktop browser journeys; new states,
      help and explanations have actual-image inspection.
- [ ] Draft PR contains exact base/head, evidence, failures and limitations.

## Checks and gates

- Deterministic build, catalog/source/schema, prior content and preservation gates.
- Independent sphere numeric/model oracle and negative controls.
- Existing runtime, nested theory, saved work, labels and privacy gates.
- Full browser partition/collector and all new-card screenshots at 320/1280.
- Applicable shared visibility, stereometry/profile and public-entry regressions.
- Diff whitespace, exact scope, local links, source sanitization and exact-head CI.
- Final marker: `ATANASYAN_SPHERE_372_395_REVIEW_OK`, only after completed evidence.
- Physical devices and real-pupil trial are not claimed. Paid Claude remains
  deferred under the explicit parent-task decision; no external verdict is claimed.

## Review plan

HIGH is appropriate for authored mathematics and retained learner work.
Independent review must cover source, proofs, numeric results, model coordinates,
readability and exact rendered states. Authors cannot approve their own cards.
The established lesson interaction and analytic geometry are reused; no new
trainer design or interaction consultation is introduced by this content batch.
Reviewer records must distinguish genuine independent review from author checks.
Remote handoffs contain only necessary public/approved source context, never
secrets, private files or machine-specific paths.

## Risk and rollback

Risks include radius/diameter confusion, mixed units, circle/disk confusion,
incorrect insphere/exsphere choice, incomplete converses, cone-plane degeneracies,
premature answer disclosure and visual occlusion errors. Each has independent
source/model checks. An ordinary scoped revert is the rollback; no account,
server or learner-data migration is involved.

## Permissions

- Owner start instruction in this conversation: yes, «продолжай» for the next section.
- Branch creation, implementation, local commits, push and Draft PR: yes.
- Merge and auto-merge: no, require separate authorization after exact-head review.
- Deployment: no, requires separate authorization.
- No force, reset, rebase, non-fast-forward history repair, TLS bypass or gate weakening.

## Execution record

Canonical Draft PR: [#386](https://github.com/ladynata-cloud/math-exam-fipi/pull/386).

The continuation recovered the earlier complete candidate at local commit
`a1e4b7611ec4b829ccdc5ab0023d9679ab2899e5`, tree
`d4466c7b40b455aff3e2441c314f2ed50c017928`, with the same published base.
Its 78 changed files were adopted without restarting authorship or altering the
original snapshot. The initial PR seed specification is superseded by this single
task specification, including the exact optional schema migration already
provided in the recovered task. Parallel uncommitted drafts were preserved
outside the repository and are not part of the candidate.

A fresh independent panel re-read all 46 cards. It found three omissions/errors
in point 51: missing second-Dandelin-sphere reasoning from source remark 1, an
incorrect reference to hyperbola asymptotes, and incomplete focus/directrix
justification. The executing root corrected that card; an independent reviewer
verified the amended proof. At that stage, the other 45 content payloads and every
geometry payload remained identical to the recovered candidate. New review metadata
records the actual panel and its current evidence.

The prior browser run stopped near its beginning; no completed pass is inherited
from it. Full integration, browser image review and exact-head CI are recorded
separately in the PR handoff. This task does not authorize merge or deployment.

A later browser and image review found display defects in 379 and theory 049.
The continuation corrected only three written fields: equivalent Heron formatting
and prose in 379, and operator spacing/denominator parentheses in 049 help h1.
Independent exact-file and targeted native-image follow-ups are recorded in
ATANASYAN_SPHERE_CONTENT.json. All geometry and runtime/style/gate files remain
unchanged. The failed/stopped d0e3 runs are preserved; the amended committed head
requires its own complete browser, image and CI evidence.
