# Creative trainer collaboration and contextual help

- Date: 2026-10-20 (Asia/Novosibirsk).
- Base: main, `6123c8e30c3b080dcbdf36242d85ccbd2f2843af`.
- Branch: `docs/creative-trainers-contextual-help`.
- Level: SMALL, documentation only.
- Owner clarification: with usable API balance, involve Claude in creative
  trainer design; help should be available beyond the beginning of a trainer.
- Scope: refine the active consultation brief with creative collaboration and
  optional progressive help for the current difficult step, preserved work and
  honest assistance history. Existing diagnostic/exam restrictions remain.
- No trainer implementation, API runner, paid calls, billing or credential
  changes. This documents the new requirement; it does not claim every existing
  trainer already provides help at every step.
- Checks: inspect exact two-file diff, validate local Markdown links,
  `git diff --check`; internal pedagogy consistency review.
- Gate: `CREATIVE_TRAINER_HELP_DOCS_OK`.
- Runtime tests and external paid review not applicable to this docs-only task.
- Risk: planned behavior could be mistaken for implemented behavior; keep that
  distinction explicit in the handoff. Rollback: normal revert.
- Standing publication permission applies; no new architectural acceptance or
  release-review exception is introduced.
