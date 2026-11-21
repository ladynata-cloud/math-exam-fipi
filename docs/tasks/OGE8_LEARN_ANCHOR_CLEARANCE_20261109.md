# ОГЭ №8: переход к объяснению ниже закреплённой шапки

## Identity

- Owner: MathExam owner; executing agent: Codex.
- Date: 2026-11-09.
- Base: `main`, `9483e6e82d0d30c25f63a73cb8405edac96f389a` (merged PR #501).
- Branch: `fix/oge8-learn-anchor-clearance-20261109`.
- Review level: `SMALL`; isolated presentation correction, no runtime contract change.
- ADR: not applicable.

## Goal and verified context

The learner sees the section heading and its first formula after following a
cross-link to an explanation. Post-release Chrome inspection of the live OGE №8
lesson found that clicking «п. 4» finished with the card top around −0.47 px while
the sticky header covered the first 135 px. Scrolling up manually exposed the
correct explanation. This is a viewport defect, not a mathematical revision.
PR #501 is already merged; this independent follow-up has its own task and branch.
The older general project-status entries are historical and do not establish
this follow-up's release status.

## Approved scope

- Add `scroll-margin-top` only to direct explanation cards in `#view-learn`.
- Keep a 10rem desktop clearance and a 12px margin at the existing ≤640px
  breakpoint, where the header is static.
- Preserve the existing `gotoLearn`, mathematics, inputs, grading, saved progress,
  all other pages and shared styles.
- Extend the existing algebra browser scenario and exact full-page preservation
  helper; refresh only this page's navigator source binding with the standard tool.
- No workflow changes: the existing minimal-interface workflow already invokes
  the algebra scenario through its family loop and uploads its artifacts.

## Acceptance criteria and checks

- Actual «п. 3» and «п. 4» button clicks finish scrolling with the card, heading
  and first formula below the measured sticky header and within the viewport.
- Run at widths 320, 360, 641 and 1280; 641 covers the sticky-header breakpoint.
- Save a viewport screenshot of each destination and measured geometry as JSON.
- Through real inputs and buttons, 0×4 returns 0; (−1)×(−1) is rejected with a
  domain explanation; 32×2 then returns 8 with no stale error message.
- No page JavaScript errors or horizontal page overflow.
- The full PR #485 page SHA and all existing inline-engine hashes remain intact
  after narrowly exact reviewed normalization. Missing, duplicated or altered
  clearance CSS must fail normalization.
- Local checks: root-domain/interactions, algebra-course and minimal-presentation
  tests; algebra source contract; browser-script syntax; `git diff --check`.
- Final browser gate: existing `oge-course-minimal.yml` / `learner-and-browser`.
  Node/JSDOM evidence is not browser evidence; no local automated browser run is
  claimed. Actual browser artifacts and their inspection belong to the PR gate.

## Review, risk and rollback

Self-review plus focused independent review of CSS scope, preservation and browser
assertions. No new learning design is introduced; external provider review is not
required and was not performed. The remaining risk is header-height drift: the
browser test measures actual clearance and covers the narrow desktop breakpoint.
Rollback is an ordinary revert of this follow-up; no data migration is involved.

## Permissions and execution

The current conversation authorizes correcting defects found during the lesson's
release verification, with publication after applicable checks under
[the standing policy](../OWNER_RELEASE_AUTHORIZATION.md). The executing subtask
stops before remote branch publication until its concrete patch has been reviewed
by the release owner. Main merge and deployment remain with that release owner.

- Local focused Node/JSDOM checks: 74 passed, 0 failed.
- Algebra source contract: 668 checks, 0 failures, `OGE_ALGEBRA_GATE_OK`.
- Learner-entry preservation: 147 documents, 133 return bars, 1417 links;
  `OGE_LEARNER_ENTRY_STATIC_OK`.
- Browser script syntax: passed.
- Actual browser regression: not yet run; pending the existing CI gate.
- PR/head, final binding receipt and release evidence: recorded in the follow-up PR.
- No mathematical or engine changes; no scope deviations.
