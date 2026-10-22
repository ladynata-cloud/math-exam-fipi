# Merzlyak geometry 10, basic level: complete-course preparation

## Identity and owner scope

- Owner: repository owner; request on 2026-10-23 (Asia/Novosibirsk).
- Request: publish an individual course for the supplied Merzlyak basic-level
  grade-10 textbook, with theory, solutions to every exercise and visible models;
  carry out the work entirely in the cloud.
- Base: `main`, `6a1f0488e33f9836663382a2e220e69092910337`.
- Branch: `content/merzlyak-10-base-course`.
- Review level: HIGH; new course content and isolated reuse of the existing
  textbook renderer, without a new interaction architecture.

## Evidence and source

The supplied book is Merzlyak, Nomirovsky, Polonsky and Yakir, Geometry 10,
basic level, fifth stereotype edition, Prosveshchenie, 2022. Source SHA256 and
page metadata are in `stereo-course/merzlyak-10-base/source-index.json`.
The source has 209 PDF pages / 208 printed pages, four chapters, nineteen
theory paragraphs and paragraph 20 for cumulative revision.

The numbered exercise inventory contains 723 paragraph exercises and thirteen
supplementary exercises. Theory questions, computer blocks and project topics
are counted separately. A numbered position is not an authored solution.
The PDF body is largely vector outlines; OCR must be checked against page
images, especially formulas, Greek letters, indices and geometric figures.
The original PDF, full OCR and page images are not repository deliverables.

## Implementation scope

- Add an isolated course at `stereo-course/merzlyak-10-base/`.
- Preserve source numbering and actual printed/PDF page references.
- Reuse the existing textbook interaction: model first, progressive justified
  steps, retained answers and camera, optional nested help, manual proof notes.
- Copy the small textbook engine locally; change only the edition page offset
  and exact dotted-number search. Shared Atanasyan course files stay unchanged.
- Add individually authored lessons and complete-part contracts as they are
  visually verified. Keep unreviewed or unfinished material explicitly pending.
- Add reproducible build and source/schema/model/runtime checks.
- Keep first preparation separately reviewable: chapter-I exercises and
  paragraph theory overviews; this is not completion of the requested book.

Out of scope: student accounts, personal records, board/server protocols,
payment settings, unrelated courses, automatic promotion of draft lessons.

## Acceptance and truthful reporting

- Every numbered exercise and every source subpart must eventually have its
  own correct solution; different configurations need separate clear models.
- Full-course completion requires every source position and part, including
  supplementary work, to be accounted for. Nineteen overview cards alone do
  not constitute every proof/example/question in the theory chapters.
- Keep `inventoryComplete:false` while subpart verification remains incomplete.
- Builders must not mark lessons reviewed. Required review fields are evidence,
  not a formatting workaround. Public students see only reviewed lessons.
- Report source positions, authored cards and reviewed/available cards
  separately, together with missing checks and remaining source sections.

## Checks and review

Required: JSON schema, exact source identities/pages, mathematical model
integrity, retained-input and isolated-storage contracts, dotted-number
search, hidden-draft behavior, reproducible build, `git diff --check`, and
independent source/mathematics review. Browser evidence must distinguish
engineering preview of drafts from publication readiness.

The existing Claude consultation policy was read. No Anthropic/Claude API
credential is exposed in this execution environment, and plugin discovery
returned no Claude integration. The repository has a separate Claude Actions
workflow; its secret/balance has not been established. No paid review or
external approval has been claimed. Preparation and technical checks continue;
an unavailable review cannot be treated as a waiver or a passed release gate.

## Risk, isolation and rollback

Main risks: incomplete OCR conditions, omitted subparts, mathematically
misleading coordinates/sections, crowding of labels, and falsely presenting
the inventory as a finished course. New paths isolate the current work from
the concurrent Atanasyan release. Rollback is removal/reversion of these new
paths; no pupil/server state is changed.

## Permissions and execution

The current conversational request authorizes cloud preparation, commits,
push and a reviewable draft PR; it explicitly requests publication as the
eventual outcome. It does not waive mandatory mathematical/release review.
Do not publish unfinished drafts or imply background work continues after
the executing turn ends.

Execution details and actual gate output are recorded in the PR and the
course README after validation. No release approval is recorded in this file.
