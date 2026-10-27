# MaxExam 0.0 — public navigation helper

Task: [MATHEXAM_PUBLIC_ASSISTANT_V1](../../docs/tasks/MATHEXAM_PUBLIC_ASSISTANT_V1.md).
This is a prepared static navigator, not a live language model or a release.

## Visitor behavior

The closed launcher opens an accessible chat-style panel. Prepared rules select
checked materials using the visitor's question and the current pathname. The
helper can find courses, decimal practice, triangle congruence, OGE/EGE topics,
the existing cabinet entrance and the tutor contact section. It offers choices
when an author, level or topic is ambiguous. It cannot inspect or solve the
current exercise, read grades or certify an arbitrary proof.

A tutor link can appear after two explicit learning difficulties, once in the
current page conversation, while a simpler self-study option remains available.
An explicit request for a tutor shows the contact route directly. Declining the
offer suppresses further automatic offers until the chat is cleared. Login and
navigation problems do not increment the learning-difficulty counter. Clicking
a link is the visitor's choice; the helper never sends a message or redirects
automatically. It makes no promise about fees, availability or exam results.

## Data and spending

There are no model requests, provider credentials, telemetry calls, cookies or
chat persistence in this module. It never reads query/hash parameters, browser
storage, cabinet data, drawings or answers from the page. Input is limited to
400 characters and the visible log to 40 messages. Clearing, page navigation
and pagehide discard the conversation. Common contact/credential patterns are
replaced with a generic hidden-input message; this is not a comprehensive
personal-data detector. All rendered text uses textContent.

The application still loads its ordinary page assets and may have independent
analytics. Yandex masking classes are attached to the helper, log, form and
input. These classes and Shadow DOM do not establish protection from arbitrary
same-page scripts, a browser extension or an external recorder. Review actual
production analytics and applicable data conditions before rollout. Never tell
visitors that no script on the site could see their text.

Prepared replies and the link catalogue are versioned source. They do not update
the assistant service's knowledge, collect training examples, alter weights or
call three teaching models in the background. The independent private assistant
and cabinet gateway retain their separate permissions and spending controls.

## Coverage and maintenance

`tools/public-assistant-pages.json` records 594 reviewed public documents:
528 sitemap pages and 66 additional public course/trainer documents. Discovery
uses the sitemap, course and learning catalogues, public download source entries,
real HTML anchors and explicitly reviewed JavaScript-only entry points.

Private cabinets, board wrappers, teacher/source pages, archives, offline exports,
redirects and empty placeholders are excluded. In particular, several existing
multiplication-table documents are empty; the helper routes those intents to
working multiplication materials. Existing catalogues are not rewritten here.
An existing but unlisted/unreviewed HTML file is not automatically a public entry.

Each eligible HTML document gets one exact block with data.js before widget.js.
The stylesheet loads inside the widget's Shadow DOM, so trainer styles are not
replaced. The widget is suppressed in iframes and known private/board paths.
The coverage gate rejects extra inclusions, malformed/duplicate blocks, missing
sitemap pages and manifest drift. The initial integration also proves that all
828 existing HTML files retain every original byte after the block is removed.

```sh
node tools/public-assistant-data.test.cjs
python3 tools/public-assistant-coverage.test.py
python3 tools/public-assistant-coverage.py --check
python3 tools/seo-sitemap.test.py
python3 tools/build-sitemap.py --check
python3 tools/seo-check.py
node tools/public-assistant-browser.test.cjs
```

The browser test needs the pinned Playwright runtime; see
[the CI workflow](../../.github/workflows/public-assistant.yml). It starts only a
temporary local static server. No model or real pupil account is used.

For a future approved public page, review the discovery evidence first, then run
`python3 tools/public-assistant-coverage.py --write` and inspect the manifest and
HTML diff. This does not authorize publishing previously private or empty pages.
Future generators must preserve or reapply the block; CI catches dropped wiring.

## Release and rollback

The branch is stacked on the unmerged cabinet preparation. Passing local checks
or CI is not permission to merge or deploy. HIGH review, an exact-head external
review (or explicit reasoned owner waiver), and separate release authorization
remain required by repository policy.

Removing the exact marked block from the manifest's documents removes the public
launcher without a data migration or change to trainer state. Retain the rest of
each source byte-for-byte. Then rerun SEO and affected browser checks under an
approved rollback task. Do not delete the independent assistant's data or budget
ledger as part of a public-UI rollback.

No new Amvera service is needed to serve these static assets. The optional model
service remains independently packaged and initially single-process. Before
adding replicas, review shared session/accounting storage and concurrency; adding
instances must not reset global budgets. Video and the private assistant remain
separate resource decisions. The existing board/cabinet coupling is unchanged.
