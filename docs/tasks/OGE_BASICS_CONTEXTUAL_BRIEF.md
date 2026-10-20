# Design question: task-first basic OGE preparation with nested help

The owner explicitly requests rebuilding the existing Russian basic OGE course:
start with the task, put a short “Нужна помощь?” control nearby, and allow a
deep chain of help for missing prerequisites. The main OGE course already uses
a calm task-first layout. This is an authorized redesign of the basics course.

## Observed existing structure

The canonical course is /trainers/oge-basics/, with70 HTML routes:35 original
teaching pages,26 modern multiplication/division course wrappers,3 hubs,2 maps
and4 specialist pages. Original pages have a home/learn/practice/check layout;
returning to practice often regenerates the question. With ?learning=1, the
cabinet uses the shared learning-managed.js instead. The modern public wrappers
also use this renderer through a local adapter. Its existing task contract
preserves answer drafts, accepted steps and assistance provenance.

Existing content covers arithmetic, negative numbers, fractions, decimals,
rounding, units, percentages and prerequisite multiplication/division. Existing
step scaffolds can render explanations from the current mathematical task.
There is no general nested prerequisite-help stack. Some support links open a
different tab. Canonical generators and answer validation should be preserved.

## Proposed behavior to assess

1. Show one actual practice task immediately. Place “Нужна помощь?” beside it.
   Keep topic choice, results and notes collapsed; do not auto-start an exam.
2. Open an optional contextual hint in the same screen, derived from the current
   task/step. Keep the original problem and entered work. Reveal a drawing or
   model and a smaller practice action only when needed.
3. Allow a chain of prerequisite activities without a fixed shallow UI limit,
   e.g. percentage → division → one-digit quotient → multiplication → addition.
   Each node is a concrete small task with optional deeper help. Show a clear
   back/return action. Keep parent inputs, accepted actions and hint history.
4. Use a shared presentation-only stack; avoid changing saved task schemas,
   generation versions or server contracts. Child practice must not count as
   success on the main task. Keep existing diagnostic and exam no-help rules.
5. Leave external supplemental courses linked; preserve all70 canonical routes.

## Questions for creative pedagogical consultation

- Which aspects of this design would confuse a struggling learner?
- Propose two concrete useful visual/interactive models for percentages and
  long division, with example tasks and feedback that teaches rather than guesses.
- Suggest a small prerequisite graph that can go at least four useful levels
  deep without cycles or gratuitous branching. How should return work?
- What evidence should our synthetic pupil tests check, and which conclusions
  still require real pupils?

You see only this public brief and the provided teaching principles, not the
live site. Respond in Russian with concrete recommendations and limitations.
This consultation is design advice, not release approval. Do not provide a
generic approval verdict or claim tests were run.
