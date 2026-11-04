# Task 19: one statement and optional visual help

## Identity

- Owner: Project owner.
- Date: 2026-10-20.
- Base branch: main.
- Base SHA: `6dff8e7b03444ce2a84835ab5ca5ccc0393af3eb`.
- Planned branch: `feat/task19-visual-hints`.
- Review level: MEDIUM: bounded public trainer UI and visual help, with existing
  statement truth values retained. No server or managed learning contract change.
- Related work: `OGE_COURSE_03C_TASK19` is a separate unexecuted plan, not this
  scope: no course-contract migration or new examination format is introduced.

## Goal and verified context

The owner found the richer task19 trainer confusing and requested the first
trainer's minimalist appearance: statement, "Хочешь подсказку?", then a drawing
or interactive model that helps the learner decide. Existing public addresses
must show the same clarified interface, including the cabinet's existing link.

The source banks contain 105 and 63 statements; all original statements and truth
values are retained, exact text duplicates may share a card with ID aliases.
Some inherited explanations need correction, including a rectangle incorrectly
used to refute a statement about triangles. The source data file remains intact
for exports. The original richer interface is archived byte-for-byte so custom
imports, teacher tools and old browser storage remain accessible.

## Approved scope

- Both existing public task19 entry points share the minimal interface.
- Optional visual hints cover every card; several geometry families support
  sliders with valid constraints, measured lengths/angles/areas and keyboard use.
- Before an answer, the hint asks the learner to inspect the relevant property;
  no truth label or ready-made explanation appears. After the answer, show a
  concise explanation immediately, with repeated-answer protection.
- Keep topic choice and error review behind one secondary disclosure. Preserve
  legacy storage; read old progress/error IDs without overwriting old keys.
- Update this trainer's download HTML, prompt, ZIP and manifest coherently.
  Narrow builder support may inline declared assets and select this one entry.
- Add focused math/content/DOM/browser checks and a scoped CI gate.
- Reconcile the preceding release in project status.

Out of scope: new server behavior, pupil records, authentication, managed course
progress, unrelated trainers, or execution of the older full-course task19 plan.

## Acceptance criteria

- The first screen contains one readable statement and the requested hint button.
- A hint remains hidden until requested and has a relevant figure/model for every
  retained statement. Dynamic changes maintain the figure's defining constraints.
- Answering once reveals explanation; another click/key cannot double-count.
- Next card clears prior hint/result; theme filtering and error review work.
- Both existing URLs work at 360px; drawings and controls remain legible.
- Earlier storage remains untouched and known previous progress is carried over.
- Downloaded HTML works without external scripts, CSS or data requests.

## Checks and review

- Source-bank preservation, complete hint mapping, relevant pure model invariants,
  legacy/current state handling and DOM flows; focused browser checks at narrow
  and desktop sizes; syntax and whitespace; normal existing CI remains in force.
- Independent math/pedagogy review of mappings, antecedents and counterexamples;
  independent focused implementation review. No external-provider review claimed
  or required for this MEDIUM scoped UI change.
- Final gate: `TASK19_VISUAL_HINTS_OK` after live verification.
- Record passes, failures and intentionally omitted checks in the PR report.

## Risk and rollback

Risks: a visual suggesting an invalid generalization, stale asset versions, or
progress duplication. Mitigations: independent math review, source-bank coverage,
pure model invariants, versioned assets, guarded answers and non-destructive
legacy reads. Revert the scoped release through a normal follow-up if necessary;
old data keys and the original JSON remain available. No server migration.

## Permissions and execution record

The current request authorizes implementation. Explicit owner permission to
publish persists in the conversation and covers this requested redesign. No
force, reset, rebase, admin override or weakened gate is authorized or needed.
Record exact base/head/tree, PR, independent review, required checks, fresh main
guard, merge and live verification in the PR release report.
