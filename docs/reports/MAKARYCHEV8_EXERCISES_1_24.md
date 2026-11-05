# Макарычев 8: проверка продолжения №1–24

Date: 2026-11-05 (Asia/Novosibirsk). Review: MEDIUM.
Task: [MAKARYCHEV8_EXERCISES_1_24](../tasks/MAKARYCHEV8_EXERCISES_1_24.md).
Base: `63a2676d896d62bd07f87d77f811eb8dea3d0438`.
Release authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Result and source review

93 appended cards / 223 steps complete every part of exercises 1–24, together
with the existing №3 at y=3 and №4а. The first topic now has 95 textbook cards
and four original authored exercises. Whole course: 51 topics, 399 tasks,
195 textbook cards, 204 authored exercises and 1181 worked steps.

Source: owner-supplied Makarychev, Mindyuk, Neshkov, Suvorova, Algebra 8,
Prosveshcheniye 2024, 17th edition. Printed pp.7–10 / PDF pp.8–11 were
rendered and visually inspected as well as extracted. All six substitutions
in №3, eight table cells in №6, three formula requests in №7, the formula
and both cases in №8, both selection groups in №2 and both questions in №24
are represented. Proofs in №18 require selecting a complete mathematical
argument, with intermediate sign/equality checks. Explanations are authored.
The PDF, page images and extracted text are not included in the repository.

## Mathematics and behavior

- Independent SymPy/Fraction oracle: 1338 checks, all 24 source numbers and
  all 95 source cards; formula/source fixtures, numeric substitution, real
  denominator zeros, zero-of-fraction exclusions, sign/equality cases,
  extrema, polynomial identities and accepted aliases, price comparison.
- №15г excludes x=−3 despite a zero numerator; №16г excludes y=5.
- №18в/г include equality at a=1 / b=3. №21 has maximum 2 and no minimum;
  zero is approached but never attained.
- №24: four paid boxes in «Сладость» give 1400 roubles; five boxes with 30%
  discount in «Джем» give 1365; saving is 35.
- Content/checker contracts: 399 cards / 1181 steps, 51 topics, 1340-number
  map. All canonical answers and declared aliases accepted; malformed answers
  rejected by existing checker tests.
- Existing eight model groups, state/recovery checks, four import-preservation
  cases, and all 399 in-memory DOM journeys / 1181 steps pass.
- All 306 original task records and their array indices compared exactly
  against base data.js: unchanged. Lesson metadata also unchanged. The build
  appends only to p01; no state schema, account or backend modification.
- Long task menus start closed at widths up to 900px and remain available
  through the existing disclosure control; desktop opens the menu initially.

## Browser evidence and limitations

The committed Chromium suite checks all 93 new prompts at 320/390/768/1280px,
all 223 new worked steps, all 24 source-number searches and their exact link
counts, excluded-root rejection, drafts/reload, old links/notebooks and assisted
completion. It produces 16 representative screenshots as a CI artifact.
Exact-head cloud results and screenshot review are recorded in the task PR,
which is the release evidence of record.

Local Chromium could not launch because this runtime disallows the required
system socket. A newer-browser download also returned an invalid archive.
Neither attempt is represented as a successful browser check; no TLS bypass
or sandbox escalation was used. Browser validation is an explicit cloud gate.
External provider review and real-pupil trials are not performed or claimed.
Symbolic answer validation retains explicit forms/aliases, not general CAS.

## Release and rollback

The current user requested this continuation. Standing permission authorizes
publication only after successful applicable checks. The release record in the
PR must include exact base/head, current main, drift revalidation if needed,
CI/browser evidence, merge identity, deployment and public-asset verification.
No additional owner decision is required when those gates pass.

Rollback is a normal revert of this additive course patch. Preserve browser
storage and original IDs; new records can remain stored without modifying old
work. No production pupil data or shared-board protocol is involved. The next
unfilled sequential block is №25–54. All 1340 exercise solutions are not claimed.
