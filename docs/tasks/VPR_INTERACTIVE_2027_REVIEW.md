# VPR interactive courses — independent review record

## Identity and current verdict

- Task: `VPR_INTERACTIVE_COURSES_2027`.
- Review level: `HIGH`.
- Reviewed base: `25548b86df75b8c90a5dc5c6f1f1925c2ad70636`.
- Branch: `feat/vpr-2027-interactive-courses`.
- Review recorded: **2026-11-06 18:15 UTC**.
- Reviewer: the internal `vpr_official` review agent, separate from the app and board-adapter implementers. This reviewer authored the grade 10 bank; the grade 10 semantic review was performed separately by another internal reviewer. The reviewer also ported the automated tests listed below.
- Status: the reviewed local mathematical and application-boundary checks passed. No unresolved blocker was found in the inspected source boundaries. **This is not a ready-to-publish verdict:** final candidate gates, real-browser evidence, CI and the committed PR head are recorded separately by the executing agent.
- This is an internal team technical review, **not external provider approval**, owner merge authorization, or evidence of deployment. The task remains Draft PR only.
- The exact head is deliberately not guessed before commit creation. The executing agent must record the actual PR base/head and verify that the reviewed blobs below remain identical; material changes require a focused new review and affected checks.

## Content identity and scope

The sole canonical input is `trainers/vpr-math/content/full_data.json`:

```text
SHA-256: 21c2fd87db2f9ef39232dc758b2c2afcfece621ea94963fb3447b875ee3778a4
```

`build.py` creates `data.js` deterministically, retaining the teaching content and removing authoring-only numeric oracles and references. The coverage file binds its evidence to the canonical SHA. Older split-file hashes in the coverage file are provenance; the gate does not pretend those former source files exist in this repository.

| Route | Lessons | Reachable tasks | Official categories mapped |
| --- | ---: | ---: | ---: |
| 5 | 12 | 72 | 17 |
| 6 | 12 | 72 | 16 |
| 7, basic | 18 | 108 | 17 |
| 7, advanced | 22 | 132 | 17 |
| 8, basic | 16 | 96 | 17 |
| 8, advanced | 20 | 120 | 17 |
| 10 | 17 | 102 | 17 |

There are **82 distinct lessons, 492 distinct tasks and 1284 checked steps**. Shared lessons belong to more than one route, so route totals must not be added to count unique content. The bank contains 998 numeric, 232 choice, 32 set and 22 ordered-tuple steps, 98 authored SVG diagrams, and eight interactive graph constructions. All 118 mapped official categories have reachable task evidence. Fourteen mappings explicitly state remaining subtype limitations.

The mapping establishes training by official category. It does not establish exhaustive coverage of every permitted subtype, equivalence to a complete official variant, matched difficulty to another problem bank, or an official VPR grade. Full written reasoning and geometric proofs require human assessment. A diagnostic is a short selection of course tasks, not an official exam variant.

## Mathematical and pedagogical review

Before repository integration, the reviewer inspected all prompts, answers and explanations of the 65 lessons / 390 tasks / 997 steps in the lower, middle and supplement content, including all their choice alternatives and 58 SVGs. Checks included independent arithmetic, algebraic roots and domain restrictions, exhaustive finite combinatorics, and word-problem interpretation. The 17 grade 10 lessons / 102 tasks received a separate internal review of all final-answer targets and a deeper sample of 30 cases, in addition to numerical checks. The authoring and independent-review roles were kept distinct for grade 10.

Closed findings included:

- An unknown-component equation and central symmetry were added where the official-category mapping otherwise overstated the available practice.
- Final checks now assess every requested component of coordinates and other multi-output answers. Ordered tuples preserve order and repeated values; root sets are unordered.
- A GCD word problem now ends at the number of sets asked for, rather than an unrelated intermediate component.
- Median tasks specify the required ordering, and probability questions explicitly state the equal-likelihood assumptions.
- The meaning of adjacent angles uses opposite rays. A chord proof treats the diameter case separately. Trigonometric inverse formulas state the domain and merging of boundary solution families.
- Five supplemental lessons closed category gaps in number lines, process graphs, geometric statements, and quadratic word problems.

The repository gate rechecks **1101 authored numeric oracle components and four graph roots derived independently from the plotted parabola and requested horizontal line**, for 1105 numerical comparisons. The AST evaluator allows only a small arithmetic subset; it does not execute arbitrary Python. Passing these numerical checks is additional evidence, not a replacement for semantic review of the question.

## Local checks actually completed

The commands below run from the repository root. For DOM tests, `jsdom@26.1.0` is provided by the caller through `NODE_PATH`; dependencies are installed outside the repository by the workflow. Test files contain no machine-specific paths and make no network requests to the live site.

| Check | Observed result | What it establishes |
| --- | --- | --- |
| `python3 trainers/vpr-math/content-gate.py` | PASS, zero failures | Counts and identity; all numeric evidence; allowed answer structures; SVG safety/accessibility; plot bounds; all 118 category-to-task mappings and human-assessment markers |
| `node --test trainers/vpr-math/core.test.cjs trainers/vpr-math/plot.test.cjs` | **46 passed**, zero failures | Parsing, strict numerical tolerance, unordered roots, ordered tuples, choice zero, coherent persisted states, separate modes, proof-step chains, graph interpolation and invalid points |
| `node --test trainers/vpr-math/learner-journeys.test.cjs` before the three added boundary regressions | **12 passed**, zero failures | Every one of the 492 tasks completed through the actual DOM in learning and independent modes, all 1284 learning steps, plus the persistent scenarios below |
| `node --test --test-name-pattern='shared-state hook\|fails closed\|known board iframe' trainers/vpr-math/learner-journeys.test.cjs` | **3 passed**, zero failures on the reviewed boundary fixes | Independent-page isolation, missing-adapter denial, actual nested known-board iframe privacy despite a missing board-mode asset |

The last two runs cover all **15** learner-journey cases. The executing agent reruns the complete suite on the final candidate; this record does not substitute separate runs for final exact-head evidence.

The DOM harness reads `index.html`, evaluates its actual local scripts in document order, rejects nonlocal script paths, and drives the real input, click and submit handlers. It checks runtime data against recursively cleaned canonical JSON. Detailed scenarios cover:

- Wrong answers remaining editable; hints only after two mistakes; shown steps marked assisted; restart preserving notes and archiving errors once.
- Partial answer and note restoration; escaped markup; separation of learning and independent attempts; complete tuple answers including repeated components.
- Construction and reload of all eight line/parabola laboratories.
- Diagnostics withholding correctness until completion, retaining skipped items, avoiding achievement credit, rotating the next selection, and resuming two routes independently after reload.
- Imports retaining newer attempts and both pending diagnostics; malformed or cross-route input rejected without erasing valid work; invalid saved JSON, denied storage and quota exhaustion remaining usable.
- Cabinet/query links initializing once, an explicit home hash remaining authoritative, and a board link representing the currently displayed task.

DOM tests establish behavior, not visual layout, browser-native focus behavior or an authenticated production deployment.

## Independent application-boundary findings

| Finding | Resolution inspected and regression evidence |
| --- | --- |
| A missing board adapter made `canEdit()` return true inside board mode, permitting unsynchronized edits. The regression reproduced mutation of answer, solved state and notes. | Editing now requires an existing writable adapter. The regression omits `board.js`, attempts edits and checks the unchanged application state and absence of personal storage. |
| The shared-state apply hook could be reached in personal mode, where its write path replaced the attempt map. | Both the adapter and the app write hook reject personal-mode application. A valid foreign room snapshot cannot alter personal notes, attempts or stored bytes. |
| Relying only on an early board-mode asset could expose private progress if that asset failed. | The app independently recognizes the explicit board query and both same-origin known board hosts before reading storage. A real nested jsdom iframe, without `board=1` and with `board-mode.js` omitted, makes **zero accesses** to a preloaded private store for both `trainer-board.html` and `group-board.html`. Its private notes are absent and its inert frame cannot edit. |
| An absent bridge could leave shared controls writable despite the missing transport. | The adapter checks for the existing SDK registration function before permitting shared edits. The separate board-agent suite covers omitted bridge/adapter assets and records its final result in the task handoff. |

The reviewed snapshot contains only the selected view, current task attempt, immediate feedback and four panel flags. It excludes personal achievements, diagnostic sessions, error history and export files. Board mode never loads or writes the personal key, and it does not award personal achievements. Its notes are labelled shared. Received state replaces the current room attempt under an application guard and cannot trigger an echo notification.

The adapter enforces exact keys, route/lesson/task membership, mode identity, complete array lengths and coherent solved state. It rejects hidden future answers, invalid choice indices, impossible hint flags, out-of-range graph points, excess fields, accessors, cyclic/non-JSON values and HTML tags. The snapshot is bounded to 64 KiB and cloned on input/output. The existing bridge continues to own sender/origin/protocol/instance checks; the existing server continues to own room write permission. Client inert/read-only checks are an additional UI control and are not a replacement for server authorization.

A room shares its current task snapshot. This review does not claim a synchronized course-wide attempt history or personal-account progress. Graph construction uses selected integer points and interpolation: two points for a line, three distinct abscissas for a parabola. It is not a general freehand drawing evaluator, and its successful construction message is not an official judgment of a fully written graph solution. Freehand board drawings use the existing host's drawing channel and need the real-browser two-participant check.

## Reviewed source blobs

These are Git blob object IDs (`git hash-object`), rather than commit IDs. They permit the executing agent to compare the final committed tree to this reviewed candidate without inventing a head SHA.

| Repository-relative file | Git blob object ID |
| --- | --- |
| `trainers/vpr-math/app.js` | `11c8747e7c6c95f18e49860cde65f44400fc16ce` |
| `trainers/vpr-math/board.js` | `12253b44feb31da34ab87e1ff6cd9a029aea9173` |
| `trainers/vpr-math/board-mode.js` | `61c660c8499636cb2257427a62acce586f2db095` |
| `trainers/vpr-math/core.js` | `af7e49a1275080bae237febc294834916bb25a50` |
| `trainers/vpr-math/plot.js` | `6ae19bce541e91c981309634eb691365c372c8b7` |
| `trainers/vpr-math/index.html` | `4a69c39c13c5c557470d80abb4c45bb14b3ae08f` |
| `trainers/vpr-math/build.py` | `9f397a41067c4e976c713e508b674efa93e1b748` |
| `trainers/vpr-math/data.js` | `396fb260801a76f0e275b79fefd2b65315edcc95` |
| `trainers/vpr-math/content/coverage.json` | `29a77c94d07d8338db099d885a53311f46f769bd` |
| `trainers/vpr-math/core.test.cjs` | `8eea6b6884a5411789b1a41363981d4ccac3394e` |
| `trainers/vpr-math/plot.test.cjs` | `6c7de2df88f3e55c8a6fa8981de73b5d8872b4d8` |
| `trainers/vpr-math/learner-journeys.test.cjs` | `93c520d9d48c7eb850800ec42eb854ad4c8dbe47` |
| `trainers/vpr-math/content-gate.py` | `f8cf9216a8fb755bc52d07228782e4e847feb820` |

## Rollback and outstanding evidence

The inspected integration uses the existing personal storage key and export schema, adds no database migration, and changes no server authentication or wire protocol. The independent-page boundary tests confirm that attempted room application preserves existing personal bytes. A rollback should be an ordinary reviewed revert of the integration commit(s), including catalogue/registry/host additions. It must not delete browser storage, pupil records or room data. Re-enabling the same bank and IDs should allow the existing personal attempts to be read again.

This is a verified review of rollback surfaces and data preservation, **not a claim that a production rollback was executed**. The executing agent must record applicability of the inverse patch against the committed candidate and run the relevant previous catalogue/registry/host gates. No force, reset or rebase is part of the plan.

At the time of this record, these remain outside this reviewer's completed evidence:

- The executing agent's combined final gate on the committed PR head and GitHub CI result.
- A real-browser two-participant run for both room directions, control transfer, freehand drawings, late join and reconnect, with stored screenshots.
- Manual inspection of the actual 320×900, 390×844 and 1280×900 screenshots, keyboard/focus and overflow behavior. jsdom does not satisfy this criterion.
- Production deployment, live user assignments, real pupil records, pupil pilot, or external provider review. None was performed or represented as performed here.

Recommendation: preserve the completed local review and regression evidence in the Draft PR, complete the pending applicable checks and bind them to the exact head. Stop before merge or publication under the current task authorization.
