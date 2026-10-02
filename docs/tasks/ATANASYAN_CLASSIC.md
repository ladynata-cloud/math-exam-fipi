# Atanasyan 7–9: the 2014 edition alongside 2023

## Identity
- Owner: site owner, current conversation.
- Date: 2026-10-02.
- Base: main, `20fa4cb5b92e41d4218367ccd39a19310ecebb90`.
- Branch: `course/atanasyan-classic`.
- Review level: MEDIUM: source-specific content and UI using the deployed GeoMath/GeoLab/GeoStore contracts; no server, authentication, bridge or hosting changes.

## Goal and authorized scope
Publish a separately identifiable course for the uploaded old-format Atanasyan textbook, preserve the 2023 course, and build an honest individually numbered problem/solution map. User requests all tasks, tests, progressive explanation and interactive constructions. GeoGebra pedagogical techniques may be used where they improve understanding.

Source: Atanasyan et al., Geometry 7–9, 2nd edition, Prosveshchenie, 2014, 383 printed pages; supplied scanned PDF has 390 pages. Bibliographic page visually checked. Book contents and diagrams must be checked before individual exercises are labelled solved. No inference that identical numbers in another edition mean identical tasks.

## Constraints and acceptance
- Two visible edition choices, old course does not replace the current one.
- Reuse deployed geometry construction and proof patterns. Source-specific worked solutions are distinct from topic-level practice.
- The map, individually solved exercises, and unimplemented exercises are counted separately. No generic placeholder qualifies as a worked solution.
- Numeric answers and branches checked independently; free written proofs remain teacher-reviewed.
- Old keys and old results remain unchanged. Reuse the existing v1 progress schema under an isolated edition key; no migration or clearing.
- Source scans / OCR are private working material, not included in the public release.
- Pointer and keyboard constructions, mobile layout, no compulsory animation.

## Checks
Source/coverage schema and individual answer checks; existing geometry regression; browser navigation, wrong answer, hint, correct steps, reload, keyboard construction, export; desktop and 360px mobile; links, diff, release tree and production assets.

## Permissions and review
Current user request authorizes implementation. The user's earlier instruction to complete and publish all created/updated courses remains applicable; no new final acceptance request is required. This is not an assertion that external review happened. No global policy changes, forced updates, account settings or branch protection bypass. Focused self-review and relevant regression checks apply to this bounded integration.

## Risks and rollback
OCR can corrupt labels and digits: source pages and diagrams must be visually checked for published numbered solutions. Preserve old content and progress. Rollback is a normal revert of this task's merge; no data deletion or schema migration is needed.

## Execution
In progress. Actual coverage and final checks will be recorded in the report and PR; the target of all exercises is not itself completion evidence.

### Checkpoint: priority switched to today's lessons
The owner asked for ready lessons for today's grade 6 and grade 9 students. The classic-course work is saved as an unfinished draft, not ready for release.

Implemented so far: source OCR inspected; 2014 edition identified; 68 shared topic links covering point numbers 1–131; author-written walkthroughs for numbered problems 1–86 (267 steps); draft UI and geometry-model adapter.

Not verified / remaining before any publication:
- Review all draft models against each problem, especially initial control state and labels.
- Add the linked reflector and pedagogy pages; currently these links have no target.
- Verify chapter maps against visual contents pages.
- Numeric and written-answer regression, restoration, 360px and keyboard browser checks.
- Add course navigation links and preview packaging only after checks.
- Problems 87–1310 and research tasks do not have individual solutions.
- No merge, no deployment, no full-course claim.
