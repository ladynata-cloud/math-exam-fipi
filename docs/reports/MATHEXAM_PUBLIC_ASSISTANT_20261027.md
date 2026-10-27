# Public navigation helper — preparation evidence

Date: 2026-10-27 (Asia/Novosibirsk).
Task: [MATHEXAM_PUBLIC_ASSISTANT_V1](../tasks/MATHEXAM_PUBLIC_ASSISTANT_V1.md).
Review: HIGH. Branch: `feat/public-assistant-20261027`.
Base: `1fcc4fa36267f5667c42409861ef0b92f97b333c`, cabinet-preparation PR #360 dependency.
Public-helper Draft PR: #361.
Final head and exact-head CI evidence belong in the Draft PR to avoid a
self-referential commit identifier in this file. Full CI for the final published
head remains pending at this preparation checkpoint.

## Result and boundary

MaxExam 0.0 is prepared as a chat-style public navigator. It selects checked
learning materials and can suggest the existing tutor contact route after
repeated explicit difficulty or a direct request. It is closed by default and
labels itself as a navigator. It makes no live model call, invents no current
exercise solution and does not claim to train model weights.

The implementation and maintenance boundary are documented in the
[operator guide](../../assets/assistant/README.md). OpenAI, GigaChat and Qwen
remain proposed teaching-model candidates. Their adapters, credentials, terms,
evaluation evidence and spending decisions are separate work. The prior finite
DeepSeek synthetic-evaluation authorization does not cover these providers or
public/pupil traffic.

## Coverage

- 592 public HTML documents: 526 of 528 sitemap documents and 66 further verified
  public entries. The manifest includes 169 documents under trainers/, plus
  textbook/course pages, topics, articles and public entrances. Two public
  textbook shells are explicitly deferred; the requested complete rollout has
  not been achieved.
- Reconciled JavaScript-only entries include the public grade-nine exercise
  shell, spatial-geometry lessons, vector prerequisites, base-EGE data practice,
  arithmetic repair/diagnostic routes and the working multiplication elevator.
- Empty multiplication-table index/Pythagoras/times-nine placeholders are not
  treated as functioning trainers. In the helper's catalogue their three intents
  use working multiplication materials. The navigation catalogue covers the 51
  live unique directions from the existing trainer catalogue and links to the
  existing course-catalogue directions. A valid destination link does not imply
  that the helper is installed on that destination.
- Private/teacher/board/source/archive/export/redirect surfaces are excluded.
  Existing but unlisted and unreviewed pages are not silently published.
- All 828 existing HTML files match their base Git blobs after removing the exact
  helper block. This includes the two deferred shells, which contain no block.
  Mathematical content, styles, scoring, canonical metadata, sitemap and original
  links are preserved.

### Explicitly deferred textbook shells

| Page | Reason and source of boundary | Preserved SHA-256 |
| --- | --- | --- |
| `geometry-course/textbook/index.html` | `tools/geometry-textbook/build_course.py` binds the exact implementation to existing chapter reviews covering 569 cards. | `4ad96a76e0b5e3f791aca172a884a2e66c93fcd75cb2efd83cbfb393a7a8fe5b` |
| `stereo-course/textbook/index.html` | `tools/stereo-textbook/polyhedra-practical-content.test.cjs` enforces the existing immutable runtime baseline. | `daee3fb225e5b7a0d5129af24d2cdf5961eb5b74d195a863e22317313d1e1825` |

Both current files are byte-identical to the named base. Their original hashes,
existing review records and frozen-runtime baselines are preserved. No generated
`course.json`, review hashes or approval records were changed. The integration
does not strip helper tags out of review hash inputs or treat old reviews as
approval of changed implementations. Further inclusion needs a separately
reviewed change to these boundaries; links to the existing textbooks still work.

## Validation evidence and its limits

The following are completed local or earlier-head results. They are not a claim
that the final working tree has passed every CI job. Exact-head evidence must be
recorded after publishing the final revision.

- Pure navigation tests: 15 groups, covering fixed destinations, nonempty HTML,
  PDF signatures, real hash routes, subject/exam priority, privacy handling,
  ambiguity, referral consent/frequency and absent hidden state.
- Coverage and SEO/scope-boundary tests: eight cases. The static-explanation gate
  permits only the exact deferred data/widget pair and the pre-existing optional
  funnel observer. Inline scripts, foreign origins, changed attributes/versions,
  partial/reversed pairs and duplicates still fail.
- Existing sitemap tests: 12 cases. Sitemap check retains 528 canonical URLs.
  SEO check verifies 30 entrances/topics and 553 public canonical declarations;
  the optional base-preservation check also passes.
- The final local helper run passed 11 groups on Playwright 1.62.1 / Chrome
  headless-shell 151.0.7922.34 after both explicit deferrals. Runtime admission
  checked all 592 manifest files and their directory aliases. The suite covers
  actual home, decimal and Peterson routes,
  390px layout, safe rendering/links, in-memory clearing, bounded history, contact
  frequency, keyboard isolation, iframe/private suppression and retained trainer
  task/draft/progress. The unchanged protected textbook is checked for absence of
  the helper; separate synthetic injection exercises the keyboard conflict. The
  suite uses no real visitor or pupil record and makes zero model calls.
- Targeted compatibility reruns passed the EGE link gate (85 checks), division
  route and fraction-display DOM suites (26 groups), and the Makarychev suite
  (2,208 mathematical cases, 7,022 intermediate-answer checks, 24 guided browser
  journeys and 48 layouts). The algebra textbook's six full guided DOM paths and
  both profile-input form handlers also passed after their URL loaders were
  corrected. These are scoped results, not substitutes for full CI.
- The full practical-trainer browser gate passed all 39 route/viewport cases at
  320, 360 and 1280px on Playwright 1.62.1 / Chrome headless-shell 151.0.7922.34.
  Original control, hit-test and horizontal-overflow assertions remain enabled.
- Task 6 and Task 13 targeted suites passed all 65 cases. Picker/board parity,
  EGE release journeys, work-rate journeys and foundation checks passed after
  their narrow fixture corrections. Percentage source preservation passed all
  five groups, including 126 negative cases for altered helper markup; original
  mathematical and frozen-hash expectations were not changed.

An initial SEO run correctly rejected the new script pair because the older
policy allowed only the funnel observer. The exact reviewed pair is now an
explicit exception, with rejection tests for all broader script changes.
Mechanical insertion exposed existing inline whitespace as trailing whitespace;
moving the insertion boundary retained all original bytes and restored the gate.
These were resolved integration findings, not skipped checks.

### Findings from the first integration CI

| Class | Narrow correction and retained checks |
| --- | --- |
| Browser URL resolution in test loaders | Root-relative `/assets/assistant/` URLs now resolve from the site root; relative assets resolve from the page. Same-origin and repository-path fences remain. Every published script executes in order; missing and foreign resources still fail. This covers the affected EGE, school, picker, division and input fixtures. |
| Strict asset lists and runtime parity | The exact reviewed data/widget pair is recognized with its required order and version. Unrecognized scripts, altered URLs and unexpected markup remain failures; mathematical and progress assertions are retained. |
| Historical Task 6 task scope | The unchanged original allowlist is checked against PR #287's immutable reviewed base/head range, rather than against later unrelated tasks. The current helper task has its own scope gate. |
| Browser hit-tests | Test hit-tests descend through open Shadow DOM so a visible helper control is compared with its actual hit target. Obstruction and control-size checks are retained. |
| Existing narrow-screen diagnostic overflow | The same 340px document width at a 320px viewport occurred with exact base HTML and with the helper. A two-line page-scoped rule in the existing stylesheet permits the diagnostic mode buttons to wrap. No HTML, mode logic, font size or layout assertion changed. All 39 practical browser scenarios then passed in the CI browser version. |
| Generated page preservation | `tools/stereo/build_site.py` emits the same exact helper block as the coverage tool, preserving reproducible generation. The existing generated-output diff check remains. |
| Standalone offline export | The Pogorelov exporter strips only the exact optional helper block and rejects duplicates or unrecognized helper markup. It does not broadly remove scripts or rewrite course content. |
| Locked browser runner | The Soviet-math workflow pins `ubuntu-24.04` for its locked Playwright 1.55 runtime; content, browser and video checks remain enabled. This adjustment still needs confirmation in the final-head CI run. |

### Still open or outside the current correction scope

- Full CI for the final published head remains pending; the first failing run
  and earlier local passes are not a final green result.
- The initial Task 24 t13 proof-chain failure at 360px was not reproduced in
  targeted comparisons with the helper and exact base HTML, including six card
  orders with both variants on the exact CI headless browser. Each chain reached
  all seven cards; no launcher interception or page error occurred. No speculative
  runtime correction was made. The unchanged full 168-case proof gate explicitly
  requires cloud CI; its new-head result remains pending. Local CI flags were not
  fabricated to bypass that boundary.
- Additional older progress diagnostics outside the CI workflow exposed
  pre-existing canonical/anchor failures. They were left untouched and are not
  counted as passing checks for this task.

## Review and rollout conditions

Internal agents independently reviewed data/navigation, safe links, privacy and
keyboard compatibility. Their findings are implementation evidence, not an
external exact-head approval. A concrete geometry-viewer capture-phase Escape
conflict and a normalized double-slash URL edge case were repaired and covered
by regression checks. Duplicate script attributes are rejected by the SEO parser,
and CI also watches the JavaScript sources that establish checked public routes.
Normal [desktop](assets/mathexam-public-assistant/desktop.png) and
[mobile](assets/mathexam-public-assistant/mobile.png) screenshots accompany the
browser evidence. The final Draft PR must record exact-head CI results when that
run is complete; they are still pending at this checkpoint.

Remote main remained `92d733a49692744ce043503c57f29b77bfb09a24` during preparation.
Read-only production index/sitemap/robots evidence matched the existing released
state. No public launch, provider request, key purchase, infrastructure change or
real-account activation was performed.

HIGH external review and separate owner merge/deployment authorization remain
required. No account access or payment review is bypassed by presenting a static
chat interface. See the guide for analytics limits, precise rollback and future
resource separation.
