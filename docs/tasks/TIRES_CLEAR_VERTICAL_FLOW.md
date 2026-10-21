# Tires: visible dimensions and a clear learning order

## Identity

- Task: TIRES_CLEAR_VERTICAL_FLOW
- Owner: MathExam owner, current conversation, 2026-10-21
- Base: main, 606f629e40c9859a25551b735e9fc981f6345836
- Branch: feat/tires-clear-vertical-flow
- Review: MEDIUM; bounded refinement of the existing practical help under accepted ADR0003

## Goal and supplied evidence

The owner supplied eleven annotated screenshots and asks for visible labels on
the rotating tire, larger text, checkbox measurement controls close to the
model, the term «высота боковины H», explicit show/hide help buttons and a
vertical route ordered marking → task1 → shared calculation table → tasks2–5.
The compatibility table is an essential given in task1, not an answer hint.

## Scope

- Label width, sidewall height and rim diameter on the 3D visualization with
  attached dimension witnesses and names/values. Retain mathematically correct
  axial and radial geometry and the available full diameter/radius.
- Replace the inconspicuous dimension dropdown with nearby readable checkboxes;
  selected dimensions and model settings survive help closing/reopening.
- Use «высота боковины» consistently in this trainer. Clarify that the second
  marking number is its percentage of width. Enlarge small text, numbers and
  diagrams including the rolling-wheel example.
- A vertical step chooser starts «Давайте разберёмся с маркировкой». Task1
  immediately follows it and visibly includes the exact variant compatibility
  table. The shared calculation table follows task1 and supports tasks2–5.
- Explicit «Хочешь подсказку?» / «Убрать подсказку» state labels in this trainer.
- Preserve original task bank, answer calculations, original inline engines,
  earned progress, storage schema and unrelated storylines. Reorder existing
  controls by stable step IDs, not by interpreting array position as identity.
- Include the same runtime changes in the downloadable package.

No new lead capture, cabinet/backend/deployment configuration, paid API use,
FIPI bank retrieval or textbook work belongs to this task. Private screenshots
are review evidence only and must not be committed.

## Acceptance and gates

- Width B is axial; H is radial; rim d uses25.4mm per inch. All visible
  measurements have readable attached labels and no collisions/clipping on
  narrow screens or at supported extreme rotations/dimensions.
- Checkbox selection works with keyboard and touch and is retained.
- Route and previous/next buttons follow0,2,1,3,4,5,6 while engine step IDs and
  per-step completion identities stay intact across variant changes/reloads.
- Task1 compatibility table matches each of the20 bank variants and the
  author analogue and is visible before answering; no correct cell is revealed.
- Calculation rows/accepted values and answer drafts remain available when
  navigating to tasks2–5 and returning. Exploration awards no progress.
- Focused Node/JSDOM tests plus retained practical/course/SEO gates; actual
  cloud CI browser checks at320/360px and desktop for labels, table access,
  sequence, toggles, input retention and offline archive.
- Independent mathematical/technical review and actual screenshot review.
- Final marker TIRES_CLEAR_VERTICAL_FLOW_OK only after published-file and live
  UI verification. Local browser launch is not used.

## Consultation, risk and permission

Paid Claude consultation is explicitly deferred by the owner, so it is not run
or claimed. Owner screenshots and requested sequence are the design brief;
independent review checks the implemented result. Main risks are stable-ID
navigation errors, hidden essential givens, label overlap and lost drafts.
Rollback is an ordinary scoped revert, with no learner-data migration.

The user authorizes cloud implementation and has standing explicit publication
permission in this conversation. Root completes checks and normal publication;
no repeated permission request, force/reset/rebase, admin bypass or weakened
gate. Child agents edit only assigned files and do not publish or commit.

## Execution

In progress. Exact head/tree, actual gates, review and production evidence will
be recorded in the release PR. Real pupil testing is not claimed.
