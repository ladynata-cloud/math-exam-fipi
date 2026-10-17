# Photo proofs: assemble the steps without a writing screen

## Identity and goal

- Owner request, 2026-10-17: nothing needs to be written; only assemble steps.
- Base: `main` at `dd386d069d6911be6e6d23948149fd78d245f2e3` (released PR 254).
- Branch: `fix/photo-proof-steps-only`.
- Review: SMALL, an isolated presentation removal within the existing adapter.
- Accepted architecture: ADR 0010; immutable tasks and continuous saved attempts.

Remove the final free-text writing screen from the three photo proofs. The
six choices assemble the argument and lead directly to the completed proof.
The owner's screenshot identifies the redundant writing field and instruction.

## Scope and acceptance

- Remove the writing action, field and instruction on both managed and public
  photo proofs; preserve the six question/choice steps and their grading.
- A saved completed attempt on the former writing screen shows its assembled
  proof. An unfinished one can continue its existing steps.
- Preserve existing saved notes, answers, task identities and schema. Do not
  migrate, reset, or send commands merely to render the new presentation.
- Keep teacher observers read-only and unrelated trainers unchanged.
- Refresh the adapter cache references and reconcile the preceding release in
  PROJECT_STATUS. No account, server, authorization or deployment changes.

## Checks and review

Run the existing focused DOM/state suite with updated completion expectations,
including former writing screens in public, managed and observer modes. Cloud
browser coverage checks completed layouts at 320, 390 and 1280px alongside the
existing step layouts. Run syntax and whitespace checks; inspect the scoped
diff and cloud results. External and independent review are neither required
nor claimed. Final gate: PHOTO_PROOF_STEPS_ONLY_READY.

## Risk, rollback and permissions

The compatibility risk is a learner saved at the removed screen. Render that
state without changing persisted values; keep old notes intact. Rollback the
presentation/cache patch without data migration. The current request authorizes
implementation, focused checks, commit, push and a Draft PR. Separate explicit
authorization remains required for the reviewed PR's merge and deployment.
Record exact head, checks, failures and not-run checks in the PR.
