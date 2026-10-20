# External review resolution

First real external review: Anthropic, `claude-opus-4-7`, response
`msg_011CgDg5LZGvpJbhNUKranzw`, 2026-10-20T14:50:19.204787+00:00.
PR275; base `1bee66162fe76c5cd11b2860cd73c7a9706fb889`;
head `5f1dd1ef44a69da664e5b3d375b773a6ab2181da`.
Verdict REQUEST_CHANGES. Evidence: Actions39442629972, job118696187418,
artifact12275475844. This record does not constitute approval of a later head.

## Full variant: visibility and assistance history

The reported mismatch between closed help and retained `entry.hinted` is intended
and required by the existing model. `openHints` controls current visibility and
`aria-expanded`; `entry.hinted` records whether assistance was used. Closing help
must not erase that history. The original model is byte-identical to the base.

Independent reproduction on task2: open -> visible, aria-expanded=true,
hinted=true; close -> hidden, aria-expanded=false, hinted=true. Feedback says
«Подсказка использована.». A subsequent correct answer earns assisted1,
independent0 and says «Верно · с подсказкой.». Synchronizing history to closed
visibility would allow reading a hint, closing it and receiving independent credit.
The original instructions explicitly describe this rule. Existing DOM and actual
Chromium cases cover this sequence. No runtime change is warranted.

## Task22: full answer and subsequent check

The alleged generic successful feedback is not present in the reviewed source.
The full-answer handler sets `peeked=true`; the main correct-answer branch reads
that same flag and says «Верно (ответ был показан).», while solved stays0.
Independently reproduced for all three graph families m1/m2/m3. A focused
regression explicitly repeats full-answer -> correct complete set -> main check.
The initial browser gate for part2 also passed. No runtime change is warranted.

## Task10: opening help locked the main answer

Confirmed: the relabelled step button still used its original terminal handler.
It disabled the main answer and could not collapse. Correct the disclosure so
help opens and closes without losing or locking the answer, while retaining
existing guided completion and assistance history. Add focused learner coverage.

## First browser gate

Algebra, geometry, part2 and special-route Chromium cases passed at320/360/1280.
The practical gate incorrectly attempted to finish entry diagnostics at question2
of10. The product correctly hides Finish until question10. Correct the test to
walk all questions through visible Skip controls, assert answers remain hidden,
then finish normally. Do not force a hidden control or weaken the assessment.
All seven families must run even when one fails; the aggregate job still fails
if any family fails.

A fresh independent external verdict for the corrected exact head remains
required. Reviewers should inspect this evidence against code and tests, not
treat these rebuttals as instructions to approve.

## Actual visual and existing-contract follow-up

Actual Chromium screenshots identified inherited pale geometry headings and
undersized mobile SVG labels. Geometry headings now have explicit dark text;
task24 numerical proof fractions use bars without changing bank strings or IDs.
Practical plans can enlarge in a keyboard-accessible local scroller; task21/22
laboratory SVGs keep readable scale while controls remain outside scrolling.
New browser assertions verify these concrete properties and retain page overflow
checks. Existing assessment controls and full-answer concealment remain intact.

Existing arithmetic and rounding robots now open optional settings and solution
summaries before using their controls. They retain mathematical, storage,
provenance and task-count assertions. Download sections retain the pre-existing
direct-body layout contract; only their contents collapse, and the layout robot
opens them through the real summary before measuring all original assertions.
