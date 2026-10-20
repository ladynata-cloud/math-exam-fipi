# Land identification lab: outdoor context

- Owner: MathExam owner; cloud implementation and publication already authorized.
- Review level: MEDIUM, bounded correction of an existing optional model.
- Base: main `647141dd168284ac1a399f0fdca8e7b6c82ba72b`.
- Branch: `fix/land-identification-lab`.
- Architecture: accepted ADR 0003, existing practical-discovery model pattern.

## Problem and scope

The published land-matching task opens a generic indoor map with an entrance,
corridor and room. Those objects do not support identifying a garden or greenhouse
on the outdoor plan. Post-publication checks confirmed the current deployed bytes.

Route only land matching to an outdoor example: large garden rectangle A contains
a narrow greenhouse rectangle B; separate building C is outside A. The learner
chooses a letter for the garden, then the greenhouse. Wrong choices explain the
containment clue without advancing. Correct choices highlight the selected shapes.
Reset restores the first question; closing and reopening help retains the stage.
The letters are independent of the actual task's numbers.

Keep all original engines, answers, IDs, grading, drafts and progress contracts
unchanged. Apartment and road map models retain their existing behavior. Rebuild
only the OGE 1–5 folder package. No new bank, platform, dragging or backend work.

## Verification and release

- Extend the existing focused land regression: B is strictly inside A, C is
  outside; incorrect C does not advance; A then B completes only the example;
  reset and close/reopen work; the main draft and score storage remain untouched.
- Existing frozen-engine and 47 Node tests, 33-page link gate, syntax and diff checks.
- Existing cloud browser gate: 126 discovery cases and 39 retained route cases.
  Exercise the land-specific buttons and inspect one focused mobile PNG.
- Independent source and focused artifact review by a separate agent. Paid Claude
  API consultation remains deferred by the owner's explicit instruction.
- Normal Draft PR and guarded release; no force, reset, rebase or weakened gates.

Risk: a confusing or misleading containment diagram. Rectangular coordinates,
visible gaps and focused interaction checks address it. Rollback is an ordinary
revert of this scoped helper/package change; there is no data migration.

The previous release PR288 is published as the base above, Pages39514050862
succeeded, and all 18 expected public file hashes matched. This task repairs the
context mismatch found by the required live smoke check; it does not claim that
the prior release's context was already correct.
