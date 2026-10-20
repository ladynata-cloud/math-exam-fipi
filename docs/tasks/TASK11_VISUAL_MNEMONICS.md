# Task11 smiles, vertex guidance, Dalí and the y-axis

## Identity

- Date: 2026-10-21 (Asia/Novosibirsk).
- Base: main, da13ca38669bb648e80bc78dc4b8b3f42e6df8c1 (published PR281).
- Branch: feat/task11-visual-mnemonics.
- Review: MEDIUM, bounded pedagogical aids inside existing optional help.

## Owner direction and goal

Add happy/sad smiles and smileys for parabolas, and Salvador Dalí's moustache
as a memorable image for hyperbolas. Include a real portrait and brief biography
behind an optional same-page disclosure. Keep the initial matching task minimal.

The owner also requests guidance beside the parabola vertex x-coordinate and
a reference-material link, with a suitable first trial-lesson sequence. Teach
the side first without arithmetic: opposite signs of a and b put the vertex
to the right of the y-axis; equal nonzero signs put it to the left; b=0 puts
it on the axis. The owner's suggested left/right wording was corrected in
conversation. Exact x=-b/(2a) belongs in optional deeper help.

The owner clarified that the proposed axis mnemonic concerns an additional term
in the denominator, not the magnitude of the numerator. Implement an accurate
comparison of 1/x and 1/(x+2): the second crosses the y-axis; the first does not.
Do not teach that a hyperbola attaches to or touches its asymptotes, or that every
expression other than x in the denominator creates an axis intersection.

## Scope and acceptance

- Parabola helper shows a happy smiley for positive a and a sad smiley for
  negative a. A deliberate mood-change action flips only a; the graph follows.
- Shared optional vertex guidance is available in contextual help, the general
  laboratory and the existing build-a-parabola x-coordinate step. It guides
  recognition of a and b, sign/side prediction, and optional formula,
  substitution and a graph check. Fractions use bars; opening help does not
  fill an answer or change the original model.
- First trial-lesson recommendation: smile/direction, then vertex side, then
  a similar independent matching problem. No forced calculation or new
  compulsory onboarding sequence is introduced.
- Hyperbola helper uses the moustache image and an optional comparison of
  denominators x and x+2, clearly labelled as a separate example.
- The comparison uses exact curves, split at the pole, distinguishes the
  y-axis from the shifted vertical asymptote and marks (0; 0.5) when relevant.
  It never changes the original matching problem, answer or progress.
- Portrait and biography are collapsed initially, have source attribution,
  readable mobile presentation and remain available in downloaded HTML.
- Existing inline placement, model controls, independent function states,
  nested help, changed-formula label/reset and matching/exam contracts remain.
- No question-bank expansion, backend, cabinet or board changes in this task.
  The owner's board-status question is a separate read-only audit.

## Checks and review

All task11 Node/math tests and existing browser gates; focused mnemonic tests
for all coefficient-sign combinations and b=0, vertex coordinates, retained
inputs, correct y-intersection and undefined pole, split
paths, optional portrait, saved HTML. Browser controls at320/360/1280px and
representative screenshots. Independent mathematical and product review,
git diff --check, full-tree identity and published asset/live UI verification.
Synthetic checks do not prove a learning effect.

Claude use remains deferred by the owner's current instruction until creative
difficulty. No provider request, paid call or external approval is claimed.

## Portrait and biography provenance

- Photo: Roger Higgins, New York World-Telegram & Sun staff photographer,1965.
  Library of Congress digitalID cph.3c14985 / LC-USZ62-114985.
- Source:https://www.loc.gov/pictures/item/95513802/
- Copyright evidence:https://commons.wikimedia.org/wiki/File:Salvador_Dali_NYWTS.jpg
  identifies the staff photograph as public domain under the collection's
  instrument of gift. This is not a CC0 designation.
- Original service JPEG:
  https://tile.loc.gov/storage-services/service/pnp/cph/3c10000/3c14000/3c14900/3c14985v.jpg
  (807x1024,113621bytes), visually inspected, embedded without alteration.
- Biography:https://thedali.org/about-the-museum/timeline/
- Painting/date:https://www.moma.org/collection/works/79018
- Sources checked2026-10-21. Biography is a short original Russian paraphrase.

## Vertex reference provenance

- Official FIPI overview:
  https://fipi.ru/oge/demoversii-specifikacii-kodifikatory
- Mathematics project for OGE2027:
  https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/ma_9_2027.zip
- The downloaded demonstration PDF was visually checked: physical PDF page2,
  printed page3/22, reference materials / algebra / parabola vertex abscissa.
  It contains x0=-b/(2a). The current2027 material is labelled a project.
- No direct official standalone OGE PDF was found. The external download is
  clearly labelled as a ZIP; the instructional formula and worked steps are
  also embedded locally, so external navigation is optional.

## Risk, rollback and permissions

Main risks: an overly literal visual metaphor, a line drawn across an undefined
point, unintended changes to task state, clutter or broken offline image.
Focused checks and clear example labels address these. Normal frontend revert;
no data migration. Current requests authorize changes and standing explicit
cloud publication permission persists. One branch/PR, exact-head gates, normal
merge after authoritative main comparison. No force, rebase, admin override,
weakened tests or recursive status-only PR. Final identities and publication
evidence belong in the PR.
