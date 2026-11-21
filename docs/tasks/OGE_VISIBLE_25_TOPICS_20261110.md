# Все 25 тем на входах ОГЭ

## Identity and authorization

- Owner: Наталья; date: 2026-11-10, Asia/Novosibirsk.
- START: «все таки здесь должны быть выложены все 25 тем».
- Base branch: main; base SHA: `049eeb943bc3df5e43dd4d643d76f3c3003d568e`.
- Branch: `fix/oge-visible-25-topics-20261110`; review level: MEDIUM.
- Release: [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md).
  Branch, commits, push, Draft PR and checked publication are authorized.

## Goal, evidence and scope

Show all 25 OGE numbers as ordinary visible links on `/oge/` and at the start
of `/trainers/oge-course/`. The landing previously featured four topic cards;
its 25 orbit controls required disclosure. The course covered 1–25 but grouped
1–5 into one card and placed the detailed list after learning lines.

The existing `assets/oge-home-topics.js` supplies the canonical titles and
destinations. Numbers 1–5 intentionally share the practical-story selector;
the interface explains this and does not assign a fixed story to any number.
The existing learning lines, progress, model controls, exercise banks, checking
logic, storage and board contracts remain outside this navigation-only change.

The exact browser tab was unavailable, so both established OGE entries are
covered. Root-site course promotion is handled separately by PR #521. PR #502
also changes both OGE entry pages; future composition must preserve this list.
Current production is not claimed to contain these changes before deployment
and public-byte verification. Historical PROJECT_STATUS entries are not used
as evidence of this release.

## Acceptance and gates

- Exactly 25 ordered entries, canonical names and working routes on both pages.
- No menu, accordion, JavaScript or graphics dependency for the full list.
- Mobile and desktop layout, keyboard reachability and graphics fallbacks.
- Existing course continuation, progress and model navigation still work.
- Focused independent technical review; browser `tools/oge-home.browser.cjs`,
  `tools/oge-home-orbits.test.cjs`, course-map and course-guide tests,
  SEO/sitemap/lesson-route checks, public navigator binding checks, diff check.
- Applicable GitHub workflows must pass before merge. Confirm authoritative
  main/head immediately before merge, then verify merge tree/parent and Pages.

## Risk and rollback

The recoverable risk is layout or route regression. Revert this task's commit
with a normal reviewed revert if necessary; no learner data migration or
deletion is involved. No new trainer design or mathematical material is added.
External provider review and real-pupil testing are not performed.

## Execution record

Exact source and final revisions, review evidence, checks and release status
are recorded in the PR. The navigator receipt identifies only the committed
HTML source; it does not substitute for review or successful publication.

EXECUTIVE STATUS

Task: Все 25 тем на двух входах ОГЭ.
Base: 049eeb943bc3df5e43dd4d643d76f3c3003d568e.
Gate: local verification and GitHub checks required; results in PR.
Not run: external provider audit; real-pupil pilot.
Scope deviations: none; both OGE entries covered as stated.
Recommendation: publish after applicable checks and exact-base/head verification.
Next user decision: none required under standing authorization.
