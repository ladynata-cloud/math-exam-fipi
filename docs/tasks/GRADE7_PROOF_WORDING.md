# Grade 7 proof-support wording

## Identity and approved scope
- Owner: current grade-7 geometry validation/editing request.
- Date: 2026-11-04, Asia/Novosibirsk.
- Base: main, f947793e0dce372932e3d6981ceaabb8bd4e8f24 (PR430).
- Branch: fix/geometry7-proof-wording-20261104.
- Review: SMALL, one shared explanatory sentence plus task/status records.
- No ADR or trainer-architecture change. Standing owner publication permission applies.

## Evidence and outcome
Published visual acceptance found incorrect agreement in the common proof-support paragraph. Replace that sentence with clear Russian: «Каждое равенство нужно обосновать». Preserve the mathematical warning about relying on appearance. Control slots, actions, snapshot schemas, models and pupil work stay unchanged.

## Acceptance and checks
- The proof and parallel-line support displays the corrected sentence.
- Construction-specific guidance, control structure and serialized work are unchanged.
- Required: syntax and diff checks, existing grade-7 adapter tests, applicable CI, exact merge identity, Pages and published acceptance.
- Existing PR430: all 26 exact-head workflows passed. Pages41744965842 passed for f947793. Published acceptance41744966414 passed: 86 exact assets, registry/cabinet identity, all 70 native activities, 65 deep checkpoints and all three wrappers in a fresh anonymous room with both roles reconnecting. Artifact13283571924 retains evidence. An additional teacher/pupil proof step matched and survived pupil reload in manual public inspection.
- Local correction checks: JavaScript syntax, whitespace and five existing adapter/coverage tests pass (619 textbook cards and 134 managed topics retained).
- No additional tests are added for this copy correction. External provider review and physical-device/real-pupil trials are not performed.

## Risk and rollback
Text only; no data migration or compatibility change. If needed, revert this scoped correction through an ordinary PR. No forced history operations or gate weakening.

## Execution and release record
Exact head, applicable checks, fresh main/head guard, actual merge identity and public asset checks are recorded in the PR. No further owner authorization is needed for this correction within the requested editing scope.
