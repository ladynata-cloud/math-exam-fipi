# Tires: an exam-like variant with persistent givens and calculations

## Identity and owner revision

- Task: TIRES_VARIANT_FIRST_LAYOUT (continuation of TIRES_CLEAR_VERTICAL_FLOW)
- Owner: MathExam owner, current conversation, 2026-10-21
- Base: main, 606f629e40c9859a25551b735e9fc981f6345836
- Branch: feat/tires-clear-vertical-flow; PR292
- Review: MEDIUM, bounded presentation refinement under accepted ADR0003

The owner revised the layout before publication: the first page must resemble
an actual variant with all five questions. The visualization is immediately
visible. Both tables remain available throughout the variant. Explanations
appear through small contextual questions, not as compulsory lesson screens.
This explicit revision supersedes the earlier seven-screen learning route.
The tested dimension, terminology, readability and retention fixes remain.

## Scope

- Show the actual original task1–5 conditions and their original answer controls
  together, without selecting a lesson step. Preserve every variant's wording,
  data, answer algorithms, original inline engine and progress identity/schema.
- Show a rotating 3D tire immediately with B/H/d/D/R labels attached to actual
  dimension witnesses, readable numeric values and nearby checkbox choices.
  Use «высота боковины». Initialize the main model from the variant's factory
  marking; distinguish exploratory changes from the fixed question data.
- Keep both the exact compatibility matrix and the original editable calculation
  table mounted and available through the whole variant. Do not replace editable
  controls with unsynchronized clones. No correct-cell highlight in the given.
- Desktop: a reference/calculation pane beside the task stream; mobile: readable
  stacked panes, with explicit horizontal table-scroll guidance. Source numbers,
  table headings and captions remain at least18px where applicable.
- Put explanations, marking quizzes, guided calculation steps and auxiliary
  models behind contextual questions near the relevant statement or control.
  Essential givens and the main 3D visualization must not be hidden in help.
- Table inputs use the existing validator. Help and exploration do not award
  credit, alter drafts or discard accepted cells. Optional original walkthrough
  and all mathematical models remain available.
- Preserve stable engine section/button IDs even when all task sections are
  visible. Variant changes refresh givens and model without duplicate controls.
- Include the same runtime in the downloadable archive. Other storylines stay
  unchanged; this is the concrete tire implementation of the new presentation.

No new lead capture, backend/cabinet configuration, paid API, FIPI retrieval or
textbook work belongs to this task. Private supplied screenshots are evidence
only and must not be committed.

## Acceptance and gates

- Width B is axial; H is radial; rim d uses25.4mm per inch. Labels do not clip or
  collide at supported orientations and dimensions, including mobile.
- A fresh load already shows the main model, both tables and all five original
  questions/answer controls. Contextual help starts closed.
- All20 bank variants and the author analogue retain exact original conditions
  and compatibility cells. Both tables persist while answering any question.
- Original input nodes, drafts, accepted work and step completion IDs survive
  navigation/help. No automatic credit from models or help.
- Focused Node/JSDOM plus retained practical/course/SEO checks. Actual cloud
  browser checks at320/360px and desktop verify continuous layout, two panes,
  state, font sizes, keyboard/touch interaction and offline equivalence.
- Independent mathematical/code and screenshot review. Initial baseline head
  bbb872213d0546acb4e7854b5760ea535e7398f5 passed all gates, but is not a release
  candidate after the owner's layout revision.
- Final TIRES_VARIANT_FIRST_OK only after exact-head CI, normal merge, exact
  published-file verification and live UI proof. No local browser launch.

## Consultation, risk and authorization

Paid Claude is explicitly deferred by the owner and is not run or claimed.
The owner's latest direction is the design brief. Main risks: hidden essential
information, duplicated controls, lost drafts, invalid section identity and
mobile overflow. Rollback is an ordinary scoped revert with no data migration.

The user authorizes cloud implementation and publication in this conversation.
Root completes checks and normal publication without repeated permission.
No force/reset/rebase, admin bypass or weakened gates. Child agents edit assigned
files, do not commit or publish. Exact release evidence is recorded in PR292.
