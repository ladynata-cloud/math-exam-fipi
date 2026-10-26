# Peterson 6: parts 2 and 3 verification

Date: 2026-10-26. Task: `PETERSON6_PARTS2_3`. Review: HIGH.
Starting base: `44eab4d11046d8613b50a73b00185755c814dba6`.
This is the preparation record. Exact PR-head CI results are recorded in the PR.

## Result

The existing `/school/peterson6/` now contains all 58 topic headings across
three parts, 428 task cards, 43 generated practice skills, 58 interactive models
and 75 essential task figures. Parts 2 and 3 add 44 topics and 204 selected
textbook tasks (99 and 105). All 224 previous task identities and the four
original content/source-map files are retained byte-for-byte. The first 20
generators retain their seeded output; 23 new skills are appended.

This is complete topic coverage with selected exercises, not a solution for
every textbook number. The first part retains its 213 authored and 11 source
cards. New cards identify the actual part, number, subpart and printed page.
The supplied PDFs, extracted pages and publisher images are not distributed.

There are 223 numeric, 131 choice and 74 manual tasks. The 942 retained steps
comprise 635 automatically checked numerical steps and 307 written instructions.
Manual tasks require a written record and teacher review; their completion is
never counted as automatic correctness or independent success.

## Source and mathematics review

The two part authors independently reviewed each other's completed part:

- Part 2: all 99 cards compared against 31 source pages, 99 number/page pairs,
  55 independently recomputed numeric finals, 28 choice questions and 16 manual
  tasks. Formula/figure details were also visually checked on six pages.
- Part 3: all 105 cards compared against 53 source pages, 32 independently
  recomputed numeric finals and all 58 manual tasks. Diagram-sensitive sources
  were inspected visually; selected subpart references were narrowed explicitly.
- The 87 independent expected numeric results are committed separately in
  `continuation-numeric-oracles.json`; the content gate compares all new numeric
  tasks to this fixed fixture.
- Search covers 497, 588 and 778 distinct printed numbers respectively.
  Part 2 has two labels 143 and no 144; lookup explains both cases instead of
  inventing a task. The source map distinguishes final review exercises.

Resolved findings: square versus rectangle in part 3 exercise 614(b), now a
square with a minimum 90-degree turn; essential captions revealing a method or
intermediate answer; a prematurely drawn circumcircle; imprecise partial
references; raw explicit algebraic-fraction tokens found in browser QA, now
rendered safely as horizontal fractions and checked through all 428 full journeys; rounded inverse-proportion table values now exact fractions.
Errors in the supplied source itself are documented in the source maps.

## Verification

| Check | Evidence |
| --- | --- |
| Build and content | 58 topics, 428 cards, source coverage and old file hashes; all numeric forms accepted; all 87 independent expected finals match |
| Arithmetic generators | 12,900 generated tasks and 32,400 steps in the main gate; separate independent BigInt oracle checks 13,800 new-skill tasks and 28,800 steps |
| Legacy generators | Independent comparison of 6,060 old generated objects against the starting base is identical |
| Models | 58 models and 75 figures; 126 new extreme controls, 436 new state restorations, 748 malformed states rejected; old 58 restorations and 205 invalid states retained |
| Triangle centres | All 20 combinations of five triangle shapes and four centre modes independently checked from rendered SVG geometry |
| Solid geometry | Dodecahedron and icosahedron vertex counts, 30 edges and vertex degrees checked from exact generated coordinates |
| DOM journeys | All 428 cards and 129 practice screens; manual/instruction tasks, fresh checks, safe text, drafts, import and old saves |
| Shared work | Strict schema 2 codec, saved model/task matching, late join/handoff SDK journeys, malformed and oversized snapshot atomic rejection, personal storage isolation |
| Offline export | All 58 topics load from one HTML with embedded styles and runtime; no external runtime assets or DOM errors |
| Cabinet links | 16 existing cabinet/focus-link contract tests pass; existing recommendations and attempts are unchanged |
| Picker | All 58 lesson routes, 43 skills, practice/check levels, diagnostic routes and unsupported-route rejection |
| Server | 26 registry checks and 7 real Socket.IO registry integration tests pass, including Docker-equivalent layout and fail-closed behaviour |
| Browser CI | Extended teacher/learner gate is committed for 58 topics, 129 practice screens, part-aware search, manual work, check/diagnostic, model detours, reload, handoff and late join; exact-head result belongs in the PR |

Browser-local work uses the original storage key and export identifier. Models
are retained per task. Import preserves conflicting current notes and drafts.
Optional model/theory disclosures are closed initially; opening them records
assistance permanently for the unfinished task. A later view does not erase an
already earned independent result. Essential task figures remain visible.
New checks use unseen generated conditions and offer no hint controls.

During local cloud-Chrome QA, desktop and 320/390-pixel frames were inspected,
including textbook lookup, proportions, manual geometry and mobile controls.
This uses synthetic work, not evidence from real pupils. The GitHub browser
suite supplies the actual two-participant server gate and retained screenshots.

Initial broad local runs were blocked by files absent from the sparse checkout.
The server's unchanged dependencies were materialized and all seven integration
tests passed. Unrelated broad picker assets remain for full-checkout CI; no
unrelated trainers were modified to make tests pass.

The first cloud board run separated normal legacy-save migration from the
strict board storage boundary. The next run exposed long new topic names
expanding the narrow home grid. Card min-width and word wrapping were corrected
without clipping content or reducing text size; cloud Chrome confirms equal
287-pixel document/scroll widths. These findings are retained in PR CI history.

## Contract, limitations and release

Peterson registers version 2.0.0/state schema 2. Registry readers support schemas
1 and 2 while retaining exact trainer-version matching, role checks, JSON bounds
and the original 48 KiB work / 60 KiB snapshot limits. Only Peterson's manifest
entry changes. Its canonical URL and existing cabinet links are preserved.
Shared classroom work does not alter personal progress or assign new pupils.

Claude consultation and final external review are NOT RUN: no authorized
Claude/Anthropic capability is available. Internal independent reviews are not
represented as an external verdict, and no earlier waiver is reused. A current
consultation or owner exception remains a release prerequisite under repository
policy. Deployment and real-pupil validation are not part of this preparation.

Rollback must restore the frontend runtime, wrapper and registry metadata
alongside the corresponding backend registry deployment. Do not delete personal
keys, notes or pupil data. An old server rejects incompatible metadata; existing
old shared rooms require a fresh compatible room after coordinated publication.

The starting base remains unchanged in this task branch. Main advanced with the
separate Pogorelov companion PR347 while work was in progress. The status update
is scoped to the Peterson section; a read-only merge check and GitHub PR checks
verify composition without silently merging other work into this branch.

Merge, auto-merge and production deployment remain unperformed. The owner's
current creation request authorizes the completed implementation and Draft PR;
publication needs the separate current release decision required by `AGENTS.md`.
