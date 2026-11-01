# Three numeric-notation improvements for the mathematics assistant

## Identity and approved goal

- Task: MATHEXAM_ASSISTANT_NUMERIC_NOTATION_20261102
- Owner: MathExam repository owner; date: 2026-11-02 Asia/Novosibirsk.
- Base: main, `d6773b40fab15d3f7b148bcf512fef8d8cee01b3` (released PR403).
- Branch: `fix/assistant-question-boundaries-20261102`.
- Review: MEDIUM; accepted ADR0011, existing bounded deterministic mathematics.
- Current instruction: continue, then explicitly “выполни пожалуйста три полезных
  улучшения”. This authorizes the following coherent numeric-notation package.

## Evidence and scope

Three related improvements, one shared input/output correctness task:

1. Interpret proper mixed-number operands in standalone fraction addition and
   subtraction, including negative values and whole-number operands. Preserve
   operand boundaries and explain conversion only within the existing hints /
   explicit full explanation. Reproduced defect: `1 1/2 + 1/2` was silently
   changed to `11/2 + 1/2` and the incorrect answer 6 was praised.
2. Do not join separated digits in linear equations. Reproduced defect:
   `1 2x + 5 = 29` was silently read as `12x + 5 = 29`. Ask for unambiguous
   notation without judging the attempted answer; keep valid spaced operators.
3. Check repeating-decimal answers exactly in both standalone and cabinet
   feedback, including `0,(3)`, `0,1(6)`, signs and repeating nines. Cabinet
   explanations already produce this notation but their answer parser rejects it.

Bounds remain explicit: fraction-question components <=10000; answer whole part
<=12 digits and combined repeating/nonrepeating decimal tail <=64 digits, within
the existing 400-character attempt limit. Ordinary finite decimals retain their
six-place limit. No arbitrary expression evaluation or floating-point equality.

No new trainer, interaction redesign, model/provider activation, API/auth/storage
change, curriculum content edit, data migration or real learner access. Cabinet
question grammars are unchanged. PR399 is separate. Reconcile verified PR403
production evidence in PROJECT_STATUS within this product task.

## Acceptance, verification and review

- Mixed-number expressions use the original values; malformed / ambiguous
  expressions never receive deterministic correctness claims.
- Independent signed rational oracles cover addition/subtraction and periodic
  notation; existing ordinary fractions and equations remain compatible.
- All five hint levels, simpler wording and <=5 full steps retain learner control.
- Real local HTTP and browser journeys verify actual results, retained input,
  correction/resubmission, and 320/390/1280px layout without paid calls.
- Full service suite, both source gates, syntax/whitespace/scope review,
  exact local/remote publication identity and exact-head CI.
- Gate: MATHEXAM_ASSISTANT_NUMERIC_NOTATION_PREPARED_OK.
- MEDIUM focused code/math review; external review not required or claimed.
  This extends bounded notation in existing solvers, not a new trainer or
  substantial learning-sequence redesign. Synthetic tests do not prove learning
  gains. Only public code and synthetic fixtures may appear in handoff.
- Record passed, failed and not-run checks separately in the report and PR.

## Risk, rollback and permissions

Risks: negative mixed-number semantics, loss of token boundaries, periodic-tail
formula/bounds, and unintended solver coverage expansion. Anchored grammars,
integer arithmetic and negative controls cover these. Rollback is a normal
scoped revert; data and budget ledgers are preserved.

The current direct instruction authorizes scoped branch work, implementation,
tests, commits, push and a Draft PR. The owner subsequently explicitly requested
all ten listed assistant improvements, granted all publication permissions for
that package and declined external review. This is a current-package exception
to repeated per-PR exact-SHA release confirmations, not a global workflow change
or an external-review verdict. After exact final checks, ordinary squash-merge
and deployment of this package are authorized. Revalidate concurrent changes;
stop for a failed gate or unresolved conflict. No force/reset/rebase/admin/TLS
bypass, paid model activation or real-learner data change is authorized.
