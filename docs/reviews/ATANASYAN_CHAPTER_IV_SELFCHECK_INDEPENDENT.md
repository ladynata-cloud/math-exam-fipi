# Chapter IV self-check — independent candidate review

## Verdict and provenance

**CHANGES_REQUESTED** for the reviewed editorial candidate. The source coverage,
authored mathematics and actual coordinates pass independent review. One blocking
rendering defect changes the displayed radius formula in question 10. Two small
clarity/copy improvements are also recorded below. This is an independent content
and preview verdict, not integration, merge, deployment or release approval.

- Reviewer/provider: **separate Codex review agent `review_atanasyan_iv`**, not the
  authoring agent. No Claude or other paid-provider review is claimed.
- Review completed (UTC): `2026-11-01T21:21:09Z`.
- PR: **#402**.
- Authoring base: `1577c058309f4cc78c21315bf64b0b393751ec2d`.
- GitHub candidate head supplied by the executing agent:
  `9a7139ffdf0964e2acffd9fa7d6a0c412251eb17`.
- Reviewed tree: `bf4051da9dc2e7a4d8dd4c6e044ee5eed51f4213`.
- Locally inspected HEAD: `2351f112f1d5cf2a08a3e01eace2bbd643dbdc19`;
  independently confirmed to have exactly that tree. The different commit
  identity is not represented as a different content review.
- Current main reported in the review handoff:
  `4afa9caa033c6d861d2a412ad2b9ad2957acb531`. This reviewer did not query or
  authorize a merge against it.
- Browser evidence: GitHub Actions run **41349404667**, artifact **13100502902**.
  Its `evidence.json` SHA-256 is `1f06a17e218088e0f1823b45803606f1720c986b8e1da77b1eaa57661c5c85b5`.
- All thirteen raw card hashes and all 216 screenshot hashes were independently
  recalculated and matched to that evidence manifest.

The review reads the repository instructions, review policy, parent textbook
scope and chapter IV task scope. No card, review flag, production file, branch
or remote state was changed by the reviewer. The only repository output is this
report.

## Findings

### B1 — blocking: fractions lose their meaning in the preview

`content-drafts/atanasyan-chapter-iv-selfcheck/index.html` loads `math-text.js`
but only `task-scenes.css` and `preview.css`. Neither loaded stylesheet supplies
`.stereo-fraction`, `.stereo-numerator` or `.stereo-denominator` layout rules.
The renderer replaces a slash with numerator/denominator spans; without their
styles, the spans run together.

In `ex-selfcheck-iv-10.json`, `steps[0].explanation` and
`steps[2].explanation` correctly contain `AB/2`, but the actual complete images
at **320, 390 and 1280 px** display **AB2**, including **OM=AB2** and **OM≤AB2**.
This is visible in the native-width question 10 proof text and in the desktop
complete screenshot. It is a displayed-mathematics failure, despite correct raw
JSON and correct coordinate geometry.

Required correction: include the existing fraction layout in the isolated
preview and verify the rendered numerator above the denominator with a visible
fraction bar. Capture question 10's opened explanations again at all three
widths. The existing overflow/finite-SVG checks alone do not detect this defect.

### N1 — non-blocking: show the diameter used in question 8

In `ex-selfcheck-iv-08.json`, `visualization.model.views.diameter` tells the
learner to compare the hypotenuse with the sphere diameter, while its highlighted
sphere segment is `O–T`, whose actual length is **√5**, a radius. The explanatory
text correctly compares **2√6** with **2√5**, so the proof is sound and the model
does not assert an impossible inscribed triangle.

Prefer highlighting two opposite sphere points, with their midpoint at O.
A diameter parallel to BC also gives both compared lengths the same projection
factor. Keep these auxiliary endpoints out of the initial figure.

### N2 — non-blocking: case ending in the question 3а title

`ex-selfcheck-iv-03-a.json`, `title`, reads «Расстояние между хордами: равно
высоты». Use «… равно высоте» or «… равно высоте цилиндра». The condition and
solution have the correct meaning.

## Source and per-card review

The reviewer directly viewed both original page images, printed **111–112**
(PDF pages **113–114**), including the original square roots. This was not a
review of an author paraphrase alone. All ten numbered questions are represented;
question 3 retains Cyrillic а/б/в and question 5 retains а/б, giving thirteen cards.
The additions “through the interior” in questions 2/6 make the proper-section
case explicit; the optional explanations separately cover the excluded
degeneracies. The whole-surface thin-coating interpretation of question 4 is
stated, with the side-only alternative distinguished.

In the table, **model** means actual coordinates and drawing states. A correct
coordinate model does not excuse B1's separate text-rendering failure.

| Card | Source | Mathematics | Model / pedagogy evidence and verdict |
| --- | --- | --- | --- |
| 01 | PASS, p.111 q.1 | PASS: a plane containing a generator contains a normal to the base, hence the angle is 90°. | PASS: vertical AA₁ lies in the shown plane y=0. The axial example illustrates the general proof without requiring an axial plane. |
| 02 | PASS, p.111 q.2 | PASS: translated chords and perpendicular generators bound a filled rectangle; tangent and empty intersections are distinct. | PASS: proper plane x=0.7 in radius-2 cylinder; tangent generator at x=2; outside plane x=2.5. All five states checked. |
| 03-а | PASS, p.111 q.3а | PASS: all pairs have distance at least h; two differently directed diameters attain h at their centers. | PASS: M,N give distance 3. N2 is a title-only copy issue. |
| 03-б | PASS, p.111 q.3б | PASS: disjoint projected **segments** can have positive separation even when their supporting lines meet. | PASS: x=−1.8 and y=1.8 chords have endpoints on radius-2 circles. Closest pair is B,C, distance about 3.2746275393 > 3. Their supporting-line intersection lies outside the disk. |
| 03-в | PASS, p.111 q.3в | PASS: PQ²=h²+PH²≥h² for every pair, including the P=H case. | PASS: P,Q,H satisfy the claimed incidence, perpendicularity and identity. The proof is universal, not inferred from a sample picture. |
| 04 | PASS, p.111 q.4 | PASS: lateral areas equal; two bases contribute 2πr² versus 8πr², so the second total is larger by 6πr². | PASS: displayed radii/heights are (1,4) and (2,2); both bases are included in the calculation. The thin-layer assumption and side-only alternative are explicit. |
| 05-а | PASS, p.111 q.5а | PASS: OA/OB are the projections; congruent right triangles SOA/SOB give equal angles with the base. | PASS: R=2, h=3, equal generators √13, correct corresponding angles at A and B. |
| 05-б | PASS, p.111 q.5б | PASS: the corresponding angles at S in the same congruent triangles are the angles with the axis. | PASS: same consistent geometry; no confusion between the two requested angle types. |
| 06 | PASS, p.111 q.6 | PASS: the proper section is a filled isosceles triangle; it need not be axial. Tangent generator and apex-only cases are explained. | PASS: oblique section plane z+3y=3, SA=SB=√13; SC is a possible tangent generator; z=3 intersects the cone only at S. |
| 07 | PASS, p.111 q.7 | PASS: intersection of the line with the **solid ball** is an interval; A=B and H=O are handled. Sphere and ball are distinguished. | PASS: A,B inside radius 3; H is the perpendicular foot; C,D are on the sphere and ordered C–A–B–D. |
| 08 | PASS, p.112 q.8: legs 4 and 2√2, radius √5 | PASS: BC²=24 exceeds the squared sphere diameter 20; the section-circle argument is also correct. | PASS with N1: triangle and sphere are separate, on one coordinate scale. M is the circumcenter at radius √6. OT is correctly a radius, but the comparison drawing should show a diameter. |
| 09 | PASS, p.112 q.9 | PASS: one center-to-plane distance cannot equal two unequal radii. | PASS: concentric radii 1.6 and 3; plane z=1.6 touches the smaller and cuts the larger. |
| 10 | PASS, p.112 q.10 | PASS in authored text: both inclusions prove the sphere with diameter AB, excluding A and B; interior points are excluded. | Coordinate model PASS: right angle at M, OM=2, all locus wire points radius 2. Initial state shows only AB. **Rendered pedagogy FAIL, B1:** AB/2 becomes AB2. |

Independent coordinate checks used the raw models, not a disconnected replica
of an author oracle. Checks included all sphere mesh radii and point references,
cylinder ring coordinates, section coplanarity, projected chord endpoints and
minimum bounds, lengths and dot products, ball chord incidence/order, the two
question 8 squared lengths, and the locus radius/right angle. All thirteen passed.
For question 3б the independent lower-bound argument is coordinatewise:
each horizontal component is at least 1.8−√0.76, with both bounds attained at
B,C; thus the stated minimum follows. A 101×101 pair sample supported that
analytic check and was not used as its proof.

## Actual visual and interaction coverage

Every image in the **216-image** evidence manifest was included in visual
inspection, at the following levels; these are not 216 full-resolution manual
browser journeys:

- **135 model-state images:** every one of the 45 authored states at each of
  320, 390 and 1280 px, inspected as drawing-region contact sheets. Mobile
  drawing crops retained native width; desktop drawings were reduced for the
  sheets, with selected original images reopened. All named construction
  states, proper/degenerate section examples and the final locus were covered.
- **39 initial page images:** the first 900-pixel viewport of every card at
  every width. Condition and complete figure are present before optional help
  and solution content. No initial textual answer was found. Question 10 does
  not reveal its sphere before the requested help/steps. Initial section
  pictures in 2/6 show the given cut without a conclusion label or equality marks.
- **39 complete page images:** all inspected at reduced scale for page layout;
  additionally, the last 2000 vertical pixels of **all thirteen 320-px complete
  images** were inspected at native width as two text strips. Selected full
  originals included question 8 at 390 px and question 10 at 1280 px. These
  detailed text views found B1; the narrow-width radical expressions in 3б/8
  remained legible.
- **3 expanded images:** question 1 at all three widths, inspected directly.
  Expansion behavior for the other 36 card/width pairs is supported by the
  CI assertions, not by additional manually viewed expanded screenshots.

All 45 states are reachable from the initial state, a help item or a step.
The preview implementation retains earlier opened step articles, makes
explanations/justifications optional, retains the in-memory answer across
hint/step/card actions, and explicitly describes reload loss. It does not
certify a manual proof or write learner storage. The six theory targets
38/39/40/43/44/45 exist and concern the relevant cylinder, cone, sphere/ball,
section and tangent topics.

The CI evidence reports 39 journeys, 39 expand/close checks, zero page errors,
label-bound/overflow checks, rotation/reset, optional help and step operations,
and draft retention. This reviewer inspected that harness and the preview code
but did **not** independently operate a new browser session, inspect every
possible camera angle, use physical devices or assess screen-reader speech.
The first-screen result is specific to the tested **900-pixel viewport height**;
it is not a promise that the complete figure fits shorter phones.

## Checks, boundaries and next action

- PASS: direct original-source comparison for all thirteen cards and all
  31 authored proof steps.
- PASS: independent analytic and raw-coordinate review described above.
- PASS: independently recomputed 13 card and 216 screenshot hashes.
- PASS: supplemental `tools/atanasyan-chapter-iv-selfcheck/check.cjs` after using
  the already installed repository test dependencies: 13 schema/runtime-valid
  drafts, 45 reachable states, all 640 published cards preserved, pending review
  flags unchanged. Initial attempts with the default runtime lacked Ajv; the
  completed retry supersedes that environment-only failure.
- PASS: `git diff --check` on the inspected candidate.
- FAIL: actual preview fraction display in question 10 (B1).
- Not run: new local Chromium journeys, complete production integration/release
  gates, remote-main freshness/virtual-merge verification, physical-device or
  pupil testing. Existing CI evidence is supporting evidence, not a claim that
  those actions were independently repeated.
- Scope: the candidate diff remains an isolated editorial increment, with no
  production lesson/runtime changes. No production promotion was reviewed.

Correct B1 and preferably N1/N2, then request a focused review of the changed
files and fresh screenshots bound to the new head and raw-card hashes. This
verdict does not carry forward automatically to a materially changed head.
Only after the focused review passes should a separately checked integration
be considered. All existing pending flags remain pending in this candidate.

## Raw-card identity

Hashes below are SHA-256 of the exact UTF-8 file bytes under
`content-drafts/atanasyan-chapter-iv-selfcheck/`, including whitespace.

| File | SHA-256 |
| --- | --- |
| `ex-selfcheck-iv-01.json` | `2ae3f61628262635ab8cfa14188990a222ceb967408e4d57af96cda1ba8f09a3` |
| `ex-selfcheck-iv-02.json` | `2031455fbe108992d3d29d0555bbfcc5067383b1d3efb15e3f3e80c17b6e2f7c` |
| `ex-selfcheck-iv-03-a.json` | `2ec572ed0ed14f5993bb93abfce774a91b436103e920dfc59a037e6785df09ae` |
| `ex-selfcheck-iv-03-b.json` | `7f32ae75794081b548fa8f1711b0daf3d0a8a2f0a1cc00fffc53dbe313f96198` |
| `ex-selfcheck-iv-03-c.json` | `bae7c000289fa1a7e87a3576f0cea90d0e318bf49de7635a869da3166066375e` |
| `ex-selfcheck-iv-04.json` | `147be6d013f9654c83651cc430a862253ba41d9841e5988733ffd5c9cbd7d32c` |
| `ex-selfcheck-iv-05-a.json` | `604950345447cb2b84bc8e47329f1abda46820ed651170460623d5ab63d42a9a` |
| `ex-selfcheck-iv-05-b.json` | `0c2804b5c24a76f9a41a41fd83689f435e4082cb5095840bb37c57b408d900bc` |
| `ex-selfcheck-iv-06.json` | `8c0f131cc1b8af0e5afe2791062255ab1bd48cc637c9ab7fe999ed9cc882f123` |
| `ex-selfcheck-iv-07.json` | `e1ab212ae25d17d64174be54d15cb9898accb189432bce98e1b3f9ab4809c94a` |
| `ex-selfcheck-iv-08.json` | `c65f51af8bc9cbcb96850e38975853071ba52e1701674ad5e18d54c312b15056` |
| `ex-selfcheck-iv-09.json` | `e3db385053efdbb4cda56f7a5c0b9fa6ffa34fb41f9f7ac8e383e620366667df` |
| `ex-selfcheck-iv-10.json` | `9cf271019723fae4b9f1e48502fb9fe8fa187b96b65fe5eefc90953528ecb1f1` |

## Executive status

```text
Task: ATANASYAN_CHAPTER_IV_SELFCHECK independent candidate review
PR: #402
Base: 1577c058309f4cc78c21315bf64b0b393751ec2d
Head: 9a7139ffdf0964e2acffd9fa7d6a0c412251eb17
Gate: CHANGES_REQUESTED (editorial content/preview review only)
Tests: source, 31 proof steps, 13 raw coordinate models, evidence hashes, static draft gate, whitespace
Failures: B1 — Q10 AB/2 rendered as AB2 in the preview
Not run: fresh browser session; production integration/release gates; merge freshness
Scope deviations: none by reviewer
Recommendation: fix B1, apply N1/N2, then focused independent re-review
Next user decision: none required for the already authorized corrections; no merge approval granted
```


## Focused follow-up — corrected candidate

**PASS** for the thirteen-card editorial content and preview at the head/tree
below. **B1, N1 and N2 are resolved.** The original CHANGES_REQUESTED report above
is preserved verbatim as historical evidence, not relabelled. This follow-up is
by the same separate Codex review agent, and combines that full review with the
bounded corrections independently checked here. It is not production
integration, mergeability, merge or deployment approval.

- Reviewer: separate Codex agent `review_atanasyan_iv`.
- Follow-up completed (UTC): `2026-11-01T21:32:19Z`.
- PR: **#402**; authoring base remains
  `1577c058309f4cc78c21315bf64b0b393751ec2d`.
- Reviewed GitHub head supplied by the executing agent:
  `97e0da6bb64fa3dec3f919bd812e6ee2f426696c`.
- Reviewed tree, independently confirmed locally:
  `c0ea1edb21fc2c143997b2aaf78e461b8ed9d67d`.
- Local equivalent HEAD:
  `b2dd1735a5c5cc6823046f1bea538662b49a148a`.
- Fresh **head-branch push CI**, not a PR merge-ref run:
  **41352063380**, job **124984210106**, artifact **13100749370**.
- Independently recalculated fresh `evidence.json` SHA-256:
  `34fcaf0e13fe32bff7523e292bdb4f111db57db952a21d967e3c72b0a82e07dc`.
- All **216 new screenshot hashes** and **13 current raw-card hashes** independently
  match that manifest. The fresh evidence reports completed=true, 39 journeys,
  135 states, 39 expansions, no page errors, nine rendered fractions and three
  rejected missing-style negative controls.

### Exact delta and resolution

The only raw-card changes since the initial review are question 3а's title and
question 8's diameter points/view. All eleven other card files, including
question 10, retain their original hashes. Question 8's condition, source,
help, proof steps and answer are unchanged. The executable preview changes are
isolated fraction CSS and added browser/math regression checks. The later
workflow-only commit adds a push trigger for the exact editorial branch and
the existing three path filters; jobs, test steps and read-only permissions are
unchanged. The status/author-review documentation and the preserved initial
independent report do not alter learner content. Production files remain outside
the delta.

| Finding | Independent follow-up evidence | Result |
| --- | --- | --- |
| B1: AB/2 became AB2 | Inspected all three actual fractions in the fresh question 10 completed page at **each** of 320, 390 and 1280 px, using native-width proof crops. All nine now visibly place AB above 2 with a horizontal bar; adjacent equality/inequality and prose remain readable. | **Resolved** |
| N1: radius highlighted instead of diameter | Recalculated TT₁²=20, OT²=OT₁²=5, midpoint (T+T₁)/2=O and cross(T₁−T,C−B)=0. TT₁ is a complete diameter parallel to BC. Directly inspected fresh diameter and neutral model screenshots at all three widths. Diameter endpoints and highlighted segment are absent initially. | **Resolved** |
| N2: title case ending | The raw title and all three first-screen images now read «Расстояние между хордами: равно высоте». Figure and condition still fit the tested first 900-pixel viewport. | **Resolved** |

The browser fraction check is meaningful: it checks three exact AB/2 instances,
nonzero numerator height, numerator above denominator, centered components and
a visible solid bar. Its negative control temporarily recreates the missing
styles and must be rejected; the injected style is removed, the passing check
is repeated, and only then is the completed screenshot captured. The fresh
artifact records rejection at all three widths. This reviewer inspected the
assertion and negative-control code; their browser execution is CI evidence,
not a claimed separate local browser run.

### Focused visual coverage and regression scope

Direct visual follow-up covered **12 fresh source images**: the three question
10 complete-page proof regions (all nine fractions), question 8's three diameter
and three neutral model images, and question 3а's three initial page images.
The question 10 proof crops preserve native text size, including on desktop;
the title first screens were viewed together as a contact sheet.

To check the shared CSS beyond the corrected cards, the reviewer compared the
fresh and initial evidence images:

- The **30 complete-page screenshots** for the ten cards other than 3а, 8 and 10
  are byte-identical. This includes the narrow-width radical formulas in 3б.
- **132 of 135 model drawing regions** are pixel-identical. Only the intended
  three question 8 diameter drawings differ. Thus previously reviewed
  constructions and labels did not change under the shared CSS.
- The fresh full manifest has 182 byte-identical images and 34 differing images.
  Extra differences outside the intended card/text changes are below the model
  drawing regions, in controls or bottom-edge crops; they do not represent
  additional geometry changes. This follow-up does not claim a second
  full-resolution manual inspection of all 216 images.

The original review's physical-device, arbitrary-camera, screen-reader and
viewport-height limitations remain. Mergeability reported by GitHub is separate
from this content verdict; no remote-main freshness or virtual-merge approval
was performed by this reviewer.

### Checks and identity

PASS: independent Q8 coordinate/neutral-exposure checks, Q3а title check,
unchanged-card comparison, source/proof-field comparison for Q8, raw-card and
image hashes, inspected fraction styles/assertions, supplemental draft and math
gates, and whitespace checks. No inherited assertion was weakened. The static
gate still preserves all 640 published cards and leaves all review flags pending.
There are **no remaining source, mathematics, coordinate or rendered-pedagogy
blockers** for these thirteen editorial cards at this candidate.

The original raw-card table above remains the mapping for eleven unchanged
cards. Replace only its 3а and 8 entries with the corrected hashes below.
Question 10 remains
`9cf271019723fae4b9f1e48502fb9fe8fa187b96b65fe5eefc90953528ecb1f1`;
its correction is in preview CSS. The complete six-file executable correction
set is bound here by exact-byte SHA-256:

| File | Corrected SHA-256 |
| --- | --- |
| `content-drafts/atanasyan-chapter-iv-selfcheck/ex-selfcheck-iv-03-a.json` | `fb7c2a9c058c84f767bf4e8bad390dbd6b390aed76810888832db46cb322b782` |
| `content-drafts/atanasyan-chapter-iv-selfcheck/ex-selfcheck-iv-08.json` | `2f09d9fab3d535e9acbc1520648f02c71b9d5a806e1fe5d360e1c1eb8694f801` |
| `content-drafts/atanasyan-chapter-iv-selfcheck/preview.css` | `3cc82bbba6e3e40e27694ef8acab03c5968bc80c1b06fbcab31cc02c911e9817` |
| `tools/atanasyan-chapter-iv-selfcheck/browser.cjs` | `327cddbc0fe52456f5051907868c67f9ee151eea8db9b93cbc739ed279e216cd` |
| `tools/atanasyan-chapter-iv-selfcheck/math.test.py` | `d0c750068c8eef076bfd44bc8d7fd3a64468c0af4294330160d8bdb92cfbedee` |
| `.github/workflows/atanasyan-iv-selfcheck.yml` | `8064df77049f27ad0d85000195689b446cfcf6cf07f60078dbc4ed7a457d26a5` |

The initial report bytes, before this append, have SHA-256
`677addc736a61985a4a712b819845ea9e0d22626730a3b7ac78a2bc2ee185de2`.
The reviewer changed only this report to record the follow-up. Review-status
promotion, source contracts, compiled bundle, historical projections and full
integration/release gates remain the executing agent's separate work.

```text
Task: ATANASYAN_CHAPTER_IV_SELFCHECK focused independent follow-up
PR: #402
Base: 1577c058309f4cc78c21315bf64b0b393751ec2d
Head: 97e0da6bb64fa3dec3f919bd812e6ee2f426696c
Tree: c0ea1edb21fc2c143997b2aaf78e461b8ed9d67d
Gate: PASS — independent editorial source/math/model/pedagogy review
Tests: bounded diff, Q8 coordinates, all nine actual Q10 fractions, Q3a first screens, hashes, image comparisons, draft/math gates
Failures: none remaining; historical B1/N1/N2 resolved
Not run: fresh local browser; production integration/release gates; remote merge freshness
Scope deviations: none by reviewer
Recommendation: proceed to separately checked integration of the reviewed card content
Next user decision: no merge or deployment permission is granted by this content review
```
