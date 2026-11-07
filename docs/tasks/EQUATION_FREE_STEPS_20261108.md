# Free intermediate steps for simple linear equations

## Identity and authorization

- Owner request: 8 November 2026, MathExam / audit-inspired original work.
- Base: `main` at `ac0fdfa68f3e6a79f5b08ae2ef43c16dc138c1f8`.
- Review level: NEW_ARCHETYPE, since open-ended transformations are a new interaction/checking pattern. Draft prototype only; this document does not claim an accepted ADR or independent review.
- Permission: implement, test, create branch and Draft PR; explicit owner hold on merge and publication.

## Goal and scope

Retain the beginner operation-choice mode and add a separate mode with generated two-step linear equations, typed transformations, exact equivalence checks, understandable feedback, retained rejected/corrected entries and local restoration. Original implementation; no Brilliant code, exercises or visuals copied.

The parser accepts one real variable x, integer/finite decimal constants, parentheses, unary signs, addition, subtraction, multiplication and division by a nonzero constant; standard implicit multiplication before x or parentheses. The engine normalizes each side to a rational affine expression using BigInt. It accepts equivalent solution sets for two equations with exactly one solution. It rejects nonlinear syntax, x in a denominator, division by zero, identities and contradictions as steps from a unique-solution equation. Equivalence of entered lines does not prove the pupil used a particular operation; messages say what the written equations establish. Limits prevent excessive input/number size.

History is separate from the original course statistics and stores up to 20 tasks and 60 checked entries per task in localStorage on the current browser. A draft is retained; switching modes does not discard it. New mode neither sends personal data nor purports to sync rooms or accounts. The existing trainer is not present in `board-server/trainer-registry.js` and has no board bridge; entering it on a shared board does not establish participant synchronization. No new board protocol is introduced in this draft.

## Verification and gates

- `node tools/equations/math.test.cjs`: 16,662 exact comparisons and invalid-input cases, including zero division, changed solutions and decimals.
- `node tools/equations/dom.test.cjs`: simulated DOM tests for rejected/corrected steps, completion, reload, draft and mode.
- Original inline beginner JavaScript compared byte-for-byte with base source; unchanged.
- Download ZIP matches the standalone HTML and existing prompt. Offline browser execution needs actual browser verification.
- `node tools/equations/browser.test.cjs`: GitHub Actions run 42426898004 passed on candidate `a31c71ee783a0b8f3a06b889cf9a1a8622097a20`: 320/390/768/1280 widths, controls, persistence, a simple embedded frame and offline copy. Local Chromium could not launch. This is not a real shared-board/two-client test.
- Existing project checks failed: Public navigator visibility enforces a historical exact whole-page hash; OGE learner entrances and returns rejects the additional inline script against the recorded script snapshot. Both need a reviewed compatibility solution preserving their safeguards; do not bypass them.
- Review: self-review only; no independent technical review, no real learners, no external provider audit. No accepted or updated ADR for the new interaction. These are release blockers under the repository NEW_ARCHETYPE policy, not a claim of release readiness.

## Risks and rollback

Risk: headless Chromium checks do not establish all device/browser compatibility or live shared-room behavior. Equivalence is limited to the stated domain and parser, and error diagnosis is suggestive rather than a proof of the precise reasoning mistake. Browser storage is device-specific, shared by users of the same browser and subject to its storage policy; 20-task rotation discards older free-mode tasks. If released only after required gates and authorization, rollback the affected source and download files as one unit; old beginner stats are not migrated.

## Status

Draft only. Resolve the two existing preservation-gate failures, test the real shared board, obtain independent review and fulfill NEW_ARCHETYPE requirements before considering publication. Follow the owner's explicit merge/deployment hold.
