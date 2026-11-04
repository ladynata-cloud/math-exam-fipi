# Atanasyan 10–11: visible companion references and chapter III completion

## Identity and owner scope

- Date: 2026-10-28, Asia/Novosibirsk.
- Task: ATANASYAN_COMPANION_310_319.
- Base: `fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8` (`main`).
- Branch: `content/atanasyan-companion-310-319-20261028`.
- Review: HIGH; established course, source-specific mathematics and retained work.
- Parent: [complete textbook](TEXTBOOK_ATANASYAN.md).

The owner asks to continue the existing Atanasyan 10–11 course, edit its current
presentation and label tasks, paragraphs and chapters explicitly «К задаче …»,
«К параграфу …», «К главе …». This instruction resumes the previously paused
work and authorizes implementation, checks, commits, push and a reviewable PR.
No additional START question is needed. The owner's earlier whole-course
instructions «продолжай без остановки, делай всё облачно» and «публикуй и
продолжай» remain applicable after this explicit resumption. The separate
transfer-only restriction in PR351 is not used as permission to publish that PR.

## Current evidence and bounded continuation

Current main contains 507 cards, main exercises 1–309. Paused PR352 contains
eleven additional cards for 310–319 (311а/б), completing chapter III. Its exact
head is `fa4ca44e2f199ab47a1609c3180a4cbbb42684f7`; its earlier source, mathematical
and integration reviews remain evidence for unchanged lesson bytes, not a
verdict on the new presentation. PR351 is an overlapping six-card transfer.
Reuse the corrected PR352 content, preserving all 507 published cards and
concurrent changes already present in current main. Never recover erroneous
299–309 material from superseded PR350.

## Implementation

- Visible course bibliographic caption, chapter and paragraph references,
  per-task and per-theory references, including the catalogue and theory dialog.
- Derive references from verified source metadata; paragraph mapping is specific
  to the supplied 2024 edition. Chapter-wide additional tasks and self-check
  questions must not receive invented paragraph numbers. Historical EGE numbers
  remain explicitly historical source namespaces.
- Finish 310–319 with original models, optional help and justified retained steps.
  Target 518 cards, 1969 steps, 2050 model states and main exercises 1–319.
- Preserve lesson IDs/revisions, storage keys, written answers, camera state,
  source catalogue identity, all prior mathematics and other courses.
- Keep remaining textbook entries visibly pending. This increment does not
  complete the whole textbook.

## Review and validation

Independent source/mathematical review of the continuation and code review of
the reference presentation. Supplied source pages and the edition's contents
must be read; do not publish scans, private file identifiers or full-book text.
Paid Claude remains deferred under the parent whole-course owner decision;
no external-provider verdict or real-pupil trial is claimed.

Required checks: reproducible build, catalogue/schema, historical content,
independent mathematical oracles, model geometry, retained-work runtime,
reference tests, browser partition/collector tests, full desktop/mobile journeys,
actual new-card and representative reference screenshots, relevant shared-course
regressions and whitespace. Reconcile any failures before declaring the gate.

Historical gates freeze presentation files. This task explicitly changes only
the three presentation files. A narrowly pinned migration may prove their
original bytes and exact reviewed replacement bytes while retaining every
other historical byte assertion. Negative tests must reject unlisted or changed
replacements. Do not simply replace original baseline hashes or bypass gates.

## Release, risks and rollback

Risks: source-number ambiguity, incorrect paragraph attachment, mobile overflow,
historical numbering confusion and accidental loss of work. Explicit source
namespaces, edition-specific mappings, responsive checks and unchanged storage
contracts address them. Ordinary scoped revert rolls back this increment.

Prepare a concrete reviewed result before publication under the resumed
whole-course authorization. Recheck authoritative current main against this
task's composed base immediately before release, verify source identity and all
required checks, then verify the deployed public assets. If main moves again,
stop and apply the repository's base-drift procedure. This task does not change
access, deployment settings or learner accounts.
No force/reset/rebase, admin override or weakened protection is authorized.

## Execution

Results, exact commit identity, failures/not-run checks and final decision are
recorded in the PR and the task review report. Do not treat this specification
as a passing gate or a completed publication.
