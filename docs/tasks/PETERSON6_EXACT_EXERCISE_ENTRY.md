# Peterson 6: exact textbook entry after equation-method publication

## Identity

- Task: PETERSON6_EXACT_EXERCISE_ENTRY.
- Owner: repository owner.
- Date: 2026-11-02 (Asia/Novosibirsk).
- Base branch: main.
- Base SHA: `5bbfe3a4615b6410dacf7f1344aa57b909a986ef`, published PR400.
- Branch: `fix/peterson6-exact-exercises-20261102`.
- Review level: MEDIUM.
- Architecture: existing source lookup, hash navigation and existing saved-work readers.
  No new archetype or change to an accepted ADR.

## Goal

Make the published equation-method examples 303 and 305 reachable directly
from the course number search, and make their prescribed choice of unknown
unambiguous while retaining all earlier work.

## Context and evidence

- The current conversation contains the owner's original Peterson equation-method
  START and a new instruction to continue after publication of PR400.
- The bounded follow-up audit found that both number searches show the generic
  p10 review-section fallback and incorrectly say that no individual solution
  exists, despite the complete examples in the separate practice line.
- The line currently ignores everything after `?` in its hash route, so an
  exercise-specific URL does not select that exercise.
- The question about choosing x accepts the smaller speed but is worded as an
  unrestricted choice. Another unknown can be mathematically valid.
- Existing condition keys include stored step labels. Presentation wording
  must therefore remain separate from the stored label and answer identity.
- Public Amvera cabinet index/app/attachment files were read without accounts
  and match the released source; no cabinet deployment defect was found.
- The actual browser journey exposed a separate interaction defect: the
  existing cabinet sandbox disallows native form submission, so source search
  and answer forms relying only on submit events never reach their handlers.
  Local click/Enter handling must call the existing validators directly while
  preserving the sandbox and preventing duplicate submission.

## Approved continuation scope

### In scope

- Correct the main-course lookup for 303 and 305 with exact links to the existing
  line examples, while keeping source-page provenance and other lookups intact.
- Validate exercise-specific hash routes against the existing module/sample
  inventory. Resume matching saved work; archive a different unfinished example
  through the existing reader/writer before opening the requested example.
- Keep URLs consistent when selecting a textbook example or new generated work.
  Reject malformed/unknown example routes without changing saved work.
- Make number search and the existing main-course/line answer forms work in
  the cabinet through direct click/Enter handling, with unchanged validators,
  composition handling and no native form navigation or permission changes.
- Clarify the smaller-speed choice in these two model families through an
  optional display label, including UI, contextual helper and HTML report.
- Preserve stored labels, answers, keys, storage schema, old-method readers,
  hints, assistance accounting and source conditions.
- Focused source-search, route, saved-work and actual browser checks; additive
  CI invocations and release-status reconciliation in this same correction.

### Out of scope

- Full-book PR367, paused parts-2/3 PR355, new textbook content or generators.
- Real pupil records, assignments, credentials, cabinet configuration or cloud credit.
- Board contracts, content versions, old-room migration or new storage formats.
- New PDF editions or changes to source maps and textbook conditions.
- Merge/deployment of this follow-up PR; PR400's release approval and external
  review exception do not automatically apply to another PR.

## Acceptance criteria

- [x] Searching 303 or 305 exposes its exact existing solution, without the
      misleading no-solution message or arithmetic-mean route as its solution.
- [x] An exact link opens the requested source condition and matching method.
- [x] Reload, backward navigation and repeated links retain accepted steps,
      drafts, hints and completed work without duplicate independent credit.
- [x] Switching between exact and generated work keeps the URL truthful and
      preserves displaced unfinished work through the existing archive.
- [x] Invalid/mismatched/duplicated route parameters do not mutate progress.
- [x] All 27 source-entry keys retain their published identity; an exported
      PR400 synthetic save remains readable without relabelling or data loss.
- [x] The unknown question specifies the smaller speed; legacy stored labels,
      option order and mathematical answers remain unchanged.
- [x] Desktop/mobile source-search-to-line journeys and helper/report labels pass.
- [x] Actual cabinet search, guided steps and final/line answers work through
      click and Enter with the existing sandbox; no duplicate credit occurs.

## Checks and gates

- Source lookup DOM checks, normal and malformed exact-route regressions,
  published-save fixture compatibility and existing line/equation tests.
- Browser source-link journey, exact303/305 selection, reload/archive/generated
  navigation, helper context and cabinet form controls at desktop/mobile widths.
- Existing affected course build/content/DOM and helper checks; no repeated
  unrelated mathematical suites unless a concrete regression requires them.
- Syntax, source identity, cache references, privacy and `git diff --check`.
- Gate: `PETERSON6_EXACT_ENTRY_LOCAL_OK` after the executed checks.

## Review plan

- MEDIUM: bounded entry navigation and display clarification using unchanged
  persistence readers, schemas, keys and mathematical models. No storage-format
  change or difficult rollback is introduced.
- Trainer consultation: not applicable to this bounded correction; no new
  trainer or substantial learning-sequence redesign.
- Independent navigation/state review and mathematical wording review.
- External review is not mandatory at this level unless requested by the owner.
  No provider verdict or inherited waiver is claimed.
- Review material contains public source and synthetic records only.

## Risk and rollback

- Main risk: a deep link could reset a draft or reopen the wrong condition.
  Test these transitions against the existing archive and saved-work validator.
- Presentation wording could change condition keys if used as stored labels;
  preserve those labels and verify previously exported synthetic records.
- Rollback is a separately authorized code revert. There is no data migration
  or learner-record deletion to reverse.

## Permissions

- The original current-task START and current continuation instruction authorize
  this bounded follow-up correction, local commits, push and one Draft PR.
- Production merge, auto-merge and deployment: not authorized for this new PR.
- Do not reuse the PR400-only release authorization or review exception.

## Execution record

- Clean base and authoritative remote main verified before branch creation.
- Actual branch/base match Identity above.
- Final local checks pass: see [verification](../reports/PETERSON6_EXACT_EXERCISE_ENTRY.md).
- Exact committed head, Draft PR and current-base composition/CI are recorded
  in the PR handoff; publication of this correction is not authorized.

## Required handoff

Use the repository EXECUTIVE STATUS fields and stop before merge.
