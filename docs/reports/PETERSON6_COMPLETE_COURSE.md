# Complete Peterson grade-six first volume: implementation and validation

Date: 2026-10-28 (Asia/Novosibirsk). Task: `PETERSON6_COMPLETE_COURSE`.
Base: `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`.
Branch: `feat/peterson6-complete-course`. Review level: **HIGH**.

Status: **implemented and locally verified before an environment interruption;
restored for the final Draft PR checks**. This report is not publication
evidence, an external approval, or merge permission. The PR body records the
actual recovered head, rerun results and complete-checkout CI after creation.

## What the learner can do

- Open any number 1–497 at `school/peterson6/textbook/`, select a subpart,
  and see its complete source condition and original mathematical figures.
  Desktop places the condition beside the work area; a narrow screen stacks
  them and provides enlargement and a full-page view.
- Solve complex expressions in arithmetic order, including explicit mixed
  number conversion. Optional smaller steps explain the same calculation,
  decimal-to-fraction conversion, common denominators and reciprocals.
  Completing a small step does not submit the main answer automatically.
- Save drafts, notes, the current step, hints and errors. Numeric/choice
  checking is deterministic. Written proofs, drawings and open questions
  remain submitted for human review; their sample answers do not earn credit.
- Open generated practice at `trainers/peterson6-workshop/` and return to
  the exact source number and subpart with retained work. There are 37 skill
  families and three levels. Five distinct solutions, at least three with a
  first correct answer without help, mark a practice topic ready.
- Export/import progress and download a teacher CSV. The source course,
  whole-volume practice and existing Maxim line have separate storage.
  These browser records are explicitly not verified cloud cabinet results.

The already published thirteen-topic `trainers/maxim-peterson6/` line remains
independent. Its only change is a header link to the full book. Its IDs, saved
state, checking, generators and four PDFs are unchanged. The existing
224-task thematic course is also retained; its entry page gains navigation.

## Source and inventory

Source: G. V. Dorofeev and L. G. Peterson, Mathematics, Grade 6, textbook in
three parts, part 1, BINOM, 2019. The supplied PDF has 112 pages.
SHA-256: `852f8db30a68cb9f5d42fe7e02d28eb87a46fdff6aa4707902595e3761cf1d92`.
The original PDF is not included as a downloadable repository artifact.

| Source range | Numbered exercises | Answer records | Expressions | Numeric | Choice | Written |
|---|---:|---:|---:|---:|---:|---:|
| 1–175 | 175 | 884 | 244 | 73 | 19 | 548 |
| 176–339 | 164 | 675 | 155 | 324 | 22 | 174 |
| 340–497 | 158 | 608 | 32 | 398 | 40 | 138 |
| Total | **497** | **2167** | **431** | **795** | **81** | **860** |

An answer record is an instructional unit: a printed subpart, separate
question, requested representation or intermediate result. **2167 is not
presented as the publisher's count of printed subparts.** All numbered source
records have an authored solution/answer mode and explicit coverage flags.

The source viewer uses 84 lossless WebP page assets, 11,954,644 bytes in total.
Every asset hash is checked. Source-index SHA-256:
`43c1cee3b20daaae34a2b90335871beead013fad6fb0e03cae2d90cdbf01b53a`.
The extraction tool requires the pinned source hash and writes images
atomically. It handles text lines crossing number-marker heights, shared PDF
text blocks and section boundaries. No actual exercise continuation across
pages was found in this edition; the viewer still supports multiple regions.

Authoring review covered the source pages for each assigned range. Independent
crop inspection checked numbers 9, 10, 181–183, 240, 347, 406 and 497,
all exercise-page beginnings and the remaining 28 PDF pages. This is not a
claim that all 497 final rendered crops were manually inspected independently.
Small decorative artwork outside a source region is not mathematical data;
the full-page view remains available.

## Mathematical review and source discrepancies

Python `Fraction` independently evaluates all **431 expression trees**.
The separate generator oracle derives answers from the displayed conditions,
not from the production checker: **306 cases** across 17 new families and
three levels, plus four fixed cases and 123 source-answer anchors. Existing
20 families retain the previous 6000-case exact-math gate.

Additional source/key comparison and independent spot checks are documented
in the [source review](PETERSON6_SOURCE_REVIEW.md) and
[middle-range review](PETERSON6_MIDDLE_CONTENT_REVIEW.md). The remaining
authored prose explanations and written-answer criteria have not all received
a second independent mathematical review. No synthetic test is evidence of
learning effectiveness.

Three source warnings are visible to the learner:

- **185(4):** the printed expression is 1/2; the requested 40% is 1/5.
  The book's 0.5 answer does not perform the final percentage operation.
- **186(1):** the printed minus gives 5 + 2 − 2 = 5 and the sought whole 20.
  The key's 36 would correspond to a plus instead of that minus.
- **240:** the printed angle drawing is approximate. A possible pattern and
  its assumptions are explained; this is a written, human-reviewed answer,
  not an exact numeric automatic mark based on imprecise measurement.

The original number 340 includes all thirteen conversions, including
`11 13/17% = 2/17`. Numeric checkpoints include 303 = 210 km, 304 = 40 min,
305 = 18/54 km/h, 306 = 6 h, 226 = 3.2 h, 245 = 12.5 h and
497 = 6200 / 6298.56. These have explicit fixed regression checks.

## Corrections found during review

- Retained completion uses a verified work snapshot; asserted success flags
  cannot manufacture independent credit. Viewing help after a first completed
  success does not rewrite that historical completion.
- Identical choice questions with shuffled options retain one identity after
  merge/reload. A union over 4000 practice records is rejected before mutation.
- Help/errors from an abandoned local attempt survive importing a successful
  attempt for the same condition. Unreadable original storage is preserved;
  temporary work can be exported without overwriting it.
- Fractions inside SVG diagrams render as fractions rather than raw tokens.
  Mixed percentages have visible mixed numbers and conversion steps.
- 600 content records name a known, relevant practice skill. Expressions
  otherwise open order-of-operations practice. Unmapped questions open the
  practice menu with an honest “choose trainer” label, retaining the return
  link instead of claiming an unrelated topic match.
- 63 source answers explicitly require decimal, reduced ordinary fraction or
  ordinary fraction notation. Equivalent numbers in a disallowed notation are
  rejected; ordinary fractions in number 331 need not be reduced.
- CSV text cells neutralize spreadsheet formula prefixes. Rendering escapes
  authored and learner text. Imports are bounded and rechecked against source
  identities and numeric answers.

See also the [runtime review](PETERSON6_RUNTIME_REVIEW.md).

## Executed checks before the interruption

The following results were observed on the completed local implementation
before workspace maintenance. They are retained as historical evidence, not
automatically asserted as checks of a newly reconstructed commit. The final
handoff must name the recovered head and its rerun results.

| Check | Recorded result |
|---|---|
| New syntax, JSON inventory, source regions and image hashes | PASS |
| `node --test --test-isolation=none tools/peterson6-complete.test.cjs` | **15/15 PASS**, including 3330 generated cases |
| `python3 tools/peterson6-complete-math.py` | **431 expression trees PASS** |
| `python3 tools/peterson6-workshop-oracle.py` | **306 + 4 cases and 123 anchors PASS** |
| `node tools/peterson6-complete.dom.cjs` with jsdom 26.1 | **7/7 PASS** |
| Existing course build/content | **224 tasks, 333 steps PASS** |
| Existing course math/state/models | **6000 cases / 18000 steps; state and model checks PASS** |
| Existing course DOM | **224 tasks and 60 practice screens PASS** |
| Existing Maxim line regression | **15/15 PASS**, 27 source entries and 26 generated cases |
| Existing board models | **58 roundtrips / 205 rejections PASS** |
| Existing session/board/picker/cabinet code contracts | **43/43 PASS** |
| Existing pure registry | **25 cases PASS** |
| Sitemap unit tests | **12/12 PASS** |
| New/changed HTML metadata and local assets/links | PASS |
| Source builders, Python syntax and sanitized staged diff | PASS |

DOM tests are code tests, not visual browser evidence. The unchanged
board/cabinet contracts were checked in a temporary snapshot completed from
the same base tree because the working checkout was sparse.

Actual browser checks used the local preview: source/expression 181, guided
answer and microstep retention, original condition enlargement, motion 303
with its corrected practice link, and joint-work practice on a 390px frame.
Both narrow views had equal body scroll/client widths, with no page overflow.
Source enlargement provides its own horizontal pan. A captured preview showed
the condition, motion diagram and active step together. This historical visual
inspection does not imply that a lost screenshot remains downloadable.

### Failed, superseded or not run locally

- Initial missing-module board/cabinet checks were rerun successfully in the
  completed same-base snapshot; they were sparse-checkout load failures.
- Full sitemap/SEO/catalog checks could not complete in the sparse checkout
  because unchanged site sections such as `articles/` were absent. Scoped
  metadata checks passed; complete-checkout CI must run the full gates.
- Server registry integration could not load absent `socket.io-client`.
  The repository CI installs locked dependencies and must run that check.
- Real board browser integration was left to the existing CI job. No board
  runtime changes are included in this patch.
- No external Claude design consultation or exact-head external review was
  completed. No learner trial, deployment, pupil assignment or AI call occurred.

The pre-interruption local gate was **`PETERSON6_COMPLETE_LOCAL_OK`** for
complete source/content, arithmetic, persisted-work and scoped-interface
checks. Recovery reruns passed: unit/regression 15/15, DOM 7/7, independent
431 expression trees, 306 generated cases plus 4 fixed cases and 123 source
anchors, old Maxim line 15/15, and old course build. Source assets retain
their pinned hashes. The local gate is reissued for the recovered work.
This marker does not replace complete-checkout CI, the external-review
decision or the owner's explicit exact-base/head release authorization.

## Recovery provenance

Automated workspace maintenance removed the task checkout while a GitHub
integration call was stalled. The local commit
`0980952e07f11bd46fe9793599a55e8799bc23a2`, with tree
`3756c535244c3e9c8823f1fe9dab368e40ec2c4e`, had been created locally but was
not published. The remote task branch had not been created. These identifiers
are historical observations, not a current reachable PR head.

The surviving same-base verification snapshot preserves the source bank,
page assets, runtime, tools and review documents. Recovery restores that
snapshot, reapplies the recorded final metadata/format and regression changes,
and reruns the affected checks. The final new commit and rerun evidence belong
in the PR handoff. No byte-for-byte identity with the lost commit is claimed
without an actual tree comparison.

The completed pre-interruption patch contained **115 files: 31 textual files
and 84 image assets**. This is a reconciliation checkpoint; the recovered PR's
changed-file list remains authoritative. The source index hash above survives
in the snapshot and provides an independent source-region checkpoint.

## Cabinet and optional assistant

The [concrete proposal](PETERSON6_CABINET_ASSISTANT_PROPOSAL.md) defines two
primary course cards: full part 1 with its generated practice, and the separate
published Maxim line. Server-verified attempts/progress require a subsequent
scoped integration; browser totals must not be promoted to verified results.

The proposed assistant starts with the existing checked steps and hints. An
optional external API pilot would explain only the current pinned task/step,
using a server-held key, bounded requests and a prepared-hint fallback.
The math checker remains responsible for answers and completion. Provider,
budget, pupil assignment and real external transmission are not implemented
or authorized by this report.

## Release and rollback

The HIGH review policy requires independent review and current external review
or a new explicit owner exception. The previous PR #362 exception is not
reused. The release also needs separate owner authorization naming this PR,
base and head, followed by the repository's fresh-main base-drift guard.

Rollback is a separately authorized revert of this isolated addition and its
navigation links. Legacy course/Maxim identities and their stored data remain
unchanged. No new server migration or account change needs rollback.
