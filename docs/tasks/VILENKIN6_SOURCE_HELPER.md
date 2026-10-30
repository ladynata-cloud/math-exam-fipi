# Source-based helper for saved Vilenkin 6 textbook tasks

## Identity

- Owner request: publish the course update and try configuring the helper.
- Date: 2026-10-30.
- Base: PR378 reviewed local tree, commit `52c45ff36cc458a948de70ec7629abfeb7c5b205`.
- Branch: `proposal/vilenkin6-source-helper-20261030`.
- Review level: `HIGH` (saved assistance state and authenticated action contract).
- Status: isolated implementation for review; no production mutation or pupil configuration.

## Goal and scope

Provide a clearly labelled helper using the current task's course materials. A
small hint comes first; a worked step and full solution require explicit clicks.
No free-chat model, provider call, profile mapping, API credit, assistant bridge,
or PR375 dependency is introduced. The source course, answers, sequence, saved
attempt identities, and unrelated profiles remain unchanged.

The helper is available only inside a pupil's owned, editable saved
`vilenkin6-textbook` attempt. It does not open inside an assignment preview,
history, archived work, another pupil's work, diagnostic or active exam. The
server resolves the current source revision and current saved step; the browser
cannot supply mathematical content for the helper to trust.

## Persistence and reveal contract

The existing authenticated actions endpoint accepts a distinct `textbook-help`
semantic event. Normal version checks, ownership, idempotency and history apply.
Control, archive, active-exam and source-revision checks precede even duplicate
operation replay. An answer-free authenticated context read repeats these
checks after ACK, including an exam started in another tab. The same transaction saves assistance and returns bounded
source text. Unfinished work retains all drafts and steps and records help;
completed work permits post-answer solution review without changing its result.

The cabinet uses its existing mutation queue and briefly makes the trainer
read-only while saving help. It waits for ACK, re-reads the owned attempt, checks
the acknowledged trainer version and live context, and only then renders text.
Queued or rejected unsaved work blocks the helper. Changing account, source,
step, control or route, or closing the panel suppresses late answers.
Native hint/solution disclosures stay unchanged: the helper panel alone reveals
the returned content after the final access check. A finished review is recorded
in history without altering the original result or disclosure state.

## Acceptance and tests

- All 194 source tasks and their current steps project authored text only.
- Hint, worked-step and full-solution modes preserve drafts and grading rules.
- Completed independent and manual self-check results remain intact.
- Ownership, control, version, source-revision, archive and global exam guards
  reject help before content is returned; retry is idempotent.
- DOM tests verify no reveal before ACK, late-response fencing, error recovery,
  safe text/fraction rendering, and absence of provider calls.
- Existing backend, source-contract and local-helper regressions must pass.
- Synthetic desktop/mobile browser checks cover the cabinet mutation lane,
  help save/reload, read-only interval and unchanged answer field.

## Review and permissions

The parent agent authorized this isolated implementation and local commit.
Independent technical review is requested. External Claude review is not run:
no Claude tool is exposed; the preceding Vilenkin consultation failed for
insufficient provider credit and there is no evidence of changed access. This
is not a review waiver. Source mathematics and the existing teaching sequence
are reused; this proposal does not author replacement explanations.

No production merge, deployment, real-pupil configuration, paid provider call or
change to PR378 is performed here. The root agent owns subsequent publication.

## Risk and rollback

Main risks are help being shown before its assistance record is saved, a stale
step being explained, and pending input being overwritten. The transaction,
mutation queue, brief read-only interval and post-ACK context check address
these risks. Rollback first removes/disables the helper UI while retaining the
backward-compatible server handler and replay fields. Retire the handler only
after pending helper operations and older open clients have been reconciled;
otherwise an old client could misclassify a failed metadata-only request as
unsaved pupil work. No schema migration is required. Saved events retain
ordinary normalized state and `after` fields, so existing history replay and
outcome accounting remain readable.

## Execution record

- Local implementation complete; no remote branch, PR, deployment or pupil
  setting was changed by this task's implementation agent.
- Full backend regression: 358/358 tests passed.
- Affected helper/cabinet/trainer DOM regression: 57/57 passed; the subsequent
  presentation-only change passed all 9 focused widget tests.
- Real two-origin Chromium fixture: seven flows passed, zero page errors,
  zero provider requests, synthetic accounts only.
- Independent local review: PASS, no remaining findings; final widget follow-up
  passed 9/9 and confirmed the mobile condition and hint are both visible.
- CI now runs the new backend, DOM and browser checks in the Vilenkin workflow.
- External review remains outstanding; see the review section above.
- Detailed handoff: [source-helper report](../reports/VILENKIN6_SOURCE_HELPER_20261030.md).
