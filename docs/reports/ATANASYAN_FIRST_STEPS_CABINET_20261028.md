# Atanasyan first steps: preparation and validation

Date: 2026-10-28 (Asia/Novosibirsk). Review level: **HIGH**.

## Result and release boundary

Prepared one bounded course for an owner-selected existing cabinet: the
beginning of Atanasyan geometry through elementary constructions, with a
condition, drawing, retained writing and individual walkthrough for every
included exercise. The native cabinet route and public companion use the same
reviewed data. The helper understands the selected source card and step.

This is prepared code, not a production release or evidence of pupil learning.
No real account was configured, no provider request was sent, and no merge or
deployment occurred. The helper is a source-based MathExam explanation layer;
it is not a newly trained neural network or an evaluation of external models.

- Task: [ATANASYAN_FIRST_STEPS_CABINET](../tasks/ATANASYAN_FIRST_STEPS_CABINET.md).
- Branch: `feat/atanasyan-first-steps-cabinet`.
- Base: `feat/math-assistant-cabinets-20261027`, exact commit
  `1fcc4fa36267f5667c42409861ef0b92f97b333c` (Draft PR #360).
- Dependencies: unmerged Drafts #358 / #359 / #360. No parent was merged or
  rebased as part of this task. Exact final head and CI evidence belong in the
  task's Draft PR, avoiding a self-referential source commit.
- Architecture: accepted ADR 0011. ADRs 0001 and 0006 remain Proposed.

## Source, endpoint and completeness

The existing source is Atanasyan et al., geometry 7–9, basic level, 14th revised
edition, 2023, ISBN 978-5-09-102538-5. Its recorded book SHA-256 is
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

The endpoint is theory point 23 and exercise 160, printed page 49. Exercises
161–190 are the following additional chapter-II set and do not enter this
route. The additional chapter-I exercises 75–91 remain in book order before
chapter II. This is complete within the requested boundary, not the full book.

| Included material | Count |
| --- | ---: |
| Ordered sections | 12 |
| Exercise numbers | 160 |
| Exercise/subpart cards | 232 |
| Theory cards, points 1–23 | 23 |
| Total cards with individual planar models | 255 |
| Exercise explanation steps | 682 |
| All steps, including theory | 799 |

The deterministic builder selects existing reviewed cards without changing
their IDs, revisions, conditions, steps, answers or models. The projection
retains every referenced theory card. A separate display override corrects the
malformed angle notation in exercises 62а–в; the original statements remain
preserved and the expected angles are checked against their model claims.

- Canonical source: `geometry-course/textbook/data/course.json`, SHA-256
  `afd4228a2e1444c8fca719fcc2dc0145ca5419354980a33dcadbf637b560325d`.
- Course projection: `learning/atanasyan-first-steps/course.json`, SHA-256
  `551c433a5332dba52779e74f7e6f95289c3915bdc55da3f7c0ed71d0b7e651a3`.
- `build.py --check` and the independent source test verify byte identity,
  exact card/catalogue sets, all number boundaries, dependency closure and
  reproducibility. The sealed textbook source and implementation remain intact.

## Learner and teacher behavior

The course groups the material in 12 ordered sections and supports direct
exercise lookup. Each task keeps the full source condition, its drawing and
written solution visible. Steps appear one at a time; earlier writing,
explanations, reasons, related-theory dialogs and drawing position survive
navigation and reload. Opening help records assistance permanently for that
local revision. Proofs receive no automatic correct or independent-work mark.

Work is browser-local and namespaced by the current cabinet account. It is
distinct from server-saved cabinet attempts and the old public textbook
namespace. JSON/text export is available. Import from an old public record is
explicit and imports neither checked credit nor another pupil's record.
Unavailable storage preserves work in memory for export and shows an honest
warning. A conflict keeps both versions rather than overwriting silently;
malformed saved data is retained for recovery. Teacher preview never reads or
writes the pupil's local records and cannot invoke that pupil's helper.

Teacher selection uses the exact public focus URL and the existing versioned
profile configuration. Existing assignments and other courses remain intact.
Native navigation uses `#atanasyan-course` and `#atanasyan-lesson=<source-id>`.
The public companion is prepared at `/geometry-course/first-steps/`; this report
does not claim that URL has been deployed. Full-course synchronization to the
board and new cloud attempt storage are outside this task. The managed/shared
board contract for exercise 92а is unchanged.

## Source-aware assistance and authorization

The new `atanasyan-first-steps` profile requires a course context. The browser
submits only the course ID, source lesson ID and source step index. It cannot
replace the condition, topic, solution or another learner's attempt. The
cabinet resolves the condition from its packaged course; the independent
service checks the same condition and course revision against its own minimal
snapshot. Unknown cards, out-of-range steps, context-free requests, foreign
profiles and mismatching revisions are rejected before consuming a new request
reservation where applicable.

Three hint levels expose the current step's action, its basis and its
explanation. Full walkthroughs require an explicit command. Changing the step
refreshes the hint ladder while retaining earlier answers. Late replies retain
the captured step label and cannot cross a disposed task or account. The UI
does not imply that it answers arbitrary free-text questions in this mode.

Existing authentication, mutation/CSRF checks, teacher ownership, permission
versions, active-assessment blocking, per-account limits, replay protection
and response-time revocation checks remain in force. The total enrollment cap
remains three enabled pupils. The server validates source-step membership;
it does not certify progression stored only in the browser.

This profile cannot invoke an external provider. The teacher UI clears and
disables external permission for it; configuration, request, bridge and model
message boundaries independently reject external use. Other prepared helper
profiles retain their existing behavior and default-off provider gates.

## Validation evidence

The commands below use pinned test dependencies made available through
`NODE_PATH` where needed. Browser tests use synthetic accounts and temporary
local servers. Screenshot/report output remains outside the source tree.

| Check | Result |
| --- | --- |
| Deterministic course and assistant snapshot checks | PASS; 255 exact source cards |
| Existing strict source/model checks | PASS; 569 source models, 2,906 views, 1,912 claims, six claim-test groups |
| New record tests | 9 groups passed; all 799 source steps have valid retained model states |
| New DOM/runtime tests | 6 groups passed, including retention, conflicts, recovery and truthful save feedback |
| New cabinet integration | 9 passed |
| Existing college, Merzlyak and EGE attachment regressions | 14 passed |
| Existing fixed-92а adapter and picker | 11 passed |
| Assistant-service full suite | 113 passed, zero failed/skipped |
| Focused cabinet-helper suite | 22 passed, zero failed/skipped |
| Full board-server suite | 331 passed, zero failed/skipped |
| Runtime packaging integration | 7 passed; exact assets/course bytes and negative route checks |
| Helper browser suite | 14 scenario groups passed |
| Real two-service browser path | 12 completed requests, including three source-course requests; zero provider calls/external browser requests |
| Independent bridge output sweep | 510 hint/full replies across all 255 cards accepted; zero failures |
| New real course browser journeys | 12 public + 12 native + read-only teacher preview passed |
| Public SEO checks | PASS; 529 canonical sitemap URLs in this branch |
| Final syntax, scope, links and whitespace | Recorded with the exact-head Draft PR gate |

The full board-server suite passed after one packaging-fixture correction.
The initial full local board run had
330 passing checks and one fixture failure: its simulated Docker layout omitted
the newly required two shared renderers. The fixture now follows the actual
Docker copy list and includes positive and negative static-route checks. The
focused integration rerun passed 7/7 and the full rerun passed 331/331. This is
a test-environment packaging correction, not an authorization or runtime
workaround. Actual Alpine image construction was not run locally because the
Docker CLI is unavailable; the existing container CI job now also verifies the
new packaged assets and resolves the final course card inside the image.

The real browser course checks cover №1, №100а, №145, №158, №159б and №160б at
1280 px and 390 px in both public and native views. They assert exact source
conditions, actual textarea persistence, retained help and model state, label
visibility, no horizontal overflow, and no unexpected API/external requests.
Teacher preview has zero pupil course-storage and helper requests. Visual
inspection of representative desktop/mobile screenshots found no course
clipping. Existing cabinet navigation tabs retain horizontal scrolling.

Representative repeatable gates:

```sh
python3 tools/atanasyan-first-steps/build.py --check
node assistant-service/scripts/build-course-knowledge.cjs --check
node tools/atanasyan-first-steps/source.test.cjs
python3 tools/geometry-textbook/build_course.py --check
node --test --test-isolation=none tools/atanasyan-first-steps/*.test.cjs
node tools/atanasyan-first-steps/browser.cjs
npm --prefix assistant-service test
npm --prefix board-server test
node tools/learning-assistant-browser.test.cjs
node tools/learning-assistant-e2e.browser.cjs
git diff --check
```

The new CI workflow repeats source, state, native integration and actual
desktop/mobile journeys. Existing assistant, unified learning, fixed-92а and
other affected workflows supply their respective regression gates. Exact-head
remote run conclusions must be taken from the Draft PR, not inferred here.

## Review findings resolved

Independent internal source/state/security review identified three behavior
defects during preparation; each was fixed and rechecked:

1. Storage failure could display a saved-success message. Save feedback now
   distinguishes persisted work from memory-only work available for export.
2. An initially malformed stored record could lock before the controls existed.
   The lock is reapplied to the rendered controls and recovery remains usable.
3. Exhausting three helper hints could disable the next source step. A
   no-network refresh updates the current step's hint ladder while retaining
   earlier answers and correctly labeling a late reply.

No unresolved internal finding remains in the reviewed source, saved-work or
authorization/helper changes. This is independent technical evidence, not an
external exact-head approval. Claude design consultation is unavailable; no
successful consultation or earlier exception is claimed. HIGH external review
remains required unless the owner grants a current reasoned exception. Its
provider, PR, base, head, verdict and verifiable source are not yet available.

## Production reconciliation and operational limits

Authoritative remote `main` was read separately as
`8723d6bfb19e64d43c474b1fc7116fe8630ec20a` (PR #362). Read-only HTTP checks of
the public textbook bundle, textbook engine and attached-course router returned
200 and matched that main source. The engine SHA-256 is
`a774e1204d0b26b2969589cfcff28b70cc8c8841f33230c1d511e3d7c4ee2c28`;
the attached-course router SHA-256 is
`c79a1cba0ac3b1c4e612f0bc36f5bda0a31974638cccf575b6543ede9078a944`.
No production write was made. Concurrent main changes must survive the later
authorized composition; they have not been silently imported into this branch.

Not run: required external review, real-pupil identity/profile mutation,
production deployment, live model quality/billing, or learning-outcome trials.
There is no authenticated teacher session here for verified real account
binding. After separate release approval and deployment, verify the intended
existing account and current profile version privately, select the exact course
URL, then enable its source helper within the existing enrollment limit.

Rollback is to remove the selected course/helper entry or revert this patch.
Preserve local records, cabinet databases, quotas and replay records. No database
migration, forced Git operation, reset, rebase, protection bypass or disabled
TLS verification is needed or authorized.

Final preparation marker: **`ATANASYAN_FIRST_STEPS_PREPARED_OK`** after the
reported checks pass. Merge and deployment require a separate owner decision.
