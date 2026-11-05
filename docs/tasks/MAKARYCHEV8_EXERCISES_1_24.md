# Макарычев 8: последовательное заполнение №1–24

## Identity and goal

- Date: 2026-11-05 (Asia/Novosibirsk).
- Owner request / START: «продолжи пожалуйста», following the request to fill missing textbook exercises.
- Base: main, `63a2676d896d62bd07f87d77f811eb8dea3d0438`.
- Branch: `feat/makarychev8-exercises-1-24`.
- Review level: MEDIUM, bounded additive content in the existing course.
- Goal: provide every part of exercises 1–24, with source-verified conditions, optional worked steps and existing number search.

## Scope and acceptance

Use the owner-supplied Makarychev et al., Algebra 8, 2024, 17th edition, printed pages 7–10 (PDF pages 8–11). Verify formulas visually as well as by text extraction. Preserve all existing task IDs, array indices, conditions and storage keys. Append missing cards through a separate content file and the existing build. Include every listed substitution, table cell, formula, proof and subpart. Limit display adjustments to keeping the expanded task menu from pushing the problem off a narrow screen. No backend, cabinet, other-course or protocol change.

## Checks and review

Run existing content/model/state/DOM/import gates, a separate mathematical oracle and exact coverage checks for 1–24, and Chromium journeys at 320/390/768/1280 px with saved-work and search checks. Review each condition against the supplied pages, denominator exclusions and equality cases separately from canonical-answer acceptance. Run syntax, deterministic bundle and diff checks. External provider review and real-pupil trials are not performed; no such approval is claimed. Final marker: MAKARYCHEV8_EXERCISES_1_24_OK.

## Risk and rollback

Main risks: transcription, omitted subparts, overly narrow symbolic input, long-menu layout. Explicit answer formats and aliases remain the existing contract, not arbitrary symbolic equivalence. Revert this additive patch if needed; preserve existing task IDs, local storage and notebooks. The source PDF, rendered pages and extracted text are not committed.

## Permissions

Implementation, branch, commits, push and PR are authorized by the current request. Publication after applicable checks is authorized by [the standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). No additional external review or per-PR confirmation is required. Revalidate authoritative main/head immediately before merge, and verify deployment and public assets afterward.
