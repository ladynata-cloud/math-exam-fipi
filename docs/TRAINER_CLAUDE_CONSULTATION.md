# Claude consultation for MathExam trainers

Owner decision: 2026-10-20 (Asia/Novosibirsk). Discuss the learning design with
Claude before development and review the ready result with Claude afterwards.
This is an active workflow under [AGENTS.md](../AGENTS.md) and
[REVIEW_POLICY.md](REVIEW_POLICY.md), not a replacement for their gates.

## When to consult

Use this workflow for a new trainer, a new interaction pattern, or substantial
changes to the sequence of learning steps, hints, diagnosis, or feedback.
Typographical corrections and mechanical styling changes do not require a paid
consultation. Group related design questions into one focused discussion; do
not send the entire repository or make a paid call on every commit.

## Before implementation

Prepare a small, sanitized brief containing:

- what the learner should understand and do independently afterwards;
- prerequisite skills and typical errors, using fictional examples without
  pupil identities or private learning records;
- the proposed sequence of screens, actions, hints, and error feedback;
- relevant public examples from existing trainers and the constraints below;
- specific unresolved questions, including competing designs where useful.

Ask Claude to identify missing prerequisites, oversized steps, opportunities
for guessing, misleading diagrams, and places where an interaction would teach
more effectively than text. Request a concrete alternative and one illustrative
task, rather than a general verdict. Verify its mathematics and assumptions.
Record which suggestions were accepted, adapted, or rejected and why.

Suggested focused request:

> The goal is [skill], and the learner commonly struggles with [errors]. Here
> is the proposed sequence and the relevant public example. Where will this
> learner get stuck? Suggest the smallest useful steps, a drawing or interactive
> model, and feedback for one typical error. Explain what the learner must do
> rather than merely read. Separate established facts from hypotheses that
> need testing with a learner. Use the MathExam teaching constraints below.

## Teaching constraints to include in the brief

- Start with the task. Keep the screen calm, with large readable graphics,
  generous spacing, and green primary actions. Collapse secondary settings and
  results. Use the established task11/task19 style when relevant.
- After the condition, offer “Хочешь подсказку?”. Its drawing, interactive
  model, or step should help the learner reason about the current task.
- Preserve entered answers and completed steps. Once a digit has been chosen,
  immediately write it in its place in the calculation.
- Use familiar school language, including “в уме” for carrying in the relevant
  arithmetic step and “Какую цифру напишем крайней справа?” where appropriate.
  Use “равные треугольники”, not “конгруэнтные”.
- Render ordinary fractions with a horizontal fraction bar, including fractions
  inside explanations and trigonometric ratios.
- Diagnose specific missing skills and recommend where to begin; allow repeat
  diagnosis after practice. Keep diagnostic/exam assistance rules intact.
- Provide understanding through action, diagrams, explanations and
  counterexamples. Avoid an exercise becoming memorization or repeated guessing.
- Distinguish demonstrated ability with help from independent success. Closing
  a hint must not erase the fact that it was used.

## Review the ready result

Supply the relevant implementation, representative screenshots or observed
interaction evidence where available, and the actual test results. Explicitly
state what the reviewer has and has not inspected.

Ask for two separate assessments:

1. Verification: mathematical correctness, answer checking, step order, hint
   behavior, input retention, progress accounting, and regressions.
2. Validation: whether the activities support the stated learning goal, the
   explanation and model reveal the relevant relationship, the step size is
   appropriate, and a learner could succeed by guessing without understanding.

Request reproducible findings tied to an example or screen. Reconcile them
with code, independent calculations, tests and observed behavior. A model's
opinion does not establish learning gains: label conclusions that still need
testing with actual pupils. Synthetic learner robots are not a real pupil pilot.

## Evidence, access, and cost

For a design discussion record the question/scope, supplied materials,
provider/model, date and verifiable response source, findings and resulting
decisions. A PR need not exist yet. For a release verdict also record the exact
PR, base SHA, head SHA and verdict required by the review policy. Never reuse a
design response or an old-head approval as the final review.

Use an authorized API integration with credentials held in its secret store.
Do not put credentials in chat, source, public pages or logs. Send only public
or specifically authorized, minimized material. Keep consultations bounded to
the concrete task and record token usage when the provider returns it. Do not
change billing, buy credits, or increase spending limits under this workflow.

If access, balance, or a provider failure prevents a response, record it as
unavailable/not completed, report the concrete reason, and stop automatic
retries for that condition. An unavailable consultation is not advice or
approval. Continue useful preparation and technical checks within the approved
scope; follow the existing review policy for any required release exception.
An exception for one earlier release does not become a standing waiver.

## Current integration boundary

`tools/oge-course-external-review.py` and its GitHub Actions job perform a
scoped review of the completed OGE patch. They are not a general design-chat
tool. This document records the agreed workflow and brief; it does not claim
that a new consultation tool was implemented or that an API call occurred.
