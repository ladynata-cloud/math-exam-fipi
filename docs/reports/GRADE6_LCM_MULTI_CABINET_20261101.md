# Grade-six LCM supplement — preparation verification

Date: 2026-11-01 (Asia/Novosibirsk; 2026-10-31 UTC).
Task: [GRADE6_LCM_MULTI_CABINET](../tasks/GRADE6_LCM_MULTI_CABINET.md).
Base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
Branch: `feat/grade6-lcm-multi-20261031`.
Review level: **HIGH**.

**Local preparation gate: `GRADE6_LCM_MULTI_PREPARATION_OK`.**
This means the scoped implementation, independent internal checks and relevant
local regression pass. It is not a release verdict, proof of learning gains,
or confirmation that a real learner's cabinet has been configured. The Draft
PR records its exact head and CI; merge/deployment require a separate decision.

## Delivered behavior

The existing textbook course now has a clearly labelled MathExam author
supplement, related to point 8. Each taught condition has two method buttons
and separate retained work. The original textbook and legacy courses remain
accessible. Author cards do not receive invented textbook numbers or PDF pages.

| Material | Distinct conditions | Saved cards |
| --- | ---: | ---: |
| Worked examples, both methods | 3 | 6 |
| Practice, both methods | 16 | 32 |
| Fresh independent checks | 6 | 6 |
| New total | 25 stage-specific conditions | 44 |

Some practice conditions intentionally revisit a worked example; the table
does not claim 25 mathematically distinct input sets. All six checks are new
relative to both the examples and the practice bank, even after sorting inputs.
There are 203 authored intermediate steps. The combined catalog has 238 cards:
194 unchanged source selections and 44 author cards.

### Two methods

- Successive pairs carry the current LCM into the next pair, with one required
  answer per pair. For 12, 18 and 30, the learner obtains 36 and then 180.
  For 6, 8, 12 and 18, the chain is 24, 24, 72: a step need not increase the LCM.
- Prime factorizations ask for each original factorization, then the largest
  required count of each prime, then their product. For 12, 18 and 30 the
  selected factors are 2 · 2 · 3 · 3 · 5, giving 180.
- The finite bank covers three, four and five numbers, repeated inputs, 1,
  divisibility chains and values above the old two-number bank's 200 limit.
  The number 1 has zero prime factors; it is never accepted as a prime factor.
- Checking divisibility alone is insufficient. A larger common multiple is
  rejected with an explanation that a smaller one exists, without revealing it.
  This feedback applies to actual LCM steps/final answers, not multiplicity
  questions. The counterexample 6, 10, 15 also explains why common GCD 1 does
  not justify multiplying all inputs.

The 38 taught cards start guided. Trying both methods on a familiar condition
cannot earn independent credit. Six fresh cards start independently; help and
repeat provenance remain durable. A correct final answer supports correctness
of that answer, but cannot prove which requested method the learner used on
paper. No topic-wide mastery claim is made.

## Compatibility and preservation

- The baseline fixture in `tools/vilenkin6-course/lcm-multi-base.json` was
  captured from the verified base before generating the additive manifest.
  All 194 full original records, their ordering and `sourceRevision` values
  match SHA-256 `ee00eadc6ecf88a9e46b06154ecc68c60a0c8a3e97bae293f4745d85c70b8091`.
- All four A–D source JSON files match their base bytes. The original source
  and coverage gates remain unchanged at 24 units, 194 selected cards and
  615 steps. The original four three-number exercises 2.97 д–з remain present.
- The 378 other catalog rows retain their existing exact-content hash; all
  27 legacy modules retain their identities. There is no progress migration.
- The task contract changes only by loading the additional dataset. State
  schema/version, normalization, checking, source pinning, assistance,
  ownership and helper APIs are unchanged. Backend implementation, database
  schema, trainer-frame and the old number-theory trainer are unchanged.
- The real browser regression seeds 194 original saved attempts and a legacy
  attempt, then compares their complete records after the new lessons. All
  remain byte-identical; the other synthetic learner's route and standalone
  storage sentinel also remain unchanged.
- Docker already copies the complete textbook-data directory. No packaging
  or deployment configuration change is needed for the additive JSON.

## Completed local checks

Node 24.22.1, JSDOM 26.1.0, linkedom 0.18.14, Playwright 1.62.1 and locally
installed Chromium 140.0.7339.16 were used. Test identities are synthetic.

| Gate / command group | Result and coverage |
| --- | --- |
| `build-textbook-catalog.cjs --check` | PASS: 25 units, 238 exact task identities; original records unchanged |
| `lcm-multi.test.cjs` | PASS: 7 focused checks, all 44 final answers, all 203 steps, larger multiples rejected, source honesty, fresh checks and all helper projections |
| Learning backend: `learning-vilenkin6`, `learning-vilenkin-textbook`, `learning-vilenkin-helper` | PASS: 36 tests; canonical source/step evaluation, SQLite restart, old history, ownership, source and help races |
| Managed textbook DOM, cabinet DOM, number-theory route DOM, helper, source labels and support | PASS: 57 tests including the 7 focused LCM checks; all 238 tasks hydrate, new error feedback and hidden-help retention pass |
| Original `textbook-dom.cjs` | PASS: 194 source views, 25 figures, 30 retained-work and interaction journeys |
| Original source/entry/coverage gates | PASS: 24 original units / 194 cards / 615 steps; entry regression and 10 coverage tests; full-book completeness remains false |
| Legacy `check.cjs`, `dom.cjs`, `managed-dom.cjs` | PASS: 27 modules, 475 tasks, 81 examples, 266 steps; 108 DOM views and 27 models; offline content byte-identical |
| Legacy bridge and cabinet DOM | PASS: 5 bridge tests and 8 cabinet tests |
| Existing real textbook cabinet browser | `VILENKIN_TEXTBOOK_BROWSER_OK`: 8 scenarios, no page errors, current 238-card manifest |
| Existing real source-helper browser | PASS: 7 ACK, draft, control, exam-race and result-preservation scenarios; zero provider calls |
| Existing full textbook browser | `VILENKIN6_TEXTBOOK_BROWSER_OK`: 388 views (194 at both 390/1280 px), 9 interaction flows, no horizontal overflow |
| Expanded support browser | `VILENKIN6_EXPANDED_SUPPORT_OK`: 320/390/1280 px, all 168 primes through 1000, preserved drafts and help provenance |
| New real LCM cabinet browser | `LCM_MULTI_BROWSER_OK`: 10 end-to-end checks, 10 complete guided examples/practices, 6 independent checks, no page errors |
| Syntax, sanitized diff and whitespace | PASS; no original source or unrelated product file changed |

The new real-browser gate uses two local origins, the actual learning API and
an isolated SQLite store. It checks both methods, reload and a second browser
context, method switching, greater common multiples, explicit hints, repeated
questions, teacher control and peer denial. It blocks public browser requests.
The selected-pupil profile form is exercised only against the synthetic store.

## Browser findings and corrections

Three concrete layout findings were fixed before the final passing run:

1. At 320×900, the full outer title and secondary controls pushed the first
   condition to about y=1012. The author-only workspace now uses a short title
   and places existing secondary controls in a disclosure below the trainer.
2. After three factorization steps, prior work above the active form pushed
   input to about y=1070. Prior work now remains fully available below the
   current form. The same input is now about y=534, with the check button at
   y=597 on the verified mobile case.
3. The closed floating helper launcher overlapped the check button. Only for
   the author workspace, the closed launcher now sits in document flow below
   the work. The open helper retains its existing behavior and API.

Final checks include the actual iframe bounds and outer-page hit tests, not
just document dimensions. Initial condition/current action pass at 320×900,
390×844 and 1280×900. The active factor question, input and check button after
three answers pass at both mobile sizes. The completed steps remain reachable
below. All 11 final screenshots were inspected across the independent reviewer,
browser QA agent and primary executor.

The [sanitized browser evidence](grade6-lcm-multi/browser-result.json) binds
coordinates, results, screenshots and the reviewed files by SHA-256.

- [Two method choices, mobile](grade6-lcm-multi/course-examples-320.png).
- [Two method choices, desktop](grade6-lcm-multi/course-examples-1280.png).
- [Initial successive-pair task, 320 px](grade6-lcm-multi/chain-first-screen-320.png).
- [Initial task, desktop](grade6-lcm-multi/chain-first-screen-1280.png).
- [Current factor step after three answers, 320 px](grade6-lcm-multi/factors-after-three-steps-320.png).

## Failed attempts and environment limitations

- The first focused source-label assertion expected the bare source label;
  the actual intended UI adds the explicit MathExam author prefix. The test
  now requires that full truthful label. Product source checks were not relaxed.
- The first layout runs failed on the three findings above. They are retained
  here as failures; only the final strict run is used as a pass.
- The installed Chromium cannot launch under the restrictive process/socket
  sandbox. Local browser tests used approved execution outside that sandbox,
  exclusively with temporary test stores. No TLS verification was disabled.
- The official newer Chromium download returned an invalid empty archive.
  After the installer's failure, the existing official Chromium 140 binary was
  used; the download was not repeatedly retried by the agent.
- The old support-browser runner's explicit local-browser fallback adds
  `--single-process` and `--no-zygote`. That launch crashed when creating a
  context. A temporary local launch adapter removed those two flags and the
  same unchanged test passed in normal multiprocess mode. No assertion, source
  file or committed gate was altered for this environment correction. The
  default CI browser path does not use those fallback flags.
- These are Chromium desktop/emulated-width checks. Physical phones, mobile
  keyboards, Safari, Firefox and a real pupil trial were not performed.

## Initial CI findings

The first published head, `e21a4e4385c2559cc29fe283d06a34cc5a4905c2`, passed
the Vilenkin cloud and publication workflows, including the new browser gate.
The unified backend suite also passed 358/358 tests. Its later sealed-catalog
integration gate had not yet included the 44 author cards and therefore failed
with 238 actual versus 194 expected textbook-family IDs.

That gate is corrected within this task: the original 194 source IDs still
have their own exact comparison, while the 44 author IDs have a separate exact
group with source/author separation and no invented page. The full catalog
partition remains exhaustive. The corrected
`GRADE7_GEOMETRY_REBUILD_INTEGRATION_OK` passes locally with 616 identities,
676 unchanged legacy cases and 62 reshuffle-identity checks. No runtime or
content changed for this CI correction. The Draft PR records the new head's CI.
An independent internal review of this gate correction found no weakened
assertion: misclassification, missing/duplicate IDs and unaccounted catalog
entries still fail. The separate immutable-base oracle checks the full source
records and bytes, beyond this integration gate's ID comparisons.

Two further CI failures reproduce on the unmodified base:

- [Ichenskaya source/proof workflow](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41225257001),
  job 124607951523.
- [Atanasyan first-steps workflow](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41225256968),
  job 124607951726.

Both stop in `tools/atanasyan-first-steps/build.py --check` with
`Canonical source SHA256 changed; audit the source before updating this route`.
The builder still pins
`bcd2aba64872aabcfd763448d9e3223ae90bb40a780091dd5922059c14583d81`, while
`geometry-course/textbook/data/course.json` is
`af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574`.
Both files are byte-identical between the task base and candidate; the builder
itself hashes to `f4e6d4460089d1c156a3c815ed43ce1b838229d138e6469955624f0c60caff7f`.
The primary executor reproduced the failure and exact base comparison.

These source audits are outside the approved LCM scope. Their expected hashes
were not relaxed or silently changed. **Overall CI is not reported green**;
the Draft PR remains open for a separate owner decision on these existing
source-audit failures as well as external review and release authorization.

## Review and production boundaries

The curriculum agent independently reviewed the UI/integration, including the
scoped `learning/app.js` changes, old identities and the corrected mobile
finding. That agent authored the dataset and does not claim to have
independently reviewed its own mathematics. The browser QA agent and primary
executor separately checked all mathematics using an ordered search of common
multiples and independent factor counts. No open internal findings remain.

**External review: `UNAVAILABLE`, not approved or waived.** No authorized
Claude design-call integration is exposed, and the repository records an
existing insufficient-credit provider hold. No new provider request, paid
retry, response or external verdict occurred. HIGH-level external review or an
explicit owner exception with rationale remains necessary before release.

Read-only production reconciliation confirmed HTTP 200 and exact base bytes
for the public textbook catalog (SHA-256
`8069dac0adc5d805351ed8674678c92a5f55f95e705644ef791925d4a518da88`)
and `units-B.json` (SHA-256
`3ac7e7da0cde2668ba680c93c3d8d3475cac9c6f5f8821e76529821d9c64ca6e`).
Primary GitHub metadata confirms PR378 and PR388 are merged. This reconciliation
does not certify unrelated book distribution or a complete earlier release.

The actual teacher UI requires owner sign-in. No real learner profile or saved
work was accessed or modified. After separately authorized publication, identify
the intended grade-six cabinet, preserve its comment and previous records,
select the existing textbook route if necessary, verify the new block and
old source exercises, then check reload and the learner view. Do not send a
message or invitation to any learner without explicit authorization.

## Rollback and handoff

Before release, close the Draft PR to abandon the candidate. A later
owner-approved revert can remove the new entry points while preserving all
database records; restoring a new author attempt would require its matching
source version. No database deletion or migration is part of rollback.

```text
EXECUTIVE STATUS

Task: GRADE6_LCM_MULTI_CABINET
PR: Draft PR records the publication URL and exact-head CI
Base: a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3
Head: Exact committed head in Draft PR; reviewed file hashes in browser-result.json
Gate: GRADE6_LCM_MULTI_PREPARATION_OK (local preparation only)
Tests: Relevant local mathematical, identity, source, DOM, SQLite and browser gates PASS
Failures: Local LCM checks pass; two pre-existing geometry source-audit CI failures remain; initial catalog gate corrected
Not run: External review, release, real cabinet assignment and physical-device/pupil trial
Scope deviations: None; author-only layout corrections use existing handlers and APIs
Recommendation: Retain Draft status; resolve the recorded CI and release conditions
Next user decision: Existing source-audit failures and external-review route/exception, then separate release authorization and sign-in
```
