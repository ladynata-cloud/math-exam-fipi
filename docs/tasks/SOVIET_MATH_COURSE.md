# Математика по советским учебникам

## Identity and scope
- Date: 2026-10-11 (Asia/Novosibirsk)
- Base: main `28ca6887702748243cc99f50edeb470a987f802d`
- Branch: `feat/soviet-math-course`
- Review: MEDIUM, focused independent content and UI review.
- Owner instruction: create the named section with a line of trainers and embedded videos; preserve a continuous solution surface, helpers beside the main algorithm, and occasional gentle zoom. Later request: additive growth to 100–200 topics without overwriting existing material.
- Implementation authorized by the current direct instruction «Сделай». Standing publication authorization from 2026-10-01 («выложишь на сайт все созданные или обновленные курсы») was verified from user conversation context; no repeated acceptance or external provider review is required. Internal independent review remains required. No claim of external reviewer approval.

## Implementation
- 30 stable topic IDs, authored examples, 30 silent MP4 files.
- Source basis: checked Pchelko/Polyak 1959 grade 1 and 1961 grade 2 contents and Princev/Yagodovsky 1966 arithmetic contents. The course is thematic, not an exhaustive edition/page transcription.
- Extend the existing authored static scene / stored MP4 / browser-local practice patterns. Reuse DivisionGuided unchanged for the division algorithm.
- Right: accumulated main solution, including Russian long division. Left: supporting calculation. All records keep fixed positions.
- Optional local camera zoom preserves the main solution and can be disabled. Reduced-motion respected. Same renderer feeds live lesson and MP4.
- Open topic links from the shared board as ordinary embedded trainers; no claim of mirrored controls.
- Local progress explicitly distinguished from cloud accounts; video and guided examples never count as independent mastery.
- Add entry points from PreOGE, laboratory and courses. Do not change account, server, authentication or existing trainer content.

## Acceptance and checks
- Every topic has 12 or more authored/generated tasks and a working video path.
- Correct/incorrect answers, hints, solution reveal, completion, repetition, reload, navigation and malformed storage checked.
- Exact arithmetic independently checked across the authored variant sets; division zero, remainder and decimal cases covered.
- Videos have no audio stream; shared renderer, retained rows, readable landscape frames; all generated assets probed.
- Test gate: SOVIET_MATH_OK. Node content tests, browser UI tests, media checks, existing division core regression, scoped links, git diff --check.

## Risk and rollback
- Main risk: presentation or numerical error in new authored material. Existing courses and accounts are untouched.
- Rollback: revert this PR's added directory and three navigation cards; no data migration. Browser key is isolated `mathExam.sovietMath.v1`.
- Future topics append unique IDs and MP4 names. Existing IDs and URLs must not be recycled. This first batch does not claim 100–200 completed topics or complete grade-year coverage.

## Execution record
- Completed 30 topics and 30 silent H.264 MP4s: 1,977.6 seconds, 34,719,908 bytes. Each has its own stable path, source caption and content checksum.
- Sources identify author, title, class, edition year and checked printed section pages. All current exercises are authored; no textbook task numbers are invented.
- Independent review found and resolved premature place-value disclosure, false division repeats, fraction keyboard access, repetition labels and acceptance of unreduced fractions where reduction is required.
- Local content gate: 288 ordinary examples, 6,000 generated divisions, 14,702 cycles, 107,876 steps. Existing division regression: 2,700 plans. Browser gate: all 30 topic flows, 260 answered steps, reload/help/errors/repeats, malformed/future/conflicting storage, 320/390 px and reduced motion.
- Renderer QA: 2,659 frames and 151 comparisons for early answer disclosure; actual encoded frames checked for decimal/zero/remainder division, column work and fractions. File hashes, silent streams, dimensions, duration and faststart checked for the complete batch.
- No open P1/P2 findings in the final independent focused code review. Media playback is a required exact-head CI Chrome gate; local Chromium lacks H.264. A baseline arithmetic-course local check lacked jsdom; existing PreOGE CI supplies its dependencies. These unavailable local checks are not claimed as passes.
- Remote handoffs contain only public course content, scoped code and test evidence. Publication follows standing owner authorization, reconfirmed by the instruction to complete this work in the cloud while the owner is offline.
- Exact PR base/head, CI, release tree identity and production checks are recorded in the PR.
