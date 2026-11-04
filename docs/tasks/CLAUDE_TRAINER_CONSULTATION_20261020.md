# Claude trainer consultation workflow

## Identity and authorization

- Date: 2026-10-20 (Asia/Novosibirsk).
- Base: main, `e1f008f2745b9ff6228f4b9fe97e3bb5ebf4048f`.
- Branch: `docs/claude-trainer-consultation`.
- Review level: SMALL, documentation only.
- Owner explicitly agreed to consulting Claude before trainer design and
  reviewing the completed result. Standing publication authorization applies.

## Approved scope

Record the two-stage consultation workflow in the active repository rules,
review policy and task template; include the owner's pedagogical constraints,
sanitized evidence, honest unavailable status, and proportionate use for
substantial trainer work. Reconcile the preceding course release in project
status using verified production evidence.

No runtime, API runner, secrets, billing, deployment configuration, student
records or trainer content changes. No paid request in this documentation task.
Existing review levels, source-of-truth order and release gates remain intact.

## Acceptance and checks

- Active instructions and task template link to the consultation brief.
- Design consultation and exact-head release review remain distinct.
- Failed API calls cannot be presented as completed reviews or approvals.
- Mechanical fixes do not trigger mandatory paid consultation.
- Validate changed Markdown links and inspect the full diff.
- Required gate: `git diff --check`; final marker
  `CLAUDE_TRAINER_CONSULTATION_DOCS_OK`.
- Runtime tests and paid external review are not applicable to this SMALL
  documentation change. Independent internal review checks policy consistency.

## Risk and rollback

Risk: future agents might confuse a planned consultation with an actual review.
Mitigation: separate records, explicit provider evidence and the current
integration boundary. Rollback is a normal revert of this documentation change.
