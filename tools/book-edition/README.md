# Fixed OGE book prototype

The architecture is **Proposed** in
[ADR 0012](../../docs/adr/0012-fixed-oge-book-editions.md). This folder's integrity
gate is separate from the full learner audit and from permission to publish.

## Candidate build

```sh
python3 scripts/build-oge-book-edition.py
python3 scripts/build-oge-book-edition.py --check
python3 tools/book-edition/verify.py --base <exact-PR-base-SHA>
python3 tools/book-edition/test_package.py
node tools/book-edition/runtime.browser.cjs
```

Run from the repository root. The browser check requires Playwright Chromium;
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an installed executable and
`BOOK_EDITION_ARTIFACTS` can select the evidence directory. It otherwise writes
`artifacts/book-edition/runtime.json`. Evidence records actual failures and
observed horizontal overflow, and is not a universal mobile/learner pass.
`BOOK_ISOLATION_ONLY=1` skips the entry sweep and runs only boundary regressions.

The exact 71-entry mapping is
`scripts/oge-book-edition/urls.json`; the identical frozen mapping is
`book/oge/2026-10-31/v1/url-map.json`. Canonical content paths preserve the source
tree. Short `/b/oge26-1/NN/` aliases preserve query strings and fragments. The
legacy inequality redirect is included and preserves them at its second hop.

The builder refuses to rewrite a namespace present on `origin/main`. The
authoritative CI check compares against the actual PR base, not that local
tracking ref. Before merging, the repository's independent base-drift release
guard still applies. After a version is published, a correction must use new
prefixes, aliases and storage namespace. Do not edit the old copies or reuse
their short addresses.

## What is fixed

The manifest hashes the whole bounded source closure and every emitted file.
It includes the source input hashes, build recipe hashes, canonical metadata,
short targets and dependency graph. Dynamic loader files and computed FIPI
image filenames have explicit closure handling. HTML copies are `noindex` and
retain the exact original canonical; they do not enter the public sitemap.

Optional analytics, downloadable-package panels, cabinet return adapters and
remote board integrations are removed. The standalone loader and contextual
help remain. Roads-grid requires the original validator, so its fixed copy
keeps that module with an always-inert registration branch. External Google
font requests are removed in favor of the source system-font fallbacks.

The startup boundary namespaces both Web Storage APIs. It supports method and
named-property access, enumeration, deletion, scoped clearing and the native
storage-unavailable error path. Cross-tab events expose logical keys to the
existing trainer guards and filter unrelated public-trainer changes. The
boundary is a compatibility adapter, not a security isolation mechanism from
all other same-origin code. It creates no cloud result records.

Included links stay inside the edition. Other instructional/contact links get
a visible “вне книги” marker. Source citations remain citations; they are not
silently called immutable instructional assets. Browser network policy forbids
API requests, and the runtime gate rejects resources outside the frozen paths.

## What the checks prove

`verify.py` checks listed bytes, required files, original canonicals, noindex,
resource paths, early storage startup, alias targets and namespace registration.
Its append-only step reads the **old manifests and Git blobs from the supplied
base**, so editing both a frozen file and its proposed checksum does not pass.
It also rejects adding a new file inside an old edition.

Negative tests exercise byte edits, recomputed-checksum edits, removals,
additions, mutable-resource references and alias-target substitution. The
browser test visits all 71 short URLs at 320 and 1280 px, records actual network
requests, checks a real division step through reload, public-result isolation,
storage APIs, cross-tab events, short redirects and dynamic reference images.

The full task registry separately records each page's correct/wrong answer,
help, next task, completion, saved result and mobile usability. A hash, a loaded
page or a saved probe is never substituted for those learner scenarios.
