# MathExam task specification

## Identity

- Task: OGE_BASICS_FRACTION_CONTROLS_20261114
- Owner: MathExam owner
- Date: 2026-11-14 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Planned branch: `fix/fraction-learning-controls-20261114`
- Review level: `MEDIUM`
- Related issue or ADR: none; existing basic-trainer rendering and saved-task contracts are retained.

## Goal

Make fraction answer buttons visibly respond, explain numerator and denominator
with the owner's wording, and make empty or keyboard answers usable without
changing existing saved task identities or credit rules.

## Context and evidence

- The owner requested completion of unfinished trainers and identified unclear
  fraction wording and buttons that appeared unresponsive.
- In `basics-standalone.css`, the later `.basics-task-first .choice` rule has
  the same specificity as native `.choice.selected`, `.choice.correct` and
  `.choice.wrong` rules. It overrides their background and border. Before this
  correction, selecting an answer retains the same computed white background
  and pale border despite the `selected` class and working click handler.
- The generated `learning-bank.js` is used to reconstruct saved cabinet tasks.
  Replacing its old text would change canonical task JSON and reject saved
  attempts. Wording therefore changes only at rendering boundaries.
- Existing task-first navigation, help accounting and answer storage remain in
  place. Production reconciliation is coordinated in the parent completion task.

## Approved scope

### In scope

- Explicit visible choice states in the existing shared basics stylesheet.
- Fraction wording in public and cabinet rendering, preserving canonical source
  payloads, IDs, seeds, answers and generator versions.
- Fraction empty-answer feedback and Enter handling, preserving attempt and
  assistance accounting.
- Focused regression tests and real-browser scenarios for clicks, keyboard,
  wrong/correct states, navigation, stored progress and restored cabinet state.

### Out of scope

- New content banks, a new trainer archetype, shared storage migrations or new
  cloud synchronization.
- Other course content, server contracts, authentication, deployment and merges.
- A claim that real learner outcomes or all reported browser failures are proven
  resolved before the real-browser gate has run.

### Files or areas that must not change

- The generated teaching bank, server-side canonical generators and saved-task
  validation contracts.
- `PROJECT_STATUS.md` (parent task coordinates its reconciliation).

## Acceptance criteria

- [x] A chosen answer is visually distinct and carries an accessible pressed state.
- [x] Wrong and correct answers remain visually distinct after shared CSS loads.
- [x] The fraction lesson states that the denominator shows into how many equal
      parts the whole was divided and the numerator shows how many were taken.
- [x] Empty submissions explain the next action without consuming an attempt.
- [x] Enter checks fraction practice and checkpoint inputs once.
- [x] Previous lesson completion and best score survive reload; cabinet task
      payloads and restored attempts remain identical.
- [ ] Applicable gates pass and unavailable browser verification is stated.

## Checks and gates

- Required tests: fraction controls/presentation regression; all shared standalone
  and managed-help regressions; canonical bank, quality and checkpoint gates;
  contextual browser suite including fraction controls at 320/360/1280 pixels.
- Required static checks: bank regeneration check and `git diff --check`.
- Manual checks: examine browser screenshots after the CI browser gate runs.
- Final gate marker: `OGE_BASICS_FRACTION_CONTROLS_OK`.
- Checks intentionally not run: real pupil pilot and production behavior of
  unpublished changes. Local Chromium is blocked by an environment socket error;
  CI browser verification remains required and is not represented as a local pass.

## Review plan

- Rationale: bounded existing interface behavior and wording; no stored schema or
  canonical task change.
- Trainer design consultation: no new teaching pattern; the wording follows the
  owner's concrete correction. External provider consultation not performed.
- Ready-result review: independent code/interaction review coordinated by parent,
  exact task JSON preservation, error/retry behavior and browser evidence.
- Sanitized handoff: repository-relative files and synthetic attempts only.
- External review provenance, if performed: provider, PR, base, head, verdict and
  verifiable timestamp; no provider approval is claimed here.

## Risk and rollback

- Main risk: shared CSS could obscure wrong/correct state or keyboard behavior
  could double-submit. Focused regressions cover both.
- Rollback: ordinary reviewed revert of this task's commit; no migration or
  learner data deletion is required.
- Compatibility: original canonical bank and local progress keys are unchanged.

## Permissions

- Current task start: the owner's direct request to finish unfinished trainers
  autonomously on 2026-11-14 authorizes this bounded implementation.
- Branch, local commits, push and Draft PR: allowed.
- Merge, auto-merge and deployment: **not allowed in this task**. The explicit
  repository rules supplied by the owner in this conversation take precedence
  over the older standing-publication document.

## Execution record

- Actual branch: `fix/fraction-learning-controls-20261114`
- Actual base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Exact committed head and PR: recorded in the handoff.
- Tests passed: 42 contextual DOM regressions (including 7 focused fraction
  scenarios), 15 scaffolds, 3 generation compatibility, 4 percentage contextual
  preservation, 15 Python consultation-harness tests; canonical bank extraction,
  mathematical quality (2000 division tasks / 5142 actions), checkpoint and
  pre-OGE arithmetic gates; `git diff --check`.
- Navigator source binding: refreshed only `fraction-meaning.html` with the
  canonical binding tool against published source commit
  `7a876fa9b80f22df458348d5460fdd940dc8cac3`; five binding-tool regressions pass.
  This receipt records source identity, not release approval.
- Canonical compatibility evidence: 128 pre-change fraction task/state envelopes
  and their question identities retain their recorded SHA-256 fingerprints.
- Browser gate: 320/360/1280 click, hit-target, keyboard, empty-answer, lesson
  progression and reload scenarios added; CI must run them and supply screenshots.
- Tests failed: none yet; local browser launch unavailable as described above.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
