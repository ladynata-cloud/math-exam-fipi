# OGE and PreOGE entry; tutor laboratory

## Identity

- Owner: Наталья Михайловна.
- Date: 2026-10-07 (Asia/Novosibirsk).
- Base: `main`, `74776f448a82aa220d08c1312e20ea314d571dac`.
- Branch: `feature/oge-focus-lab`.
- Review level: `MEDIUM`.
- Related task: [previous OGE homepage](OGE_HOMEPAGE_FOCUS.md).
- ADR: no new runtime, data or deployment architecture.

## Goal

Give learners two clear public routes: OGE practice and PreOGE foundations.
Move other course directions and teaching materials into a discreet public
«Лаборатория репетитора», retaining direct URLs and access to existing work.

## Context and evidence

The homepage already led with OGE after PR #201, but still promoted grade 7,
textbook courses, EGE, DVI and teacher articles. The OGE entry pages also used
old shared navigation with geometry and EGE links. The foundations page is a
complete route through arithmetic, fractions, signs, units and percentages.

The owner now requests only OGE and PreOGE up front. Publication and merge are
covered by the owner's standing permission; separate external review is waived.
PR #203 is the verified base: its nested logarithm lesson has shipped and the
Amvera registry was confirmed with six mirrors after deployment.

## Approved scope

### In scope

- Simplify `index.html` to OGE and PreOGE, retaining OGE practice, diagnosis,
  the author's introduction and contacts. Put the lab link in the footer.
- Add `laboratory/index.html` using the established site design. Preserve the
  moved course, trainer and article destinations and their authoring markers.
- Align only the common header/footer of `oge/index.html` and
  `trainers/oge-course/index.html`; do not sweep standalone trainer navigation.
- Give `trainers/oge-basics/index.html` a clear PreOGE title and a prominent
  link to the canonical stepwise division page. Keep all foundation modules
  and topic links visible. Do not invent a general foundations diagnostic.
- Retarget three existing discovery gates to the moved lab cards, keeping
  their mathematics, registry, progress and sitemap assertions intact.
- Point the download-article generator at the new lab location, preserving its
  existing block markers so later generation cannot repopulate the homepage.
- Route the existing EGE release browser gate through the lab and include the lab
  in its workflow path filters, preserving all later learning checks.
- Focused navigation/link and desktop/mobile checks; task/status reconciliation.

### Out of scope

- Trainer algorithms, assignments, pupil records, authentication, storage keys.
- Board registry or picker, division runtime, sitemap removal, redirects or
  `noindex`. Other directions remain public at their existing addresses.
- Editing every historical page or course catalog; these remain reachable
  from the lab as existing resources.

## Acceptance criteria

- [x] OGE and PreOGE are the two initial learning routes; other course directions
  are absent from the homepage content and selected shared navigation.
- [x] The tutor laboratory is a plain footer entry and retains the moved links.
- [x] Foundations still expose arithmetic, fractions, signs, units and percentages;
  the first screen offers the canonical division route as the current focus.
- [x] Existing account URLs and saved progress contracts remain unchanged.
- [x] Internal destinations, local anchors and HTML structure pass focused checks.
- [x] Desktop and 375px layouts allow navigation without horizontal overflow;
  keyboard entry and the lab-to-foundations-to-division path work.

## Checks and gates

- `tools/oge-focus-navigation.test.cjs`: public-route restrictions, retained
  destinations, foundation coverage, generator destination and internal links.
- `tools/oge-focus-navigation.browser.cjs`: five pages at desktop/mobile widths,
  skip link, real navigation, canonical division entry and retained saved progress.
- Existing algebra7, Yashchenko and DVI authoring gates; OGE 1–5 discovery checks.
- Existing `tools/ege-release/browser.cjs`: full course regression after the
  updated homepage → laboratory → EGE discovery path.
- Review the complete diff and run `git diff --check`.
- Final gate: `OGE_FOCUS_NAVIGATION_OK` and `OGE_FOCUS_BROWSER_OK`.
- Production writes, account operations and broad unrelated course tests are
  not required for this navigation-only task.

## Review plan

- MEDIUM: bounded navigation changes across several entry pages and one
  maintenance generator, with focused regression of moved discovery contracts.
- External review: waived explicitly by the owner. Independent scoped audit
  and internal diff/layout review remain part of the work.
- Handoffs contain public source and synthetic browser progress only.
- If any external review is used, record provider, PR, base/head, verdict and
  verifiable source; this document does not claim external approval.

## Risk and rollback

- Risks: hiding an essential learning route, a broken moved link, mobile wrapping
  or a generator recreating old homepage cards. Each has a focused check.
- Revert this navigation change as one bounded patch. Content files and learner
  data are unchanged; no migration or data reset is involved.
- Full-tree link checks distinguish a missing destination from a sparse checkout.

## Permissions

- The current user request authorizes implementation; standing publication and
  merge permission applies. No separate external review is required.
- This delegated execution creates a local commit only. Root handles push, PR,
  current-base verification, merge and publication.
- No force operations, auto-merge or protection changes are requested.

## Execution record

- Base and branch match the identity above; the worktree was clean at start.
- Read-only navigation audit identified two shared OGE entry pages and the
  moved-card generator hook. Practical map and diagnostic navigation need no edit.
- PASS `OGE_FOCUS_NAVIGATION_OK`: 191 internal destinations, page structure,
  route restrictions, retained lab destinations and complete foundation modules.
- PASS `OGE_FOCUS_BROWSER_OK`: ten page layouts at 1280px and 375px,
  keyboard entry, lab → foundations → canonical division navigation, unchanged
  synthetic saved progress. Home, lab and foundations screenshots were inspected.
- PASS algebra7 and Yashchenko authoring gates; OGE 1–5 entry checks (5/5).
- PASS `RELEASE_BROWSER_PASS`: all 28 EGE lesson flows after entering via the
  lab; three widths, restoration, export, old-key preservation and error cases.
- PASS JavaScript syntax checks and `git diff --check`.
- INHERITED FAILURE: `tools/dvi-math-18-20-progress-gate.mjs` stops at
  `learningAnchor` with `learning-generator anchor must be present`, before the
  moved discovery assertions. Running the exact unchanged gate from the base
  (`git show HEAD:tools/dvi-math-18-20-progress-gate.mjs | node --input-type=module`)
  reproduces the same assertion. The DVI trainer is unchanged; its laboratory
  destination is independently checked by the focused navigation gate. This
  unrelated baseline failure is not repaired or weakened in this task.
- Internal review: delegated read-only navigation audit and parent diff/layout
  review completed. No external-review verdict is claimed.
- Not run: publication, production account writes and unrelated course suites;
  the parent agent owns the release.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS
Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
