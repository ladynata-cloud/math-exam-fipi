# A clear guided proof beside its drawing

## Identity and goal

- Owner request: remake the confusing proof trainer using the clarity of the
  earlier course examples: a large drawing, one short question, one action.
- Date: 2026-10-17 (Asia/Novosibirsk).
- Base: main at `fadaa6b000afa525af64b1c04318a69f720f9f7d`.
- Branch: `fix/clear-photo-proof`.
- Review: MEDIUM, bounded presentation and interaction changes within the
  existing Path attempt contract; focused review and regression checks.

## Evidence and scope

The owner identified the ambiguous question about a second pair of sides and
an “основание”. Here AC is the common side. Earlier course references couple
each small action with its drawing, build the argument visibly, diagnose errors
and finish with the mathematical conclusion. Apply those teaching principles
within the existing account architecture, without copying private source files.

Redesign the three existing photo-proof exercises together, on the public and
managed surfaces. Keep the third-criterion exercise explicitly separate from
the first criterion. Replace the generic five-stage navigation, workshop detour
and unrelated remediation text with a single guided flow. Show short questions,
answer-linked highlighting, an accumulating proof and a final writing step.
Use a presentation adapter for previously saved task wording; retain all task
IDs, answer values/order, six step positions, state schema and grading commands.
Do not reset or rewrite existing pupil attempts. Preserve generic trainers.

## Acceptance and validation

- The common-side question names the common side directly.
- One current question and its diagram are visible together; previous facts
  remain available without repeating every question and explanation.
- Choosing an answer highlights its actual sides/angles/triangles. Direct
  diagram selection has an equivalent keyboard-accessible answer button.
- Incorrect choices explain the local mistake; no invented rewards or claims
  that a multiple-choice result independently proves mastery.
- The completed argument includes a correct criterion and vertex order.
- Old saved tasks/drafts/notes resume silently with unchanged grading values;
  read-only state never emits learner commands.
- Existing math/integration gates, focused DOM tests for the public and managed
  flows, final scope/whitespace review. No new authentication/server/storage API.
- Preview acceptance and any unrun live/phone checks are reported explicitly.

## Risk, rollback and permission

The main risk is confusing presentation with saved grading data. The adapter
reads saved choices and preserves their values; checks still use the original
task. Roll back the scoped presentation and cache changes without migrating or
deleting any data. External review is not required or claimed for this MEDIUM
task; no independent review is claimed.

The current request authorizes implementation, checks, commit, push and Draft PR.
The repository release workflow requires a separate authorization for the
reviewed PR's merge and deployment. Do not merge or deploy during preparation.

## Record

Exact head, checks, failures/not-run checks and release decision are recorded
in the task PR. Final gate: CLEAR_PHOTO_PROOF_READY.
