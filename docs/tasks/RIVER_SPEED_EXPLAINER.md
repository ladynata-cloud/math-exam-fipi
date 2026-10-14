# River speed difference: concrete explanation and river-first route

## Identity

- Date: 2026-10-14 (Asia/Novosibirsk).
- Base: main, `7397baf0ebe2b36c8263229117ae5fe44ddf2d45`.
- Branch: `feat/river-speed-explainer`.
- Review: MEDIUM; bounded supplemental browser practice and presentation order.
- Owner requested implementation in the current conversation.

## Goal and scope

Explain why downstream speed minus upstream speed equals twice the current
speed to a sixth grader, starting from concrete numbers and two equal gaps.
Place river lessons before the remaining movement topics from the supplied
formula sheet. Preserve the original twelve lessons and 144 exercises.

- Add a self-contained animated explanation with cumulative steps, controls,
  a speed number line, numerical practice and specific feedback.
- State the same boat/own speed, same steady current, own speed greater than
  current, and bank-relative speed assumptions. Distinguish speed difference
  from distance between boats and from current speed itself.
- Reorder presentation only: downstream, upstream, river speeds, round trip,
  then the eight original non-river lessons. Keep deep links and stored keys.
- Link supplemental help from river lessons; managed use records assistance
  through the existing hint event and respects read-only state.
- No new cabinet family, catalog entries, server contracts, credentials,
  storage migration or modifications of real learner results.

## Gates and rollback

Focused independent review, calculation/content checks, existing managed UI
regressions, browser CI covering public navigation and the new trainer,
unchanged canonical lesson/task bytes and whitespace/syntax validation.
Browser execution is delegated to CI; not claimed locally.
Revert the frontend files to roll back. Keep existing browser and server data.
Supplemental practice is explicitly local and does not claim cabinet credit.

## Operational context

PR #244 is merged and its Pages assets are published. At last verified check,
the restored Amvera application still used its older uploaded source snapshot.
The prepared manual update was not uploaded by the agent. That deployment and
the managed twelve-entry assignment remain pending; this task does not claim
that they are complete.

## Permissions

The direct request authorizes implementation, validation, commit, push and a
Draft PR. Separate merge authorization must identify the reviewed base/head
under AGENTS.md. No merge or deployment is performed in the PR workflow.
