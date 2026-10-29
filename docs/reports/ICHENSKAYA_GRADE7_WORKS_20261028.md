# Ichenskaya grade 7: independent and test works

Date: 2026-10-28 (Asia/Novosibirsk). Review level: **HIGH**.

## Result and release boundary

Prepared a second source course alongside the bounded Atanasyan course. Every
numbered task in the supplied independent and test works has its own condition,
source coordinates, original geometric model, retained writing, answer and
task-specific explanation. The pupil can change courses without replacing the
selected cabinet profile or losing either course's records.

This is prepared code, not a production release or evidence of pupil learning.
No real pupil was configured and no external model request was made. The shared
helper retrieves reviewed explanations for the selected task and step; it is
not a newly trained neural network or an evaluation of external models.

- Task: [ICHENSKAYA_GRADE7_WORKS](../tasks/ICHENSKAYA_GRADE7_WORKS.md).
- Branch: `feat/ichenskaya-grade7-works`.
- Base: `feat/atanasyan-first-steps-cabinet`, exact commit
  `11ee0d51a63e73b30dc4db94c4463fac894bf4bf`, Draft PR
  [#363](https://github.com/ladynata-cloud/math-exam-fipi/pull/363).
- The dependency stack #358 / #359 / #360 / #363 remains unmerged. Final head
  and remote CI belong in the new Draft PR to avoid a self-referential commit.
- Architecture: accepted ADR 0011 and the existing native source-course pattern.
  ADRs 0001 and 0006 remain Proposed.

## Source inventory and boundaries

Source: M. A. Ichenskaya, *Geometry. Independent and test works. Grade 7*,
Prosveshchenie, Moscow, 2018, ISBN 978-5-09-037118-6. The supplied scan contains
28 PDF pages and has no text layer. The colophon states 48 printed pages. A
numbered edition is not printed and has not been invented.

The manifest distinguishes PDF pages from printed folios. Printed even pages
4–44 are absent from this file; they are not assumed blank. Nevertheless, the
available pages contain a continuous inventory of all S-1–S-17 and K-1–K-6
works, both variants and every numbered task. Conditions and diagrams were
read from the scans and independently compared with the authored cards. No
uploaded PDF, scan image or private file path is included in the repository.

| Included material | Count |
| --- | ---: |
| Independent works, S-1–S-17 | 17 |
| Test works, K-1–K-6 | 6 |
| Variants, two per work | 46 |
| Independent-work tasks | 74 |
| Test-work tasks | 36 |
| Numbered task cards | 110 |
| Individual explanation steps | 360 |
| Geometric model views, including initial views | 470 |
| Tasks assigned by the author to Atanasyan points 1–23 | 54 |
| Tasks on later grade-seven material | 56 |

Lettered subparts remain inside their numbered task, including construction
existence cases. The separate final-examination section contains 21 tickets
with 63 prompts; it is inventoried but excluded from the requested independent
and test works. This is not a claim that all 48 printed pages or the final
examination have become a course.

S-1–S-10 and K-1–K-2 are labeled as accompanying the primary course. S-11–S-17
and K-3–K-6 are labeled as later material. The primary Atanasyan route remains
at exercises 1–160 and theory points 1–23; its 255-card snapshot is unchanged.
One source task in the first group needs a later theorem, disclosed below.

### Reproducible source identity

- Supplied PDF SHA-256:
  `f3124410a12eeb8cb79a7282d63b3dc0b106871dc74ded526788ddaee23d877e`.
- Source manifest SHA-256:
  `7076005f4811effc4011d716b405aa20793a7882f5b69fa79cf003d583edc4d5`.
- Authored-content SHA-256:
  `7ecb1900f9ca6c35b14412c407608f6c71dfcc0ef568135752d45ce5c0f57d74`.
- Compiled course SHA-256:
  `2e2a82eb755d92975edb8da78984ea8367c59a223dcd859ce48b6aad18383c57`.

The builder requires all 23 content files and 110 exact manifest IDs. A content
review receipt must match both authored bytes and manifest bytes before cards
can be marked reviewed. A draft build remains explicitly draft and is rejected
by both the learner adapter and the source helper. An independent enumeration
checks work/variant/task coverage separately from the manifest. The generator
does not read or distribute the scan.

## Source ambiguities and answer-key discrepancies

The mathematical givens are preserved. Where the printed answer assumes a
different condition, the explanation makes that distinction visible.

| Source task | Handling in the explanation |
| --- | --- |
| S-4, variant 2, task 3 | The given lengths are AN = 13, NB = 12 and AB = 8. The answer is no; the printed yes is inconsistent with the stated betweenness requirement. |
| S-5, both variants, task 1 | The source does not specify the half-planes of the rays. Both configurations are retained: 53° or 103°, and 48° or 112°. The key lists only the first configuration. |
| S-9, variant 2, task 1 | The third angle is 110° using the triangle-angle sum. Its later prerequisite, Atanasyan point 30, is named explicitly even though the author's allocation places this work at points 19–20. |
| S-10, variant 1, task 2 | The printed radius is 6 cm. Chords of lengths 4, 6 and 8 cm therefore each give two possible centers. The key's diameter/impossible cases would fit radius 3, which is not silently substituted. |
| K-4, both variants, task 2 | The strict inequality needs K inside the side. The explanation names the interior-point assumption and shows the endpoint that produces equality. |

An independent source comparison also corrected a transcription of D as P in
S-3, variant 2, task 2 before review. The final conditions and models use
angles DBA and DBC. Source-sensitive regression assertions preserve these
readings and explanations.

## Learner behavior and retained work

The cabinet shows both course entries for the existing Atanasyan selection.
The companion supports selection by work, variant and task, text search,
independent/test filters, the 54/56 curriculum boundary and a saved-work filter.
Navigation stays in the cabinet. Each task keeps its condition, drawing and
written solution visible while steps and their reasons are opened in order.

The new browser namespace is distinct from the primary course and from other
accounts. Text, per-step writing, revealed explanations, assistance and model
state survive navigation and reload. Export is available. There is no automatic
legacy import into the new collection. Browser records are not represented as
server-saved cabinet attempts. Existing conflict recovery and truthful
memory-only feedback apply when persistent storage is unavailable.

Opening help records assistance. Proofs and constructions remain for manual
review; completing the walkthrough does not award an automatic correct mark
or independent-work credit. Models are schematic aids, not measurements used
as proof. The final answer is available for comparison after the walkthrough.

Teacher preview is read-only, checks ownership and retains its preview identity
when changing courses. It does not read pupil-local work or acquire the pupil's
helper API. Public pages also receive no authenticated helper API. Unknown,
mixed and late routes cannot mount another account's task.

- Native routes: `#ichenskaya-course` and `#ichenskaya-lesson=<source-id>`.
- Prepared public companion: `/geometry-course/ichenskaya-7-works/`.
- Browser namespace: `mathExamIchenskayaGrade7Works.v1`.

These routes are prepared destinations, not evidence of production deployment.

## One source helper for both courses

The persisted profile ID remains `atanasyan-first-steps`, now labeled for both
Atanasyan and Ichenskaya. It accepts exactly two source-course namespaces. The
original 255-card validator, exercise 1–160 boundary and theory 1–23 boundary
are preserved. The new source has its own exact 110-card inventory, book,
work/variant/task mapping, source pages, topic and independently pinned digest.

The browser sends a course ID, lesson ID and step index. The cabinet resolves
the condition from its packaged source. The independent assistant verifies
the same context against its minimal snapshot and pinned manifest. A forged
condition, mismatched course/topic/snapshot, unknown task or out-of-range step
cannot select another explanation. Minimal knowledge copies contain the
reviewed text needed for help; the private PDF is not a runtime dependency.

Both courses use the same learner setting, enrollment cap of three pupils,
daily quota and replay protections. Switching courses does not create a new
quota or require a second pupil enrollment. Authentication, teacher ownership,
CSRF, permission versions, active-assessment blocking and late-revocation
checks remain in force. Source-only permission is enforced in the UI,
configuration, request validation and independent service/model boundaries.

Three hint levels explain the next action, its reason and the current step.
A full walkthrough requires an explicit command. Changing task, step or course
keeps prior writing but does not reuse a stale answer in another context. The
helper does not claim arbitrary conversational or proof-grading capability.
No external provider or trained weights were added in this task.

## Review and validation

All 110 tasks received a source and mathematical review independent of their
author: one reviewer checked the first 54 against PDF pages 4–10 and 15–16;
another checked the remaining 56 against pages 10–14 and 16–18, with the printed
answer key on PDF page 26 used as a secondary check. The review addressed
proofs, right-angle/equal-side assumptions, external altitude feet, endpoints,
degenerate triangles and the number of construction solutions. No unresolved
mathematical finding remains. The receipt records internal review and explicitly
does not claim external release approval or a real-pupil learning trial.

| Check | Result |
| --- | --- |
| Deterministic source build and independent inventory | PASS; 23 works, 46 variants, 110 cards, 360 steps |
| Independent numerical and coordinate checks | PASS; 332 checks across all 110 cards |
| Planar model validation and retained step states | PASS; 470 views and all 360 step states |
| Combined primary/companion source, runtime and cabinet tests | PASS; 24 runner checks, including nine primary state and six primary runtime groups |
| Existing fixed-92a adapter and picker | PASS; 11 checks |
| Original primary source and sealed textbook build identity | PASS; original 255-card projection and sealed source unchanged |
| Sitemap reproducibility | PASS; 12 regression checks, 530 canonical URLs |
| Public SEO and static catalog | PASS; 30 entrances, 191 links, 555 canonicals and 69 catalog destinations |
| Assistant-service full suite | PASS; 119 checks, zero failures |
| Board-server full suite, including packaged runtime integration | PASS; 333 checks, zero failures |
| Helper browser suite | PASS; 16 scenario groups |
| Every source step through both independent helper schemas | PASS; 4,636 accepted hint/full responses, including 1,440 for the companion |
| Actual local two-service browser path | PASS; 15 requests, shared profile and quota across both courses, zero provider calls |
| Actual companion browser journeys | PASS; 16 public and 16 native journeys, two course-switch roundtrips and read-only preview |
| Primary course actual-browser regression | PASS; 12 public and 12 native journeys plus read-only preview |
| Independent build/review failure tests | PASS; missing receipt, stale authored/manifest digest and pending mathematics reject strict publication |

The initial all-step fixture incorrectly opened help without setting its
assistance flag. It was corrected to model a legitimate learner state; the
existing normalization guard was retained. A mistyped SEO command and a missing
test-only NODE_PATH were invocation issues; the actual repository SEO commands
passed with the pinned dependencies. No failing product check was waived.

The first companion browser run exposed a fixture race immediately after a
hash change. The assertion now waits for the expected course entry to render
before counting both entries. Its complete rerun passed all 32 journeys; no
application assertion was removed or relaxed. Changed shared scripts also have
new cache tokens so a previously cached primary renderer cannot break the new
adapter after sequential releases.

The companion browser cases cover S-1/v1/1, S-7/v1/2, S-9/v2/1, S-10/v1/1,
K-2/v2/3, S-13/v1/2, S-16/v2/2 and K-6/v2/4 at 1280 px and 390 px in both
public and native routes. The checks compare exact displayed conditions,
enter actual text, restore writing, expose all steps, retain drawing state and
reject horizontal overflow and clipped labels. Two roundtrips preserve work
in both course namespaces. Teacher preview has zero course-storage or helper
calls. There were no page errors, unexpected API requests or external browser
requests. Independent visual inspection covered ten page screenshots and twelve
separate drawing screenshots, including final construction states. Text, fields
and point labels remained readable without overlapping controls or clipped
labels. The neutral K-2/v2/3 triangle reserves space for later circles; zoom and
fullscreen remain available. No blocking visual finding remains.

The service path uses one synthetic pupil while changing from the primary
course to the companion and back. Persisted settings and subject identity stay
the same; the remaining daily allowance decreases across courses. The full
output sweep covers all 799 primary and 360 companion steps at three hint
levels and full-response mode, with independent service and cabinet output
validation. It is a protocol/content-shape check, not automatic proof grading.

Representative repeatable commands:

```sh
python3 tools/ichenskaya-grade7-works/build.py --check
python3 tools/ichenskaya-grade7-works/math_audit.py
node tools/ichenskaya-grade7-works/source.test.cjs
node assistant-service/scripts/build-course-knowledge.cjs --check
node --test --test-isolation=none tools/atanasyan-first-steps/*.test.cjs tools/ichenskaya-grade7-works/*.test.cjs
node tools/ichenskaya-grade7-works/browser.cjs
npm --prefix assistant-service test
npm --prefix board-server test
node tools/learning-assistant-browser.test.cjs
node tools/learning-assistant-e2e.browser.cjs
python3 tools/build-sitemap.py --check
git diff --check
```

Browser tooling is pinned to jsdom 26.1.0 and Playwright 1.55.0. Screenshots and
test accounts stay outside source control. The new CI workflow repeats exact
source, mathematics, model, retained-work and actual desktop/mobile checks.
The existing assistant and unified-learning container jobs additionally resolve
both course snapshots in their isolated packages. Actual Docker construction
is unavailable locally; remote conclusions must be taken from exact-head CI.

## Production reconciliation, remaining review and rollback

Authoritative remote main was read as
`8723d6bfb19e64d43c474b1fc7116fe8630ec20a`. The public textbook bundle, engine
and attached-course router returned HTTP 200 and matched that main byte for
byte. The separate stacked branch does not silently import concurrent main
changes. No production write or real account configuration occurred.

Required external HIGH review and Claude design consultation remain unavailable
and incomplete. No copied approval, earlier exception or internal content
receipt substitutes for provider/PR/base/head/verdict/source evidence. A current
reasoned owner exception would be a separate explicit decision. Merge and
deployment also require separate owner authorization.

Not run: real-pupil binding, production deployment, external-model quality or
billing, and learning-outcome trials. After release, privately verify the
intended existing pupil account and current profile version, retain the existing
Atanasyan selection, and enable its shared source helper within the enrollment
limit. An authenticated teacher session is required for that operational step.

Rollback removes the companion entry and its helper allowlist or reverts this
patch, preserving both course namespaces, cabinet work, quotas and replay data.
There is no database migration, forced Git operation or protection bypass.

Final preparation marker: **`ICHENSKAYA_GRADE7_WORKS_PREPARED_OK`** after the
reported checks pass. Final head and CI conclusions belong in the Draft PR.
