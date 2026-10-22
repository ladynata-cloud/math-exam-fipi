# Peterson grade 6, part 1: course and computational practice

## Identity and approved scope

- Owner: MathExam project owner; direct request 2026-10-23 to create the same
  interactive course from the supplied Peterson textbook, adding separate
  practice for difficult computational skills and a return to the source task.
- Base: `main` at `c62e5047fa2e774d43899e4ee20d5e1127c53e64`.
- Branch: `course/peterson6-part1-practice`; one task and Draft PR.
- Review level: MEDIUM. Isolated buildless course following existing local
  practice/step/return patterns. No backend, authentication or board protocol.
- The direct instruction authorizes implementation, checks, commit and Draft PR.
  No separate authorization for merging this PR has been received.

## Source and coverage

Source inspected locally: G. V. Dorofeev, L. G. Peterson, Mathematics grade 6,
part 1, BINOM, 2019, 112 pages. The uploaded PDF itself is not published.

All 14 topic headings are represented. There are 224 learning tasks (136 numeric,
88 choice), 333 checked numeric substeps, 63 theory blocks, and seven interactive
model families. Eleven source exercises on page 47 are visually transcribed;
213 other tasks are original and explicitly labelled as such. The lookup maps
all numbered exercises 1–497 to topic/page, without claiming 497 solutions.
Parts 2 and 3 and exhaustive textbook solutions are not included.

Twenty computational skill generators each provide three difficulty levels:
ordinary, decimal, mixed-number and combined operations, conversion, reduction,
order of operations and percent basics. Help is optional; draft, steps and notes
survive detours and reload. Assisted work, repeated conditions and independent
first-attempt success are distinguished. A practice result never completes its
source task. Exact rational arithmetic, comma input and representation-specific
checks avoid float tolerance and conversion bypasses.

## Changes and boundaries

- Add `school/peterson6/` (data, runtime, reproducible checks, offline exporter).
- Add links to the existing school navigation and courses catalogue.
- Add scoped CI workflow and this task specification.
- Preserve existing courses, pupil records, board and hosting settings.
- Progress uses a new isolated browser key. Import validates answers, completed
  steps and routes; unreadable or future saves are not overwritten.

## Validation and review

- Source inventory: all 497 numbers/page ranges; shared-page heading boundaries
  checked. Source examples independently compared to the page image.
- Independent mathematics review: all logic, arithmetic and percent tasks;
  three logical ambiguities corrected. Numeric results independently checked.
- Exact generator test: 6000 tasks and 18000 steps with an independent BigInt
  answer oracle, parser rejection cases and answer-format checks.
- Content check: 224 unique tasks, all 333 numeric steps, skill IDs, answer
  variants, source mapping and bundle freshness.
- State tests: malformed saves, format retention, immutable first-success
  record, duplicate conditions, help history and detour draft retention.
- Model tests: all 14 variants, 32 slider boundaries and specific mathematical
  relationships; keyboard-native controls and label associations.
- In-memory DOM journeys: all 224 tasks, 60 practice screens, checking answers,
  steps, detour/return, notes, source lookup and progress. This is not a browser.
- Actual browser/visual QA: NOT COMPLETED. Cloud browser URL policy blocked
  access to the permitted preview URL. No alternative browser path was used.
  Mobile CSS was statically reviewed; long heading and table overflow were fixed.
- Real-pupil learning validation has not been performed.

### External consultation status

The required preimplementation Claude discussion and ready-result Claude review
are unavailable: no authorized Claude integration or local API credential is
exposed. The repository's existing OGE reviewer is scoped to OGE and the generic
generation workflow is not exposed as a callable authorized consultation API.
No provider verdict or standing waiver is claimed. Independent agent reviews are
recorded as internal review only. Useful preparation and checks continued under
`TRAINER_CLAUDE_CONSULTATION.md`; release requires the owner's explicit exception
or completed consultation, plus separate merge authorization.

## Risk and rollback

Main limits: browser visual inspection pending; content is a topic course with
selected source examples, not every textbook subpart. Student results are
browser-local, with export/import, not an account/cloud journal. Rollback removes
the additive course links/files; leave the isolated local progress key intact.

## Next three actions

1. Run the exact-head cloud checks on the Draft PR.
2. Obtain browser visual review when available and resolve the Claude review
   requirement with the owner; obtain separate PR/base/head merge authorization.
3. Publish only after authorization, then verify deployment and public bytes.
