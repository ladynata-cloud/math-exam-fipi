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
- Preserve separately reviewable cloud checkpoints while completing all four
  chapters, cumulative revision, questions, computer work and project guides.
- Include all five additional articles, with their definitions, worked examples
  and proofs; the numbered paragraph inventory alone is not the whole course.

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
- A manual content-review transition must cite independent source, mathematics
  and pedagogy verdicts for every exact draft hash. Preserve the original
  reports and a ledger proving that only status/review fields changed; audit
  every current file against that evidence in CI. This is not merge approval.
- Report source positions, authored cards and reviewed/available cards
  separately, together with missing checks and remaining source sections.

## Checks and review

Required: JSON schema, exact source identities/pages, mathematical model
integrity, retained-input and isolated-storage contracts, dotted-number
search, hidden-draft behavior, reproducible build, `git diff --check`, and
independent source/mathematics review. Browser evidence must distinguish
engineering preview of drafts from publication readiness.

The existing Claude consultation policy was read. One bounded request ran in
GitHub Actions run `39857930153` using the existing Actions secret. The provider
returned HTTP400 without an answer or verdict; exact evidence is retained in
`tools/merzlyak-10-base/external-review-attempt.json`. No retries were made.
Independent content review covers every exact draft hash; external exact-head
release review remains unavailable and has not been waived.

The completed content inventory is 875 source groups / 989 required components:
762 solution cards for all 736 standalone exercise numbers, 86 theory cards,
97 selfcheck answers, 39 computer-work cards and five project guides. The manual
review transition retains all original reports and an exact before/after ledger.
The current main may advance through concurrent Atanasyan PRs; the final PR
records authoritative base provenance and the tested virtual composition.

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
