# Editable teacher worksheets for three topics

## Identity

- Task: restore the unfinished Word deliverables and blank error-review sheet.
- Owner: MathExam owner; START «выполни незакрытые задачи. порядок определи самостоятельно».
- Date: 2026-11-06.
- Base branch: main; authoritative SHA `955c83154eed49554b648c03b66e1eba16932222`.
- Branch: `feat/teacher-docx-three-topics-20261106`.
- Review level: MEDIUM, original mathematical content and downloadable documents in an existing catalogue.
- No open DOCX PR or matching task branch was found at the start.

## Goal and evidence

Provide usable, editable Word materials for «Минус перед скобками», «Сумма углов треугольника» and «Линейные графики ОГЭ». Each topic has four equally structured simple variants, with four questions per variant and a separate teacher answer file. Supply one blank editable error-review worksheet. A previous conversation claimed files existed, but that claim is not treated as delivery evidence; these are newly built and verified files.

The repository contains a 145-topic PDF bank in `pedagogam/raboty/bank.json`. Relevant source patterns are `arith-brackets-like-terms`, `geo-ugly-treugolnika` and `alg-line`. The brackets source has only one of four questions focused on a minus before brackets, and the triangle source varies between integer and half-degree answers. The delegated owner-approved adaptation narrows all brackets questions to the requested skill and uses integer angle values consistently. Linear-function questions reuse the reviewed bank. This is original MathExam adaptation, without a claim to be official FIPI questions or a copy of a particular textbook.

## Approved scope

- Seven DOCX files: three student files with four variants each, three separate answer/solution files, and one blank error-review sheet. There are 48 newly verified questions.
- Deterministic source, builder, exact-math and package checks; native editable Word mathematics and drawings.
- A ZIP containing those seven files; links inside the existing teacher catalogue and the corresponding three topic cards. No duplicate landing page.
- Visual render and inspection of every final document page; separate source/math and packaging review.

Do not alter existing PDF files, existing PDF ZIP archives, the 145-topic bank, pupil records, accounts or the assistant. Do not add external inference or make any paid model call.

## Acceptance and gates

- Four variants per topic have identical skill order, question count and scoring, with simple comparable arithmetic.
- Every answer is independently recomputed from the rendered question text; teacher solutions and plotted functions agree.
- Student files contain no teacher answer section. All text, equations and graph elements remain editable; no rasterized equations.
- Seven DOCX packages open, have the expected page breaks, valid internal relationships and no private metadata, tracked changes or protection.
- Deterministic build, manifest hashes, exact archive membership and all catalogue links pass. Existing PDF bytes and catalogue identities are preserved.
- Every page is rendered through the documents skill and inspected for readable type, correct mathematics, sufficient work space, unclipped diagrams and clean page breaks.
- Existing relevant teacher catalogue tests, new Word-download/browser checks and diff checks pass.
- Final marker: `TEACHER_DOCX_THREE_TOPICS_OK`.

## Review and permission boundary

The learning question is whether the four variants assess the same small skill sequence without making arithmetic or layout substantially harder in one variant. Exact symbolic and rational checks supplement manual mathematical review; visual review is separate. External model reviews are waived by the owner and are not claimed. No real-pupil trial is claimed.

Implementation, commits, push and a Draft PR are authorized. Root coordinates publication; this delegated task stops before merge/deployment. No force, reset, rebase, weakened checks or production pupil writes. Rollback removes the additive Word files and links while preserving the PDF bank.

## Execution record

- Implemented seven native editable DOCX files, 25 rendered pages, 48 questions and an exact seven-file ZIP.
- Source and per-question provenance: `pedagogam/raboty/word-packs.json`; deterministic bytes and file hashes: `word-manifest.json`.
- All 25 final pages were rendered and actually inspected; exact DOCX/PNG hashes and resolved layout findings are recorded in `docs/reviews/TEACHER_DOCX_THREE_TOPICS_VISUAL.json`.
- Local source/math/package contracts: 1413 PASS; existing teacher/PDF/topic/sitemap checks PASS. Catalogue browser: 2207 scenarios, 14 downloads, one actual DOCX download, 320/390/1280, no browser errors.
- Scope, reproducibility, independent review and limitations: `docs/reports/TEACHER_DOCX_THREE_TOPICS_20261106.md`.
- Independent review: all 48 questions recomputed by a separate agent; all eight final graph pages and the blank error-review page read by root, with exact hashes in `docs/reviews/TEACHER_DOCX_THREE_TOPICS_INDEPENDENT.json`.
- Composed with current main `60deda9b2a5eddd7d91790a88500d907edb5e5f9` by a clean read-only merge followed by a normal merge. The existing 20-file delta retained its stable patch ID; all applicable local gates were repeated successfully on the composed result.
- Exact committed base/head, applicable CI and publication are separate states recorded in the PR handoff and release report. No deployment or real-pupil trial is claimed here.
