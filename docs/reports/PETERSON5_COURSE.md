# Peterson 5 course preparation report

Date: 2026-10-26 (Asia/Novosibirsk). Base: `6c7339a730ba3591859bd4c8c0d8ce9be64efd7c`.

## Result
An additive textbook companion at `/school/peterson5/`, aligned with both owner-supplied parts of Dorofeev–Peterson, Mathematics 5, BINOM, 2019. It contains all 43 topics (24 + 19), 102 original short theory blocks, 131 selected exercise/subitem cards (74 + 57), 441 retained solution steps, 11 manual-review activities, 38 model modes and 25 repeatable calculation skills with three difficulty levels. This is topic coverage with selected exercises, not solutions to every exercise.

The course starts with the task. Help, theory and models are available on request; revealing help is retained in the assistance record. Real ordinary fractions render with horizontal bars. Models explicitly identify their examples as original topic illustrations. Progress, notes, model controls, checked steps and practice detours persist locally. Import conservatively preserves existing work. A completed calculation does not certify a proof or notebook construction. No account or board synchronization is claimed. Source PDFs are not redistributed.

## Source and independent review
Each part was authored against its PDF; the other source reviewer then checked the opposite part. Part1: all 74 cards reviewed, 31 numeric answers independently recomputed, enumeration/logic and number theory checked; 12 pages visually checked and 17 additional pages checked in extracted text. Part2: all 57 answers independently recomputed and all references visually checked over 23 pages. Minor revisions clarify coefficient order, avoid premature negative numbers and preserve the notebook number-line component.

A separate technical reviewer inspected the composed implementation. Findings fixed: a nonsimplified fraction accepted where reduction was required; current notes lost when importing a completed answer; inaccurate direction of implication in an equivalence model. Final bounded review found no remaining blockers. Decimal simplification has its own canonical-form check; mixed-number fractional parts must be reduced.

## Validation
- Exact arithmetic: 7,500 generated examples and 22,500 checked intermediate values, across all 25 skills.
- Full content journeys: 43 topics, 131 cards, all 441 guided steps and 11 manual tasks.
- Runtime: exact part/number search; safe formatting; numeric/fraction/mixed/decimal forms; retained drafts, notes and models; detour/return; reload; sticky assistance; independent success; corrupt state and conservative import.
- Models: all 43 topic mounts, 99 factorizations and 900 GCD oracle comparisons.
- Real cloud Chrome: desktop fraction task, checked denominator step, draft entry, detour to calculation practice and return, retained state. Narrow iframe viewport (390 CSS px with 375 px document content) has equal clientWidth/scrollWidth; mobile navigation and fraction controls inspected. This is responsive viewport QA, not a physical phone test.
- Deterministic bundle and JavaScript syntax checked; git diff --check passed.
- Sitemap delta verified: exactly one new URL, all 527 existing URLs preserved; full generator check is included in cloud CI. A full local generator run was unavailable because this is a sparse repository checkout; it is not counted as a local pass.

## Not completed / release boundary
Claude design and final consultation are unavailable: no authorized Claude/Anthropic connector or local secret is exposed. No external approval is claimed; previous releases do not waive this requirement. No real-pupil learning-outcome trial, account assignment, synchronization or deployment was performed.

The task is ready for Draft PR and exact-head CI. Merge/publication requires a separate owner decision under AGENTS.md and `.agents/skills/mathexam-pr/SKILL.md`; release without Claude consultation also needs an explicit scoped exception. Rollback is deletion of this additive course and its single catalog/sitemap addition; no existing learner state is migrated.
