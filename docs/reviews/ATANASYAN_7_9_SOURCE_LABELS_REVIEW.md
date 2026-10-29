# Атанасян 7–9: source-label implementation and display review

Date: 2026-10-28. Scope: labels in the existing textbook runtime and entry page.
This record is the implementing agent’s self-review and actual-render evidence,
not an external-provider verdict or independent approval of its own code.
The separate regression reviewer maintains independent expected labels and
preservation checks. The paragraph inventory was supplied by the independent
source auditor after visual inspection of the exact 2023 source.

## Observed behavior

- Every existing task heading/link uses `К задаче №…`; theory uses `К пункту …`
  and the exact paragraph context `К параграфу §…`. A numbered theory point is
  never renamed as a paragraph.
- Chapter labels use `К главе I …` through `К главе XV …`; the chapter list also
  shows the 19 independently inventoried paragraphs of chapters I–V.
- Chapter questions use `К вопросу №… для самопроверки`. Neither chapter questions
  nor additional end-of-chapter tasks receive a fabricated paragraph.
- Advanced material is a distinct grade-level section; the source-related
  chapter groups display `К главам I и II`, `К главам III и IV`, or `К главе V`.
  It is not silently assigned to chapter VI.
- The course has a source-labelled page title and an initial HTML introduction.
  Filter labels distinguish a chapter from a separate section.
- Source identity, raw lesson title, revision, identifiers, storage keys, steps,
  statements, solutions and model geometry remain untouched by the display code.

## Display correction to task 30

Two legacy internal subpart labels, `1/2AB` and `1/4AB`, were previously formatted
as the mathematically different fractions 1/(2AB) and 1/(4AB). For this exact task
and these exact labels only, display text is now `AB/2` and `AB/4`. The rendered
numerator is AB and the denominator is 2 or 4. The source mapping, original
condition, solution and model are unchanged.

## Checks completed

- Independent literal-title oracle: 705 existing cards (543 task parts, 45 theory
  points, 117 review questions) match the requested labels.
- All 705 existing card headers were opened and checked in a DOM renderer before
  the two task-30 label corrections; the final task-30 fraction DOM and rendering
  were then checked explicitly in Chromium.
- Actual source-context checks: 460 existing cards receive verified paragraph
  labels, all 117 review questions omit them; 34 paragraph-boundary/additional-task
  cases and all three advanced group labels pass.
- Chromium at 320 px: catalog and four actual lesson journeys (30 part 2,
  30 part 3, theory 42, chapter-V question 30) open by the expected permalink;
  all 19 paragraph rows exist; no horizontal document overflow or page error.
  Fresh screenshots were visually inspected for the fraction and long theory
  heading. The earlier 320 px catalog/task/question screenshots were also read.
- JavaScript syntax and whitespace checks pass.

Full-course mathematics, all-view browser testing, shared-board regression,
review manifests and exact-head CI are separate root-task gates. This record
alone does not promote drafts or authorize publication. No real pupil data was
used.

## Reviewed bytes

| Path | SHA-256 |
| --- | --- |
| `geometry-course/textbook/assets/engine.js` | `85d395dbfb66f8a1409f1d2f930fbb6f742c0085239d34d18ec2a901f3bd6492` |
| `geometry-course/textbook/index.html` | `098ee5017758a8fb892af5da256cbc945ba4002cbfd82b1a0bcbd4c339f01804` |
| `geometry-course/textbook/source-inventory.json` | `e01036d2efaea5591e874b0669f8cbfba0ab8c9a67170042f78bb73efc9c10b6` |
