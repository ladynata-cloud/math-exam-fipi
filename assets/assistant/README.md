# MaxExam 0.0 — public navigation helper

[Task](../../docs/tasks/MATHEXAM_PUBLIC_ASSISTANT_V1.md) ·
[Current integration report](../../docs/reports/MATHEXAM_PUBLIC_ASSISTANT_INTEGRATION_20261031.md) ·
[Current Draft PR #385](https://github.com/ladynata-cloud/math-exam-fipi/pull/385) ·
[Original PR #361](https://github.com/ladynata-cloud/math-exam-fipi/pull/361)

This is a prepared static navigator. No language model is connected. It cannot
inspect the current exercise or check a pupil's answer. Publication requires the
separate exact-base/head release decision and the repository's HIGH review.

## Visitor behavior

A closed launcher opens a chat-style panel containing prepared navigation replies.
The 134-entry catalogue covers current arithmetic, OGE/EGE and public textbook
routes. Explicit exam/course choices take precedence over page context. Ambiguous
authors, classes and competing exams receive choices. Unknown courses are not
substituted with a different class or claimed complete.

Numbered requests retain the number through exam/level clarification, including
`ОГЭ №13` and `ЕГЭ профиль №3`. Several different numbers prompt a clarification
without assigning the first number to every exam. Requests about polynomials or
vectors do not silently enter elementary arithmetic. The prime-number table in
Vilenkin unit 6 and the existing Ichenskaya grade 7 collection have verified entries.

The short canonical division URL is retained. New NOD/NOK and arithmetic skill
entries match the current published routes. A query for Merzlyak 10 goes to the
actual grade-ten course. Navigation links remain ordinary visitor-chosen links;
the widget never redirects automatically or sends a message.

After two explicit learning difficulties it may offer `/lessons/#contact` once
in the current conversation, retaining a free self-study route. A direct tutor
request also opens that option. Refusal in either word order suppresses later
automatic offers. Access/login failures do not count as learning difficulty.
There are no claims about fees, availability or promised examination results.

## Privacy and isolation

The module makes no model/API/telemetry requests, reads no cookies or browser
storage, and never looks up accounts, grades, drawings, answers or page task state.
Only pathname context is used, never URL query/hash or a learner identifier.
Input is capped at 400 characters and visible history at 40 messages. Clearing
and pagehide discard that conversation. Common contact/credential patterns are
hidden with a generic reply; this is not a comprehensive personal-data detector.
All displayed input and responses are rendered as inert text.

The page still loads ordinary assets and may use independent analytics. Yandex
masking hooks are attached to the widget, log, form and input. They do not prove
protection from arbitrary same-page scripts or extensions. No blanket claim that
all scripts on the site cannot see entered text is made.

Shadow DOM isolates styles. Keys originating inside the widget are scoped to it;
keys elsewhere retain their original learner behavior. The mobile closed control
is 54px square/circular and keeps its full accessible name. Iframes, private and
board paths suppress the navigator even after accidental script inclusion.

## Coverage and preservation

`tools/public-assistant-pages.json` records 595 reviewed public documents:
528 of 531 sitemap pages plus 67 additional public documents. Discovery uses the
sitemap, current course/learning catalogues, public download source entries,
HTML anchors and reviewed JavaScript-only entries.

| Deliberately unchanged page | Reason |
| --- | --- |
| `geometry-course/textbook/index.html` | Existing implementation review binding. |
| `stereo-course/textbook/index.html` | Immutable released runtime baseline. |
| `school/peterson6/index.html` | Published task-aware Peterson helper. |
| `trainers/maxim-peterson6/index.html` | Published practice helper; outside sitemap. |

These are still valid navigation destinations. Neither protected textbook hashes
nor existing task-aware helpers are changed. Private cabinets, board wrappers,
teacher/source/archive pages, offline exports, redirects and empty placeholders
are excluded. A file's mere presence does not establish public admission.

Every eligible HTML page receives exactly one ordered deferred script pair.
Removing that exact block reproduces all 832 base HTML files byte-for-byte.
Existing lesson content, scripts, data, progress keys, URLs, canonical metadata,
robots and sitemap remain unchanged. The stereo generator emits the same block;
the Pogorelov offline exporter removes only that exact optional block and rejects
unexpected helper markup, reproducing the base standalone output exactly.

## Verification and maintenance

```sh
node tools/public-assistant-data.test.cjs
python3 tools/public-assistant-coverage.test.py
python3 tools/public-assistant-coverage.py --check
python3 tools/seo-sitemap.test.py
python3 tools/build-sitemap.py --check
python3 tools/seo-check.py
node tools/public-assistant-browser.test.cjs
```

The browser test uses the pinned Playwright 1.62.1 runtime in the
[workflow](../../.github/workflows/public-assistant.yml). All questions are
synthetic and the test server is local. It verifies actual pointer hits, bounded
mobile layouts, keyboard/privacy behavior, existing helper suppression and
preservation of learner drafts/progress. Runtime admission also covers every
manifest path and its directory alias.

For a new approved public page, review discovery evidence first, then run
`python3 tools/public-assistant-coverage.py --write` and inspect the exact diff.
The coverage gate rejects duplicate/malformed blocks, unknown exclusions and
manifest drift. It never authorizes changing a private or protected page.

Narrow fixture changes resolve resources as browser URLs and recognize only the
exact script pair. Original mathematical/source/order/unknown-resource assertions
remain. Task6's immutable historical scope is checked against its original
commits, explicitly fetched in CI. This integration does not port the old PR's
unrelated shared-CSS change or alter downloadable practical archives.

The integration report separates fresh passes, failures and checks not run.
Pre-existing 320px overflows in a percentages route and practical diagnostic
have been reproduced locally with and without the widget. Both complete cloud
suites pass in the CI environment; the local failures remain explicitly recorded.
Existing Atanasyan/Ichenskaya source-pin failures and their separate proposed fix
in PR #375 are also distinguished from this component's compatibility fixes.
Cloud results must match the final head. Internal review is not external approval.

## Release and rollback

No new server is required to serve these static files. Optional paid inference,
model training, real pupil activation and independent assistant-service resources
remain separate work. A green navigator check is not merge/deployment permission.

Rollback removes only the exact marked block from the manifest pages, followed
by source-byte, coverage, SEO and affected browser checks. It requires no data
migration or deletion of learner work or the private assistant's accounting
ledger. Keep unrelated course, backend and hosting changes out of the rollback.
