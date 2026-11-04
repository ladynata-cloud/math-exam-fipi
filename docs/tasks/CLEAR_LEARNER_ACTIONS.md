# Clear learner actions and return paths

## Identity

- Date: 2026-10-21 (Asia/Novosibirsk).
- Base: main, bc392890a67ec594abed7c6a95b39402962830ec (PR282).
- Branch: fix/clear-learner-actions.
- Review: MEDIUM; bounded frontend guidance, existing equation manipulative.

## Owner direction

A learner must know what to find, what to enter and what to do next at every
input. Help needs an explicit return path. Apply this as a general authoring
principle, using task11/task19 as the visual examples. The owner has not chosen
which trainer will be offered when booking a trial lesson.

Two supplied screens identify the immediate defects:

1. Percentages: the first hint says the whole is200, while the generic input
   actually expects40% of200. The final answer and intermediate hint are unclear.
2. Equations: the instruction says to transfer terms but only presents two
   empty coefficient fields. The owner requests draggable terms whose signs
   change when moved across the equality sign.

## Scope and acceptance

- In percent-table-trainer.html, all ten generated types receive explicit
  task-specific answer instructions and units/format. Final-answer inputs must
  not appear to answer a different intermediate hint. Checkpoint labels must
  not reveal the method or answer.
- Percent help identifies intermediate steps. A return-to-answer action hides
  help without erasing the draft or reducing assistance history. Returning
  from learning resumes the same practice task and input. Provide a visible
  link to the base-course topic selection.
- In oge-task9-equations.html, reuse the existing termFlyer exact-fraction
  representation and established pointer-drag pattern. Apply the optional
  model to the actual linear canonical-step equation. Terms can be dragged,
  clicked or keyboard-activated across the equality sign; their sign flips
  exactly once per crossing and a reverse move restores it.
- The equation model preserves equivalence and term identity. It does not
  submit, fill or grade answers. Show clear next instructions for collecting
  terms and label both coefficient fields. Preserve drafts when hiding help,
  and preserve existing assistance, progress and exam behavior.
- Add the general learner-action contract to the existing teaching guidelines.
  No global DOM/regex guessing of answer meaning: each family supplies its
  semantics. Shared course/base engines have different contracts and are not
  all migrated in this patch.
- No backend, cabinet synchronization, account, question-bank or lead-magnet
  assignment changes. Claude API use remains deferred by the owner.

## Checks and release

Targeted mathematical/learner tests cover all percent answer meanings, the
40%-of200 case, repeated return/draft/assistance retention, equation equivalence,
reverse crossing, exact fractions, duplicate interaction protection and no
unearned progress. Browser checks cover drag, keyboard/touch alternatives,
clear labels, return paths, mobile and desktop. Run affected existing gates,
independent review, diff check, exact-head CI, full-tree merge identity and
published bytes/live UI verification.

The practical gate keeps its strict full-script snapshots. Only the percentage
snapshot is updated for the reviewed metadata/navigation changes; the other12
snapshots and normalization rules remain unchanged. Independent review confirms
the generators' arithmetic, checkers and statistics remain intact. Separate
behavioral checks and3500 independently recalculated percentage problems cover
the new reviewed baseline; no file is skipped or guard removed.

## Risk and rollback

Risks are confusing final versus intermediate inputs, lost drafts, pointer
interaction errors, sign mistakes and assistance-credit regression. Keep the
original generators/checkers and progress contracts; make the optional model
read-only with respect to grading. Normal frontend revert, no data migration.
Standing explicit cloud publication authorization applies. No force, rebase,
admin override, weakened tests, disabled TLS or recursive status-only release.
