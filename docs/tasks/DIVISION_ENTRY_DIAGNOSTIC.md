# Entry check before multiplication and long division

- Date: 2026-10-19 (Asia/Novosibirsk).
- Base: main, `b8444fd106478c8cbb0a21d89f0f0958fd9fa124` (PR265).
- Branch: `feat/division-entry-diagnostic`.
- Review: MEDIUM, bounded independent frontend check using the existing exact
  DivisionLab planner, numeric questions and public lesson links.

## Owner request and scope

The owner asks for a separate entry diagnostic based on the familiar selection
of the first dividend digits with arrows. It must identify which elements of
the existing routes need attention and give a concrete starting exercise. The
follow-up explicitly asks to put it in the pupil cabinet before the two existing
routes. This authorizes completing the checked change and its publication.

The current source has multiplication and division tracks. Addition and
subtraction are tested separately as requested; existing route names and progress
are preserved. The shared cabinet course view already contains both tracks;
adding its entry requires no pupil-record or assignment changes.

## Implementation

- Separate diagnostic page: two complete integer divisions, three arithmetic
  probes, 18 scored responses. Two alternating number sets; no timing score.
- Existing exact planner supplies the notebook. Arrows select the initial digit
  count. Every accepted row stays visible; prior problems remain expandable.
- Wrong answers and skips are recorded once. Correct canonical data then feed
  the next question, preventing cascading error attribution.
- One independent follow-up per affected skill, at most eight. Distinguish no
  evidence, successful checked items, isolated uncertainty and repeated trouble.
- First recommended lesson plus up to two next lessons; full observed breakdown
  and a manually copyable teacher report. No claim of general mastery or
  measurement of decimals, rounding or every multiplication fact.
- Separate tab-local session only, replay-validated on reload. Managed attempts,
  accounts, existing storage keys and course completion are not modified.
- Entrances in the public and cabinet course headers. Cabinet links to the
  public diagnostic in a separate tab and supplies a fixed cabinet return.

## Acceptance and gates

Core arithmetic, two complete variants, independent skill attribution, all skips,
single-error uncertainty, bounded follow-ups, real destination paths, DOM state
replay, keyboard selection bounds, no future partial answer, partial reports,
corrupt/unavailable storage and the existing route regression.

The existing learning CI additionally runs diagnostic browser journeys at 320,
390 and desktop widths and retains screenshots. Browser QA is not run locally
because this managed session has no supported control-browser skill. Cloud CI
uses the repository's existing pinned Playwright infrastructure.

Required exact-head CI: Unified learning (including production container),
Cabinet school course navigation and EGE base virtual classroom, plus any other
workflow triggered by the final diff. `git diff --check` and focused independent
review are required. Gate: `DIVISION_ENTRY_DIAGNOSTIC_OK`.

## Risks and rollback

Main risks: a pending result displayed early, a wrong skill inferred from a
dependent computation, unavailable lesson links, or publication reaching Pages
without the cabinet. Review and targeted tests cover those boundaries. Rollback
is a revert of these standalone assets and entry links; managed attempts are
unchanged. No external review is required for MEDIUM; no external approval is
claimed.

Before publication, recheck authoritative main and exact head. Verify the merged
tree and parent, Pages success, public assets, the three changed cabinet assets
on Amvera, and health/durable storage. Actual pupil login is not required to
verify this shared navigation change and must not be represented as tested.

## Execution record

PR265 base deployment was reconciled through GitHub Actions: Pages39187074868
and EGE base39187075320 succeeded on the exact base SHA. This is deployment
evidence, not a new end-to-end pupil assessment.

Final test, independent-review and release evidence will be recorded in the PR.
