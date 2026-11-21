# Public navigator across reachable learning pages

## Identity and authorization

- Owner: Наталья Михайловна; date: 6 November 2026.
- Task: `PUBLIC_NAVIGATOR_ALL_PAGES`; review level: MEDIUM.
- Branch: `feat/public-navigator-all-pages`.
- Preparation base: PR441 head `f9f3aae35e6f35efcf55b0fc5f70019c906d3245`.
- The owner requested completion of unfinished work and authorized publication,
  with external provider review waived. The coordinating agent owns exact-base
  reconciliation, merge and production release. This branch does not merge itself.

## Goal and evidence

A visitor can open the existing local MathExam navigator while using a public
course or trainer, including a direct visit from search. The existing helper
uses local catalogue rules and does not call a model service.

An actual browser crawl found 613 public HTML documents from the sitemap and
their rendered links. Source inspection identified 13 additional public
destinations reached through course buttons, lesson-specific prerequisites or
popup trainers; following their links added the river laboratory. All 627 routes
loaded locally. The inventory includes 550 of 551 sitemap routes; Peterson keeps
its existing task-aware helper. The count is documents, not exercises or a
claim that every authored course is complete.

## Approved scope

- Add only the two current deferred navigator script includes to 609 documents;
  preserve the 19 already integrated documents.
- Record the full 628-page inventory, discovery provenance and exclusions.
- Preserve every other byte in the added HTML documents: mathematical content,
  sources, inline engines, controls, styles, links and saved-work identifiers.
- Keep historical source/review hashes by strictly inverting only the exact
  include pair, bound to the entire before/after payloads. Add negative controls.
- Test actual routes at desktop, narrow mobile and landscape widths in four
  browser shards, plus existing mathematical/source gates and helper regressions.

No new teaching, assistant rules, model calls, account flow or data migration.
Immutable book editions/aliases, cabinet and board shells, existing Peterson
helper pages, offline packages, redirects, empty files and unlinked legacy
duplicates are excluded. The manifest is `assets/assistant/page-rollout.json`.

## Acceptance and gates

- Exactly one working navigator on each inventoried top-level public page.
- Launcher and dialog fit all three viewports; keyboard, lookup, privacy handling,
  closing and clearing remain usable; no additional launcher in an embedded page.
- The exact new include pair can be removed to recover the original full payload;
  wrong attributes, missing/duplicate scripts or any other content change fail.
- Existing mathematical fixtures, source hashes and review receipts remain intact.
- Required: preservation tests, 43 navigator dialogue regressions, four actual-route
  browser shards, affected mathematical/source/persistence gates and diff check.
- Gate: `PUBLIC_NAVIGATOR_ALL_PAGES_OK` only after all required checks pass.

## Review and rollback

MEDIUM: broad visual integration without new learning sequences or persistence.
No trainer design consultation is needed. Real pupils and physical devices are
not claimed. Main risks are legacy CSS/event interactions and historical
whole-document checks; isolated shadow styling, full route checks and exact
byte inverses address them. Rollback is an ordinary revert of this scoped delta.

## Execution

Results, final head, composed base and production acceptance are recorded in the
PR and release handoff. External provider review is not performed under the
owner's instruction; a copied marker is not provider evidence.

Preparation checks passed: all 608 original document byte identities and
negative controls; 43 dialogue regressions; 62 current book/math/persistence
contracts; frozen v1/v2 integrity and 10 prospective-book generator tests.
Geometry's existing publication identities remain valid without changing a
receipt; the stereo historical-layout boundary also passes. The script pair
is deferred in the document head (or before the implicit body on two legacy
documents), preserving old inline-script extraction and all teaching bytes.

Full navigator interaction coverage is 1,881 page/viewport combinations in
four shards, with exact comparison against the original page if an existing
load error occurs while external requests are blocked. Source book replay and
final browser/CI results are pending at this preparation commit. Local Chromium
is 134.0.6998.35; CI keeps the pinned current browser. Production is not claimed.

## Integration and future source maintenance

The coordinating agent authorized an ordinary merge of fixed PR441 head
`a7a9355b72e2a65ec97105e4658063a9c65dd908`, which retains published main955.
Exactly six native HTML bindings changed: OGE11, OGE15–18 and task19. The
explicit binding refresh compares every restored candidate document with that
exact source commit and preserves all published homework/shared scripts.
Independent source/math receipts are not regenerated. Further concurrent
landing-page changes must be composed before the final release checks.

The rollout manifest is an audit against a named source commit, not a permanent
ban on later approved content edits. For a later task, implement and review its
source changes and make a source commit first. Then explicitly refresh only the
changed bindings, under that task, in the same PR:

```sh
python3 tools/public_navigator_bindings.py \
  --source-base FULL_REVIEWED_SOURCE_COMMIT_SHA \
  --task docs/tasks/CURRENT_APPROVED_TASK.md \
  --paths path/to/changed-public-page.html
```

The default is a preview; add `--write` to update the manifest. This command
never edits HTML, expands coverage or grants approval. It requires the exact
declared path set, compares all restored documents against the named immutable
Git source, retains the original provenance and records the new source/task
binding. A later source commit may already contain the same exact navigator
pair. Uncommitted or unrelated source changes, changed tags and omitted paths
are rejected; hashes are never refreshed automatically during a test/build.

Re-run the task's independent mathematical/source/publication gates and the
navigator gates before release. A changed mathematical source still fails its
old independent receipt; this helper cannot replace that review. Commit the
explicit provenance update as a logical commit in the same approved task PR.

### Published college course expansion

The coordinator explicitly included the public logarithms course published in
PR460, main `60deda9b2a5eddd7d91790a88500d907edb5e5f9`. It is linked from the
sitemap, the existing catalogue and the college functions course. Ordinary
composition with PR441 head `37b49404aafc868535ad1b9648a7d772d1f97bc6`
retains all published course, board and registry files. The only newly changed
existing HTML binding is the published link in college-functions; the exact
new include pair is also added to college-logarithms. All other document bytes
are preserved against that immutable composed source commit.

The current inventory is 628 public documents: 609 exact new pairs and 19
existing integrations, covering 551 of 552 sitemap routes. The existing
Peterson helper remains the sole sitemap exclusion. The final browser matrix
therefore has 1,884 page/viewport combinations. The original 627-page crawl and
1,881-case preliminary matrix remain preparation evidence; they do not prove
the newly composed final candidate. Further GIF landing changes and the final
exact-head checks remain outstanding at this integration step.

### Composition with the GIF previews

The coordinator supplied GIF head
`fbb56557fab1a17be4a8ca3bc70b22127ced91f8` after composing it with main60.
Its read-only merge with fixed PR441 head37b is clean, producing source tree
`5ab512f629edf98614403f090d144c89a5654b6a`. The immutable provenance commit
`828622eac8a671ff9bcff0ea4620bb42b71a0537` has exactly those two parents and
that tree; it adds no source edits. The navigator branch incorporates this
source through an ordinary merge so both reviewed source lines remain available
to the byte-preservation gate in CI.

The only navigator merge conflict was adjacent includes in the PDF-variants
page head. The resolution reconstructs the complete composed source and adds
only the same exact navigator pair before the closing head. The source-binding
refresh names that one changed page. All four GIF landing integrations and the
new college catalogue card are preserved. No mathematical fixture, source
receipt, navigator runtime or engine is modified by this composition.

### Final source boundary before the browser matrix

The clean source composition now includes fixed OGE head
`269c81bb0e44a3dea62fc422b0366227436f8663`, GIF head fbb56557, and published
Word release main `8d7fdd8c984a83213b1b4fddea371efc2a7f8c25`. Its immutable
source commit is `1a2d8078f0b2259e79a83ddac0cafe3a2a4aff34`, tree
`858a1946744e7b0af14e84c9c48f8f91e1831cbc`. The explicit provenance-only
refresh changed no HTML bindings: all 609 restored documents match this source.
The 19 existing integrations also match it in full. The teachers' materials
page retains the complete published Word-page bytes, SHA256
`961b25fdc22cca269d3850e586308768ac437c2fa4a5fc2e49f9eafb0bd1d567`.

Local source evidence covers 93 distinct learner scenarios after explicit
retries. The first complete run had 89 PASS and four 7-second timeouts; the
first tyre retry also timed out. The original unsuccessful reports remain
separate. Each affected route/width subsequently passed the unchanged runner
without forced clicks or relaxed timeouts. The collected per-case reports are
unchanged, identify each source run, and their 1,383 served resource payloads
match the composed tree. Independent replay: 395 PASS, zero PENDING, FAIL,
missing reports or unreviewed source-derived cases. This does not replace the
complete pinned-browser CI on the final branch head.

## Final route and source verification

The final pure source is `862cec85546ffbb2288360da3a36b1a526b97d6f`, tree
`85210febc6ad52906b7be47fb0b8a93a5e928ee4`. This includes the reviewed
GIF fix `663ab6873b5b2840dd966b747739624a1355bfe1`: of the 628 pages, only
`oge/index.html` changed since the full four-shard run. It was already one of
the 19 integrations; all 19 exactly match the full final-source bytes. The
609 reversible additions retain their complete before/after identities.

The first four shards attempted all 1,884 page/viewport combinations on
`1d931bb66eb647a9f6681911fd3979a7b7c2d125`: 1,877 passed and seven had a
10-second timeout. The original failed reports were retained. On the final
source, all seven affected pages and the changed OGE landing page passed
all three widths in separate runs (24/24); every retry used the same runner,
timeouts and assertions. The union contains 1,884 unique passing cases, not
a claim that the initial four commands passed. The JavaScript errors on three
legacy pages exactly matched fresh loads of the original page bytes; no error
type was allowed globally. Catalogue: 187 routes; dialogue regressions: 43/43;
Atanasyan 255-card and Ichenskaya 110-card source gates also passed unchanged.
Final cloud CI and production acceptance are separate from this local record.

The Git Data transport records the four pure source compositions with server
commit metadata and identical Git trees. The final source tree is unchanged.
The 1,884 browser cases ran on the same public page and resource bytes. Only
this audit record and its JSON provenance references changed during transport;
the validation checks every tracked file outside those two paths against the
local candidate `a2b416e5d2bd73a931b81dbb6add5a162605962c`. Its reproducible
Git bundle blob is `491e66179bcb73b225e9de2a7ba7b02bd0e85d13`, SHA256
`c1d1035dfb32e422ab3b3943540ff6eb7e425e962e3731a1aa7fef3ab3685e93`.

## Course compatibility corrections after the first integrated CI

The first remote integration (`d1b31915`) exposed loaders that treated a site
URL as an OS path; offline builders that packaged online-only navigation; and
checks that selected headings, controls or script inventories across unrelated
interfaces. This follow-up does not change any hosted HTML, runtime, ZIP, PDF,
worksheet, or answer. It corrects the generators and their validation boundaries.

- Reproduce the Vilenkin 5 offline document byte for byte. Rebuild public
  stereometry with its exact hosted includes. The downloads-only builder keeps
  all 54 published trainer artifacts identical to a clean source rebuild: 17
  ZIPs, 17 standalone HTML files, 179 archived HTML entries without the helper.
  Teacher rebuilding likewise preserves five hosted pages and all 16 original
  teacher ZIP payloads, including its five independent offline pages.
- Load fixed local asset URLs relative to the site or current document, as a
  browser would. Reject schemes, alternate origins, encoded/traversing paths
  outside the repository and escaping symlinks. Check exact model order, empty
  external bodies and pinned script attributes; verify the board wrappers omit
  only the strictly byte-bound public addition. A browser hit test follows the
  actual element into its open shadow root; covering siblings still fail.
- Check learner-facing headings inside the actual report or task, and allow
  only the named pair of exact deferred includes on static SEO and task-6 routes.
  The seven profile board wrappers retain exactly the reviewed course model/bridge
  sequence without installing a second navigator (35 picker tests). Original
  assignment, arithmetic, draft persistence, and protected output checks remain.
- Focused browser evidence: 24 grade-7 journeys/48 layouts with 2,208 independent
  task checks and 7,022 answer/step checks; Vilenkin 5 232 views/6 journeys;
  OGE practical 39 route/viewport cases; teacher materials 98 scenarios and
  30 topic-page/viewport cases. The eight nested Azbuka pages also opened over
  file:// offline without network requests or JavaScript errors. Protected historical
  failures were not marked successful. Exact follow-up CI is required separately.

## PR462 final CI compatibility follow-up, 6 November 2026

The owner explicitly requested continuation of this PR, preservation of all 628
pages, investigation of the four failed workflows, and release on validated
current main under the standing authorization. Current main at preparation is
`8d7fdd8c984a83213b1b4fddea371efc2a7f8c25`, already an ancestor of this PR.
The existing composed OGE-return and GIF-preview sources are retained. Retarget
this existing PR from its preparatory stacked base to main for final release.

Confirmed from the completed logs on head 89772ff0:

- OGE minimal workflow 42149418575: Playwright's `header` selector pierces the
  navigator's open shadow root. Select the actual lesson's `main > header`;
  retain all hint, answer, diagram and viewport assertions.
- Profile workflow 42149418231: the file gate incorrectly interprets a root-relative
  web URL as an absolute operating-system path. Resolve against the site root;
  still require every asset and use the existing guarded JS resolver.
- Stereometry workflow 42149418482: the unchanged-UI historical hash includes
  the two approved navigator tags. Invert only the complete hash-bound public
  rollout payload. Both old historical hashes and geometry oracles stay intact;
  extend mutation rejection explicitly to stereo-t14.
- EGE classroom workflow 42149418478: `footer button` also matches the hidden
  navigator clear button. The pending download promise rejects during browser
  cleanup and hides that selector collision. Select the named course export,
  await click and download together, and additionally verify the full exported
  JSON against the actual course state and the expected filename.
- Soviet-math workflow 42149418566 was cancelled while installing ffmpeg from
  the Ubuntu mirror, before any application check. Keep its tests and runner;
  require a completed fresh run, not a cancellation waiver.

No hosted HTML, navigator runtime, mathematics, saved-work keys or resources
change in this correction. No test is disabled and no historical checksum is
replaced. The exact final head, all CI outcomes and production acceptance are
recorded in the PR release evidence. Local browser execution is unavailable in
this execution sandbox (socket permission); the pinned-browser Actions runs
remain required. External provider review and real-pupil trials are not claimed.

### Base movement during final CI

Main advanced through GIF release #461 (`2d7c2e1`) and Makarychev8 #463
(`9ac2080ffaab3eadaa38776de588e9e2be5024aa`). Both are published, approved
work with their own CI records. The GIF source was already composed here.
The virtual merge identified one adjacent-head-tags conflict in
`oge/variants/2027/index.html`; restoring its existing navigator payload gives
exactly the newly published main bytes, so retaining the current document
preserves both releases without a source-binding refresh. The ordinary merge
retains all new Makarychev data/runtime/tests and both status histories.

On e3a1c9d5, the OGE minimal and EGE classroom workflows passed, including the
actual download with full JSON comparison. Another existing contextual-help
browser test reported an unusable quotient-choice hit target once; a single
unchanged retry was requested and the original failure remains recorded. The
new candidate adds exact rectangle/interceptor diagnostics and a viewport
screenshot on that failure; hit-test conditions, scrolling and assertions are
unchanged. No cancellation or retry alone counts as evidence of correctness.
The final composed head requires its own complete CI and navigator matrix.

### Confirmed mobile integration correction

On composed head d73cda8d, contextual job127729397155 reproduced the failure
at320×900. The digit3 button occupied x164–285/y835.1875–899.71875;
its centre was intercepted by `maxexam-public-assistant`, not a scrolling race.
The viewport screenshot and exact hit-target JSON are retained in artifact
13480536598 of run42168093434. The earlier e3a1c9d failure is not dismissed
as flaky; its retry was cancelled when the candidate changed.

The mobile launcher now occupies48×48 px and preserves its accessible name,
label text and tooltip; the full desktop label and panel remain unchanged.
This is a confirmed integration fix to the shared widget stylesheet. It changes
no HTML payload, navigation rule, mathematics or saved work. The navigator
browser matrix additionally enforces the compact width and accessible name;
the contextual gate verifies all ten quotient choices at every tested width,
without changing scrolling, hit-test assertions or using forced clicks.

The full final matrix and affected workflows must run again on this correction.
