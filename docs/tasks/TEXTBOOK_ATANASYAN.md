# Atanasyan 2024: complete source catalogue and detailed visual course

## Approved goal

The owner supplied the 12th edition (2024), Geometry10–11, and requested every
exercise, all theory and visible visualizations of both, with justified progressive
solutions. Work and publication are authorized in the cloud. Merzlyak and Pogorelov
remain separate later courses when the corresponding books are supplied.

The complete target is1056 numbered exercises,99 main theory points,96 chapter
self-check questions and2 appendices. Embedded examples/proofs belong to the
corresponding theory point or appendix. A source catalogue is not finished content.

Base: `bc322a30111d5a4178ba1a865c56ee1fbe85f03a` (published foundation PR296).
Branch: `feat/atanasyan-textbook-2024`.

## This implementation stage

- Separate `/stereo-course/textbook/`, linked from the existing foundation and
  profile supplement. Retain the existing39-unit workshop and its stored work.
- Full source number/page catalogue, distinguishing historical EGE namespaces.
- Detailed introduction: all15 exercises and their parts (31 cards), all theory
  points1–3 (8 focused cards). Further content is visible as pending inventory,
  with no generic substitute solution or unsupported completion claim.
- Existing mathematical renderer and fraction display; condition and model first,
  optional help/questions and progressive explanations in place.
- Every proof step has a mathematical basis. Theory opens with its own model in
  the same page and returns to the original reasoning and draft.
- Separate final/step drafts; explicit labels; manual proofs are saved for human
  discussion, never automatically certified. Versioned lesson identity prevents
  changed conditions from inheriting old answers. Known stale writes are rejected.
- Search/filter/pagination and honest counts by original exercise/point rather
  than inflated card/subpart counts. Only reviewed, structurally valid cards open.

## Source handling and completeness

The supplied book has290 PDF pages; printed page+2=PDF page. Number sequences and
theory headings were checked across the book, including table of contents and
body boundaries. Formulas/figures require visual page verification before authoring.
Publish source metadata, authored paraphrases, original solutions and new models.
Do not publish the PDF, source page images, raw extracted full-book text, private
file identifiers or machine-specific paths. Preserve the book's historical EGE
numbers3,6,8,14,16 without presenting them as current exam numbering.

Source completeness, mathematics and pedagogy are independent review states.
The builder never upgrades review flags. Unfinished parts stay in the catalogue.
Content review includes existence/uniqueness, degenerate cases, hidden auxiliary
constructions and ensuring the initial question does not state the answer.

## Acceptance and checks

Review level HIGH: authored mathematics and persistent learner work.

- Exact source namespace counts; no missing/duplicate numbered exercises.
- Reproducible source/catalog build; semantic and Draft2020-12 schema validation.
- Independent source, proof and coordinate review of every published card.
- Runtime tests cover deep theory return, drafts/cameras, help credit, proof honesty,
  revision changes, malformed records, stale recovery and failed-storage recovery.
- Real cloud browser journeys, actual mobile/desktop screenshots and label bounds.
- Existing stereometry/profile bridges remain tested. No weakening of inherited gates.
- Paid Claude calls remain deferred by the owner's explicit decision; do not claim
  Claude review. Independent review and exact-head checks are required.
- Fresh-main check before ordinary squash; verify reviewed tree/parent, exact-merge
  Pages deployment and public SHA256/size/HTTP identity after publication.

Gate for this stage: ATANASYAN_TEXTBOOK_INTRO_OK. It does not mean the entire book
has been authored. Record exact base/head/tree and all release evidence in the PR.

## Risks and rollback

Risks: incomplete parts, incorrect incidence or proof, an answer revealed by the
initial model, lost work and inflated coverage. Independent review, explicit
source metadata, model checks and state/browser tests address these separately.
Local storage uses optimistic checks; it is not an atomic multiuser database.
An ordinary scoped revert removes the new entry while preserving its versioned
learner storage. No server, authentication, payment or exam-bank migration occurs.
